import { getDB } from './db';
import type { SessionRecord } from './schema';

export async function createSessionRecord(rec: SessionRecord): Promise<void> {
  const db = await getDB();
  await db.put('sessions', rec);
}

export async function updateSessionRecord(rec: SessionRecord): Promise<void> {
  const db = await getDB();
  await db.put('sessions', rec);
}

export async function getAllSessionRecords(): Promise<SessionRecord[]> {
  const db = await getDB();
  const all = await db.getAll('sessions');
  return all.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

export async function getSessionRecordsForDay(dayNumber: number): Promise<SessionRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-day', dayNumber);
}
