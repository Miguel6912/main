import { getDB } from './db';
import type { AppMeta } from './schema';

const DEFAULT_META: AppMeta = {
  key: 'app-meta',
  currentDay: 1,
  pilotModeEnabled: false,
  curriculumPreviewEnabled: false,
  createdAt: new Date().toISOString(),
};

export async function getAppMeta(): Promise<AppMeta> {
  const db = await getDB();
  const existing = await db.get('meta', 'app-meta');
  if (existing) return existing;
  await db.put('meta', DEFAULT_META);
  return DEFAULT_META;
}

export async function updateAppMeta(patch: Partial<Omit<AppMeta, 'key'>>): Promise<AppMeta> {
  const current = await getAppMeta();
  const updated: AppMeta = { ...current, ...patch };
  const db = await getDB();
  await db.put('meta', updated);
  return updated;
}
