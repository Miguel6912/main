import type { BadgeDefinition } from '../types/gamification';

export const BADGES: BadgeDefinition[] = [
  {
    id: 'badge.first-session',
    title: 'First Steps',
    description: 'Complete your first session.',
    icon: '🌱',
    tone: 'sage',
  },
  {
    id: 'badge.streak-3',
    title: 'On a Roll',
    description: 'Practice 3 days in a row.',
    icon: '🔥',
    tone: 'terracotta',
  },
  {
    id: 'badge.streak-7',
    title: 'One Week Strong',
    description: 'Practice 7 days in a row.',
    icon: '🔥',
    tone: 'terracotta',
  },
  {
    id: 'badge.streak-30',
    title: 'Unstoppable',
    description: 'Practice 30 days in a row.',
    icon: '🔥',
    tone: 'terracotta',
  },
  {
    id: 'badge.week-1-complete',
    title: 'Week One Down',
    description: 'Finish Week 1 (Days 1-7).',
    icon: '🎉',
    tone: 'accent',
  },
  {
    id: 'badge.automatic-5',
    title: 'Second Nature',
    description: 'Get 5 items to Automatic.',
    icon: '⭐',
    tone: 'accent',
  },
  {
    id: 'badge.automatic-20',
    title: 'Built In',
    description: 'Get 20 items to Automatic.',
    icon: '🌟',
    tone: 'accent',
  },
  {
    id: 'badge.field-test-pass',
    title: 'Field Tested',
    description: 'Pass a field test with strong results across the board.',
    icon: '🏆',
    tone: 'rose',
  },
  {
    id: 'badge.level-5',
    title: 'Rising',
    description: 'Reach level 5.',
    icon: '📈',
    tone: 'gold',
  },
  {
    id: 'badge.level-10',
    title: 'Fluent Momentum',
    description: 'Reach level 10.',
    icon: '🚀',
    tone: 'gold',
  },
];

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id);
}
