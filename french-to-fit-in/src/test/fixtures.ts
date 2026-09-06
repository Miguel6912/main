import { createLockedLedgerItem, type LedgerItem } from '../types/ledger';
import { applyRetrievalOutcome, introduceItem } from '../engine/mastery';

function baseItem(id: string): LedgerItem {
  return createLockedLedgerItem({
    id,
    canonicalFrench: id,
    englishMeaning: id,
    type: 'INTERACTION',
    introducedDay: 1,
  });
}

/** A learner who has succeeded at every retrieval attempt on this item. */
export function strongLearnerItem(id: string, attempts = 5): LedgerItem {
  let item = introduceItem(baseItem(id), '2024-01-01T00:00:00.000Z');
  for (let i = 0; i < attempts; i++) {
    item = applyRetrievalOutcome(item, 'ACCURATE', { nowISO: `2024-01-0${i + 1}T00:00:00.000Z` });
  }
  return item;
}

/** A learner who has repeatedly failed this item. */
export function weakLearnerItem(id: string, attempts = 5): LedgerItem {
  let item = introduceItem(baseItem(id), '2024-01-01T00:00:00.000Z');
  for (let i = 0; i < attempts; i++) {
    item = applyRetrievalOutcome(item, 'FAILED_RETRIEVAL', { nowISO: `2024-01-0${i + 1}T00:00:00.000Z` });
  }
  return item;
}

/** A learner who is strong everywhere except one isolated gap item. */
export function isolatedGapLedger(gapId: string, strongIds: string[]): LedgerItem[] {
  return [weakLearnerItem(gapId, 3), ...strongIds.map((id) => strongLearnerItem(id, 3))];
}

/** A learner returning after a 7-day gap: last practised a week ago. */
export function returningLearnerItem(id: string): LedgerItem {
  let item = introduceItem(baseItem(id), '2024-01-01T00:00:00.000Z');
  item = applyRetrievalOutcome(item, 'ACCURATE', { nowISO: '2024-01-01T00:00:00.000Z' });
  // nextDueAt would have been set a few days out by the scheduler in real
  // use; simulate that here directly.
  item = { ...item, nextDueAt: '2024-01-04T00:00:00.000Z' };
  return item;
}
