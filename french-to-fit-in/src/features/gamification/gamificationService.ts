/**
 * Gamification write path: the only place session/field-test completion
 * should touch XP, level, streak, and badge state. Mirrors the shape of
 * features/ledger/ledgerService.ts.
 */
import { getAppMeta, updateAppMeta } from '../../storage/metaStore';
import { getAllLedgerItems } from '../../storage/ledgerStore';
import { getAllSessionRecords } from '../../storage/sessionStore';
import { levelForXP, updateStreak, xpForFieldTest } from '../../engine/gamification';
import { BADGES, getBadgeById } from '../../content/badges';
import type { FieldTestDimensionResult } from '../../types/fieldTest';
import type { BadgeDefinition, GamificationOutcome } from '../../types/gamification';

async function currentAutomaticCount(): Promise<number> {
  const items = await getAllLedgerItems();
  return items.filter((i) => i.status === 'AUTOMATIC').length;
}

async function completedSessionCount(): Promise<number> {
  const sessions = await getAllSessionRecords();
  return sessions.filter((s) => s.completedAt !== null).length;
}

function unlockBadge(earned: Set<string>, id: string, newlyEarned: BadgeDefinition[]): void {
  if (earned.has(id)) return;
  const badge = getBadgeById(id);
  if (!badge) return;
  earned.add(id);
  newlyEarned.push(badge);
}

async function applyGamification(params: {
  xpEarned: number;
  countsAsPractice: boolean;
  dayNumberJustCompleted?: number;
  fieldTestJustPassed?: boolean;
  nowISO?: string;
}): Promise<GamificationOutcome> {
  const nowISO = params.nowISO ?? new Date().toISOString();
  const meta = await getAppMeta();

  const totalXP = meta.totalXP + params.xpEarned;
  const levelBefore = levelForXP(meta.totalXP);
  const levelAfter = levelForXP(totalXP);

  const streakBefore = {
    currentStreakDays: meta.currentStreakDays,
    longestStreakDays: meta.longestStreakDays,
    lastPracticeDate: meta.lastPracticeDate,
  };
  const { streak, extended } = params.countsAsPractice
    ? updateStreak(streakBefore, nowISO)
    : { streak: streakBefore, extended: false };

  const earned = new Set(meta.earnedBadgeIds);
  const newlyEarnedBadges: BadgeDefinition[] = [];

  if (params.countsAsPractice) {
    const sessionsCompleted = await completedSessionCount();
    if (sessionsCompleted >= 1) unlockBadge(earned, 'badge.first-session', newlyEarnedBadges);
  }
  if (streak.currentStreakDays >= 3) unlockBadge(earned, 'badge.streak-3', newlyEarnedBadges);
  if (streak.currentStreakDays >= 7) unlockBadge(earned, 'badge.streak-7', newlyEarnedBadges);
  if (streak.currentStreakDays >= 30) unlockBadge(earned, 'badge.streak-30', newlyEarnedBadges);
  if (params.dayNumberJustCompleted === 7) unlockBadge(earned, 'badge.week-1-complete', newlyEarnedBadges);
  if (params.fieldTestJustPassed) unlockBadge(earned, 'badge.field-test-pass', newlyEarnedBadges);
  if (levelAfter.level >= 5) unlockBadge(earned, 'badge.level-5', newlyEarnedBadges);
  if (levelAfter.level >= 10) unlockBadge(earned, 'badge.level-10', newlyEarnedBadges);

  const automaticCount = await currentAutomaticCount();
  if (automaticCount >= 5) unlockBadge(earned, 'badge.automatic-5', newlyEarnedBadges);
  if (automaticCount >= 20) unlockBadge(earned, 'badge.automatic-20', newlyEarnedBadges);

  await updateAppMeta({
    totalXP,
    currentStreakDays: streak.currentStreakDays,
    longestStreakDays: streak.longestStreakDays,
    lastPracticeDate: streak.lastPracticeDate,
    earnedBadgeIds: Array.from(earned),
  });

  return {
    xpEarned: params.xpEarned,
    totalXP,
    levelBefore: levelBefore.level,
    levelAfter: levelAfter.level,
    leveledUp: levelAfter.level > levelBefore.level,
    streak,
    streakExtended: extended,
    newlyEarnedBadges,
  };
}

export async function applyGamificationForSession(
  xpEarned: number,
  dayNumberJustCompleted: number,
): Promise<GamificationOutcome> {
  return applyGamification({ xpEarned, countsAsPractice: true, dayNumberJustCompleted });
}

export async function applyGamificationForFieldTest(
  dimensionResults: FieldTestDimensionResult[],
  progressionJustified: boolean,
): Promise<GamificationOutcome> {
  const xpEarned = xpForFieldTest(dimensionResults);
  return applyGamification({ xpEarned, countsAsPractice: true, fieldTestJustPassed: progressionJustified });
}

export function allBadgesWithEarnedState(earnedBadgeIds: string[]): { badge: BadgeDefinition; earned: boolean }[] {
  const earnedSet = new Set(earnedBadgeIds);
  return BADGES.map((badge) => ({ badge, earned: earnedSet.has(badge.id) }));
}
