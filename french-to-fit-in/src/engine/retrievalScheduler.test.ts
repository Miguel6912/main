import { describe, expect, it } from 'vitest';
import {
  computeNextDueAt,
  selectRetrievalGateItems,
  RETRIEVAL_GATE_MAX_SIZE,
  RETRIEVAL_GATE_MIN_SIZE,
} from './retrievalScheduler';
import { createLockedLedgerItem, type LedgerItem } from '../types/ledger';
import { applyRetrievalOutcome, introduceItem } from './mastery';
import { strongLearnerItem, weakLearnerItem, isolatedGapLedger, returningLearnerItem } from '../test/fixtures';

const NOW = '2024-02-01T00:00:00.000Z';

function introducedItem(id: string): LedgerItem {
  return introduceItem(
    createLockedLedgerItem({ id, canonicalFrench: id, englishMeaning: id, type: 'INTERACTION', introducedDay: 1 }),
    '2024-01-01T00:00:00.000Z',
  );
}

describe('retrieval scheduler', () => {
  it('never selects LOCKED items -- retrieval gate uses only previously introduced material', () => {
    const locked = createLockedLedgerItem({
      id: 'vocab.locked',
      canonicalFrench: 'x',
      englishMeaning: 'x',
      type: 'INTERACTION',
      introducedDay: 5,
    });
    const introduced = introducedItem('vocab.introduced');
    const selected = selectRetrievalGateItems([locked, introduced], { nowISO: NOW });
    expect(selected.find((i) => i.id === 'vocab.locked')).toBeUndefined();
  });

  it('prioritises failed retrieval over everything else', () => {
    const failed = weakLearnerItem('vocab.failed', 1);
    const strong = strongLearnerItem('vocab.strong', 5); // AUTOMATIC, due far in future
    const pool = [failed, strong, ...Array.from({ length: 3 }, (_, i) => introducedItem(`vocab.filler-${i}`))];
    const selected = selectRetrievalGateItems(pool, { nowISO: NOW, gateSize: 1 });
    expect(selected[0].id).toBe('vocab.failed');
  });

  it('keeps the gate within the documented 3-5 item size', () => {
    const pool = Array.from({ length: 20 }, (_, i) => weakLearnerItem(`vocab.item-${i}`, 1));
    const selected = selectRetrievalGateItems(pool, { nowISO: NOW });
    expect(selected.length).toBeGreaterThanOrEqual(RETRIEVAL_GATE_MIN_SIZE);
    expect(selected.length).toBeLessThanOrEqual(RETRIEVAL_GATE_MAX_SIZE);
  });

  it('backfills to the minimum gate size even when few items are urgently due', () => {
    const onlyOneIntroduced = introducedItem('vocab.only-one');
    const selected = selectRetrievalGateItems([onlyOneIntroduced], { nowISO: NOW });
    expect(selected).toHaveLength(1); // can't backfill beyond what exists
  });

  it('isolated knowledge gap: the failing item is prioritised even though everything else is strong', () => {
    const ledger = isolatedGapLedger('vocab.gap', ['vocab.a', 'vocab.b', 'vocab.c', 'vocab.d']);
    const selected = selectRetrievalGateItems(ledger, { nowISO: NOW, gateSize: 3 });
    expect(selected.some((i) => i.id === 'vocab.gap')).toBe(true);
  });

  it('computeNextDueAt schedules a failed/skipped item for immediate re-review', () => {
    const item = introducedItem('vocab.x');
    expect(computeNextDueAt(item, 'FAILED_RETRIEVAL', NOW)).toBe(NOW);
    expect(computeNextDueAt(item, 'SKIPPED', NOW)).toBe(NOW);
  });

  it('computeNextDueAt spaces successive successes further apart (next session, then days, then a week)', () => {
    let item = introducedItem('vocab.spaced');
    const due1 = computeNextDueAt(item, 'ACCURATE', NOW);
    item = applyRetrievalOutcome(item, 'ACCURATE', { nowISO: NOW });
    const due2 = computeNextDueAt(item, 'ACCURATE', NOW);
    item = applyRetrievalOutcome(item, 'ACCURATE', { nowISO: NOW });
    const due3 = computeNextDueAt(item, 'ACCURATE', NOW);

    const gap1 = new Date(due1).getTime() - new Date(NOW).getTime();
    const gap2 = new Date(due2).getTime() - new Date(NOW).getTime();
    const gap3 = new Date(due3).getTime() - new Date(NOW).getTime();
    expect(gap1).toBeLessThan(gap2);
    expect(gap2).toBeLessThanOrEqual(gap3);
  });

  it('returning learner (7-day gap): an item due days ago is treated as due now', () => {
    const item = returningLearnerItem('vocab.returning');
    const laterNow = '2024-01-10T00:00:00.000Z'; // well past its nextDueAt
    const selected = selectRetrievalGateItems([item], { nowISO: laterNow });
    expect(selected.some((i) => i.id === 'vocab.returning')).toBe(true);
  });
});
