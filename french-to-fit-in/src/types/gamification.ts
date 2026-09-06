/**
 * Full engagement-mechanics layer (XP, levels, streaks, badges) --
 * explicitly requested by the product owner, overriding the original
 * brief's "no gamification" stance. See engine/gamification.ts for the
 * scoring/leveling/streak math and content/badges.ts for the badge list.
 */

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForThisLevel: number;
  xpTotal: number;
}

export interface StreakState {
  currentStreakDays: number;
  longestStreakDays: number;
  lastPracticeDate: string | null; // YYYY-MM-DD
}

export interface GamificationOutcome {
  xpEarned: number;
  totalXP: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  streak: StreakState;
  streakExtended: boolean;
  newlyEarnedBadges: BadgeDefinition[];
}
