/**
 * XP / level / streak math. Deliberately simple and deterministic, same
 * spirit as engine/mastery.ts -- an auditable formula, not a black box.
 */
import type { ResponseClassification } from '../types/evaluation';
import type { FieldTestDimensionResult } from '../types/fieldTest';
import type { LevelInfo, StreakState } from '../types/gamification';

export const XP_BY_CLASSIFICATION: Record<ResponseClassification, number> = {
  CORRECT: 10,
  FUNCTIONAL: 8,
  PARTIAL: 3,
  FAILED: 0,
};

export const SESSION_COMPLETION_XP = 50;
export const FIELD_TEST_DIMENSION_XP_MULTIPLIER = 10;

export function xpForClassification(classification: ResponseClassification): number {
  return XP_BY_CLASSIFICATION[classification];
}

export function xpForFieldTest(dimensionResults: FieldTestDimensionResult[]): number {
  return dimensionResults.reduce((sum, d) => sum + d.score * FIELD_TEST_DIMENSION_XP_MULTIPLIER, 0);
}

/** Cumulative XP required to *reach* this level (level 1 = 0 XP). Triangular
 * growth -- each level costs a little more than the last, RPG-style. */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  const n = level - 1;
  return 50 * ((n * (n + 1)) / 2);
}

export function levelForXP(totalXP: number): LevelInfo {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= totalXP) {
    level += 1;
  }
  const xpAtLevelStart = xpRequiredForLevel(level);
  const xpAtNextLevel = xpRequiredForLevel(level + 1);
  return {
    level,
    xpIntoLevel: totalXP - xpAtLevelStart,
    xpForThisLevel: xpAtNextLevel - xpAtLevelStart,
    xpTotal: totalXP,
  };
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function isConsecutiveDay(previousDateOnly: string, currentDateOnly: string): boolean {
  const prev = new Date(`${previousDateOnly}T00:00:00.000Z`).getTime();
  const curr = new Date(`${currentDateOnly}T00:00:00.000Z`).getTime();
  return curr - prev === 24 * 60 * 60 * 1000;
}

/**
 * Updates a daily practice streak. Multiple sessions on the same calendar
 * day don't inflate the streak; a gap of more than one day resets it.
 */
export function updateStreak(previous: StreakState, nowISO: string): { streak: StreakState; extended: boolean } {
  const today = dateOnly(nowISO);
  if (previous.lastPracticeDate === today) {
    return { streak: previous, extended: false };
  }
  const isConsecutive = previous.lastPracticeDate !== null && isConsecutiveDay(previous.lastPracticeDate, today);
  const currentStreakDays = isConsecutive ? previous.currentStreakDays + 1 : 1;
  const longestStreakDays = Math.max(previous.longestStreakDays, currentStreakDays);
  return {
    streak: { currentStreakDays, longestStreakDays, lastPracticeDate: today },
    extended: true,
  };
}
