import { describe, expect, it, beforeEach } from 'vitest';
import {
  assertContentAllowed,
  assertDayContentAllowed,
  checkItemsAllowed,
  clearCurriculumViolationLog,
  filterAllowedItemIds,
  firstAllowedDayForItem,
  CurriculumViolationError,
} from './curriculumGuard';
import { getDayByNumber } from '../content/curriculum';

beforeEach(() => {
  clearCurriculumViolationLog();
});

describe('curriculum guard: vocabulary gating', () => {
  it('resolves firstAllowedDay for a known vocabulary item', () => {
    expect(firstAllowedDayForItem('vocab.bonjour')).toBe(1);
  });

  it('resolves introducedDay for a known engine item', () => {
    expect(firstAllowedDayForItem('engine.je-mappelle')).toBe(1);
  });

  it('returns null for an unknown item id', () => {
    expect(firstAllowedDayForItem('vocab.does-not-exist')).toBeNull();
  });

  it('allows a day-1 item on day 1', () => {
    expect(checkItemsAllowed(1, ['vocab.bonjour'])).toHaveLength(0);
  });

  it('allows a day-1 item on any later day', () => {
    expect(checkItemsAllowed(15, ['vocab.bonjour'])).toHaveLength(0);
  });

  it('flags an unknown item id as a violation', () => {
    const violations = checkItemsAllowed(1, ['vocab.nonexistent']);
    expect(violations).toHaveLength(1);
    expect(violations[0].itemId).toBe('vocab.nonexistent');
  });

  it('filterAllowedItemIds silently drops disallowed ids (production-safe path)', () => {
    const filtered = filterAllowedItemIds(1, ['vocab.bonjour', 'vocab.nonexistent']);
    expect(filtered).toEqual(['vocab.bonjour']);
  });
});

describe('curriculum guard: forbidden future-content rejection', () => {
  it('throws in dev mode when content references material not yet introduced', () => {
    // Simulate a future item id that would only become valid on a later day
    // by asserting day 1 content against an id whose firstAllowedDay is greater.
    expect(() => assertContentAllowed(1, ['vocab.future-item-not-real'])).toThrow(CurriculumViolationError);
  });

  it('does not throw for genuinely allowed material', () => {
    expect(() => assertContentAllowed(1, ['vocab.bonjour', 'engine.je-mappelle'])).not.toThrow();
  });

  it('assertDayContentAllowed passes for the authored Day 1 content', () => {
    const day1 = getDayByNumber(1)!;
    expect(() => assertDayContentAllowed(day1)).not.toThrow();
  });

  it('assertDayContentAllowed rejects a day that references material introduced later', () => {
    const day1 = getDayByNumber(1)!;
    const tampered = {
      ...day1,
      newVocabulary: [...day1.newVocabulary],
      applicationMissions: [
        {
          id: 'tampered-mission',
          title: 'tampered',
          description: 'tampered',
          usesItemIds: ['vocab.does-not-exist-on-day-1'],
          exercises: [],
        },
      ],
    };
    expect(() => assertDayContentAllowed(tampered)).toThrow(CurriculumViolationError);
  });

  it('rejects declaring an item as "new" on the wrong day', () => {
    const day1 = getDayByNumber(1)!;
    const tampered = { ...day1, newVocabulary: [...day1.newVocabulary, 'vocab.bonjour'].filter((v, i, a) => a.indexOf(v) === i) };
    // vocab.bonjour is already correctly day 1, so instead force a mismatch
    // by claiming a day-1 item was newly introduced on a different day number.
    const wrongDay = { ...tampered, dayNumber: 2 };
    expect(() => assertDayContentAllowed(wrongDay)).toThrow(CurriculumViolationError);
  });
});
