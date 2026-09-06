import { getDB } from './db';
import type { PilotEvent } from '../types/pilot';

export async function recordPilotEvent(event: PilotEvent): Promise<void> {
  const db = await getDB();
  await db.put('pilotEvents', event);
}

export async function getAllPilotEvents(): Promise<PilotEvent[]> {
  const db = await getDB();
  const all = await db.getAll('pilotEvents');
  return all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export async function clearAllPilotEvents(): Promise<void> {
  const db = await getDB();
  await db.clear('pilotEvents');
}
