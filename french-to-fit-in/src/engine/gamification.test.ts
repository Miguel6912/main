import { describe, expect, it } from 'vitest';
import { levelForXP, updateStreak, xpForClassification, xpForFieldTest, xpRequiredForLevel } from './gamification';

describe('gamification: XP awarding', () => {
  it('awards more XP for stronger classifications and none for failure', () => {
    expect(xpForClassification('CORRECT')).toBeGreaterThan(xpForClassification('FUNCTIONAL'));
    expect(xpForClassification('FUNCTIONAL')).toBeGreaterThan(xpForClassification('PARTIAL'));
    expect(xpForClassification('PARTIAL')).toBeGreaterThan(xpForClassification('FAILED'));
    expect(xpForClassification('FAILED')).toBe(0);
  });

  it('sums field-test XP across dimensions, weighted by score', () => {
    const xp = xpForFieldTest([
      { dimension: 'RETRIEVAL', score: 3, notes: '' },
      { dimension: 'CONTROL', score: 0, notes: '' },
    ]);
    expect(xp).toBeGreaterThan(0);
    const zeroXp = xpForFieldTest([
      { dimension: 'RETRIEVAL', score: 0, notes: '' },
      { dimension: 'CONTROL', score: 0, notes: '' },
    ]);
    expect(zeroXp).toBe(0);
  });
});

describe('gamification: leveling', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(levelForXP(0).level).toBe(1);
  });

  it('requires progressively more XP for each subsequent level', () => {
    const gap1 = xpRequiredForLevel(2) - xpRequiredForLevel(1);
    const gap2 = xpRequiredForLevel(3) - xpRequiredForLevel(2);
    const gap3 = xpRequiredForLevel(4) - xpRequiredForLevel(3);
    expect(gap2).toBeGreaterThan(gap1);
    expect(gap3).toBeGreaterThan(gap2);
  });

  it('levelForXP is internally consistent with xpRequiredForLevel', () => {
    const targetLevel = 6;
    const xpAtLevel = xpRequiredForLevel(targetLevel);
    const info = levelForXP(xpAtLevel);
    expect(info.level).toBe(targetLevel);
    expect(info.xpIntoLevel).toBe(0);

    const infoJustBefore = levelForXP(xpAtLevel - 1);
    expect(infoJustBefore.level).toBe(targetLevel - 1);
  });

  it('never regresses level for increasing XP', () => {
    let previousLevel = 1;
    for (let xp = 0; xp <= 5000; xp += 137) {
      const level = levelForXP(xp).level;
      expect(level).toBeGreaterThanOrEqual(previousLevel);
      previousLevel = level;
    }
  });
});

describe('gamification: daily streak', () => {
  const DAY1 = '2024-03-01T09:00:00.000Z';
  const DAY2 = '2024-03-02T08:00:00.000Z';
  const DAY3 = '2024-03-03T22:00:00.000Z';
  const DAY5 = '2024-03-05T09:00:00.000Z'; // gap (missed day 4)

  const fresh = { currentStreakDays: 0, longestStreakDays: 0, lastPracticeDate: null };

  it('first practice ever starts a 1-day streak', () => {
    const { streak, extended } = updateStreak(fresh, DAY1);
    expect(streak.currentStreakDays).toBe(1);
    expect(streak.longestStreakDays).toBe(1);
    expect(extended).toBe(true);
  });

  it('practicing again the same day does not inflate the streak', () => {
    const { streak: afterDay1 } = updateStreak(fresh, DAY1);
    const { streak: sameDayAgain, extended } = updateStreak(afterDay1, '2024-03-01T20:00:00.000Z');
    expect(sameDayAgain.currentStreakDays).toBe(1);
    expect(extended).toBe(false);
  });

  it('practicing on the very next calendar day extends the streak', () => {
    const { streak: afterDay1 } = updateStreak(fresh, DAY1);
    const { streak: afterDay2 } = updateStreak(afterDay1, DAY2);
    expect(afterDay2.currentStreakDays).toBe(2);
    const { streak: afterDay3 } = updateStreak(afterDay2, DAY3);
    expect(afterDay3.currentStreakDays).toBe(3);
    expect(afterDay3.longestStreakDays).toBe(3);
  });

  it('a returning learner with a gap resets the streak to 1, but keeps the longest-streak record', () => {
    const { streak: afterDay1 } = updateStreak(fresh, DAY1);
    const { streak: afterDay2 } = updateStreak(afterDay1, DAY2);
    const { streak: afterDay3 } = updateStreak(afterDay2, DAY3);
    const { streak: afterGap } = updateStreak(afterDay3, DAY5);
    expect(afterGap.currentStreakDays).toBe(1);
    expect(afterGap.longestStreakDays).toBe(3);
  });
});
