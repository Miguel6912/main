import { describe, expect, it } from 'vitest';
import {
  applyRetrievalOutcome,
  automaticityBand,
  introduceItem,
  justBecameAutomatic,
  justLostAutomaticity,
  AUTOMATIC_SCORE_THRESHOLD,
} from './mastery';
import { createLockedLedgerItem } from '../types/ledger';

function freshLockedItem() {
  return createLockedLedgerItem({
    id: 'vocab.test',
    canonicalFrench: 'test',
    englishMeaning: 'test',
    type: 'INTERACTION',
    introducedDay: 1,
  });
}

describe('mastery / automaticity model', () => {
  it('starts LOCKED and moves to INTRODUCED exactly once', () => {
    const locked = freshLockedItem();
    expect(locked.status).toBe('LOCKED');
    const introduced = introduceItem(locked, '2024-01-01T00:00:00.000Z');
    expect(introduced.status).toBe('INTRODUCED');
    expect(introduced.introducedAt).toBe('2024-01-01T00:00:00.000Z');
    // introducing again is a no-op (idempotent)
    const introducedAgain = introduceItem(introduced, '2099-01-01T00:00:00.000Z');
    expect(introducedAgain.introducedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('moves INTRODUCED -> RETRIEVED on the first successful retrieval', () => {
    let item = introduceItem(freshLockedItem(), '2024-01-01T00:00:00.000Z');
    item = applyRetrievalOutcome(item, 'ACCURATE');
    expect(item.status).toBe('RETRIEVED');
    expect(item.successfulRetrievals).toBe(1);
  });

  it('moves to REUSED only when a success happens in a materially different context', () => {
    let item = introduceItem(freshLockedItem(), '2024-01-01T00:00:00.000Z');
    item = applyRetrievalOutcome(item, 'ACCURATE'); // RETRIEVED
    expect(item.status).toBe('RETRIEVED');
    item = applyRetrievalOutcome(item, 'ACCURATE', { isNewContext: true });
    expect(item.status).toBe('REUSED');
    expect(item.reuseCount).toBe(1);
  });

  it('strong learner: repeated success eventually reaches AUTOMATIC', () => {
    let item = introduceItem(freshLockedItem(), '2024-01-01T00:00:00.000Z');
    for (let i = 0; i < 10; i++) {
      item = applyRetrievalOutcome(item, 'ACCURATE');
    }
    expect(item.automaticityScore).toBeGreaterThanOrEqual(AUTOMATIC_SCORE_THRESHOLD);
    expect(item.status).toBe('AUTOMATIC');
  });

  it('weak learner: repeated failure keeps automaticity low and status at INTRODUCED', () => {
    let item = introduceItem(freshLockedItem(), '2024-01-01T00:00:00.000Z');
    for (let i = 0; i < 5; i++) {
      item = applyRetrievalOutcome(item, 'FAILED_RETRIEVAL');
    }
    expect(item.automaticityScore).toBeLessThan(0.3);
    expect(item.status).toBe('INTRODUCED');
    expect(item.failedRetrievals).toBe(5);
  });

  it('a course day completing does not itself grant AUTOMATIC (only sustained retrieval does)', () => {
    const item = introduceItem(freshLockedItem(), '2024-01-01T00:00:00.000Z');
    expect(item.status).not.toBe('AUTOMATIC');
  });

  it('automaticity decays modestly and can be lost after later failures', () => {
    let item = introduceItem(freshLockedItem(), '2024-01-01T00:00:00.000Z');
    for (let i = 0; i < 10; i++) item = applyRetrievalOutcome(item, 'ACCURATE');
    expect(item.status).toBe('AUTOMATIC');
    const automaticSnapshot = item;

    for (let i = 0; i < 4; i++) item = applyRetrievalOutcome(item, 'FAILED_RETRIEVAL');
    expect(item.automaticityScore).toBeLessThan(automaticSnapshot.automaticityScore);
    expect(justLostAutomaticity(automaticSnapshot, item)).toBe(true);
    expect(item.status).not.toBe('AUTOMATIC');
  });

  it('justBecameAutomatic fires exactly on the transition, not before or after', () => {
    let item = introduceItem(freshLockedItem(), '2024-01-01T00:00:00.000Z');
    let becameAutomaticCount = 0;
    for (let i = 0; i < 12; i++) {
      const before = item;
      item = applyRetrievalOutcome(item, 'ACCURATE');
      if (justBecameAutomatic(before, item)) becameAutomaticCount += 1;
    }
    expect(becameAutomaticCount).toBe(1);
  });

  it('does not punish partial/meaning-preserved answers as harshly as full failure', () => {
    let strict = introduceItem(freshLockedItem(), '2024-01-01T00:00:00.000Z');
    let lenient = introduceItem(freshLockedItem(), '2024-01-01T00:00:00.000Z');
    strict = applyRetrievalOutcome(strict, 'FAILED_RETRIEVAL');
    lenient = applyRetrievalOutcome(lenient, 'MEANING_PRESERVED_IMPERFECT');
    expect(lenient.automaticityScore).toBeGreaterThan(strict.automaticityScore);
  });

  it('automaticityBand maps scores to the four UI-facing bands', () => {
    expect(automaticityBand(0)).toBe('Introduced');
    expect(automaticityBand(0.3)).toBe('Building');
    expect(automaticityBand(0.65)).toBe('Reliable');
    expect(automaticityBand(0.9)).toBe('Automatic');
  });
});
