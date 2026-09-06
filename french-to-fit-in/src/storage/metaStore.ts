import { getDB } from './db';
import { defaultAvatarConfig } from '../engine/avatar';
import type { AppMeta } from './schema';

function defaultMeta(): AppMeta {
  return {
    key: 'app-meta',
    currentDay: 1,
    pilotModeEnabled: false,
    curriculumPreviewEnabled: false,
    createdAt: new Date().toISOString(),
    totalXP: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    lastPracticeDate: null,
    earnedBadgeIds: [],
    avatarConfig: defaultAvatarConfig(),
    displayName: '',
    voicePersona: 'feminine',
    onboardingCompleted: false,
  };
}

export async function getAppMeta(): Promise<AppMeta> {
  const db = await getDB();
  const existing = await db.get('meta', 'app-meta');
  // Merge over defaults so a database written before a field was added
  // (e.g. gamification state) is backfilled rather than left `undefined`.
  const merged: AppMeta = { ...defaultMeta(), ...existing };
  if (!existing || Object.keys(existing).length !== Object.keys(merged).length) {
    await db.put('meta', merged);
  }
  return merged;
}

export async function updateAppMeta(patch: Partial<Omit<AppMeta, 'key'>>): Promise<AppMeta> {
  const current = await getAppMeta();
  const updated: AppMeta = { ...current, ...patch };
  const db = await getDB();
  await db.put('meta', updated);
  return updated;
}
