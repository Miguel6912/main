import { getDB } from './db';
import type { FieldTestResult } from '../types/fieldTest';

export async function saveFieldTestResult(result: FieldTestResult): Promise<void> {
  const db = await getDB();
  await db.put('fieldTestResults', result);
}

export async function getAllFieldTestResults(): Promise<FieldTestResult[]> {
  const db = await getDB();
  return db.getAll('fieldTestResults');
}

export async function getFieldTestResult(fieldTestId: string): Promise<FieldTestResult | undefined> {
  const db = await getDB();
  return db.get('fieldTestResults', fieldTestId);
}
