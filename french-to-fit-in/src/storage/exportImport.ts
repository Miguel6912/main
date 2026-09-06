/**
 * Full learner-state JSON export/import. Lets a learner move state between
 * devices/browsers and lets pilot researchers archive a run. Never sent
 * anywhere externally by this app -- purely local file download/upload.
 */
import { getDB } from './db';
import { getAppMeta } from './metaStore';
import type { AppMeta } from './schema';
import type { LedgerItem } from '../types/ledger';
import type { PilotEvent } from '../types/pilot';
import type { FieldTestResult } from '../types/fieldTest';
import type { SessionRecord } from './schema';

export const EXPORT_FORMAT_VERSION = 1;

export interface LearnerStateExport {
  formatVersion: number;
  exportedAt: string;
  meta: AppMeta;
  ledger: LedgerItem[];
  sessions: SessionRecord[];
  pilotEvents: PilotEvent[];
  fieldTestResults: FieldTestResult[];
}

export async function exportLearnerState(): Promise<LearnerStateExport> {
  const db = await getDB();
  const [meta, ledger, sessions, pilotEvents, fieldTestResults] = await Promise.all([
    getAppMeta(),
    db.getAll('ledger'),
    db.getAll('sessions'),
    db.getAll('pilotEvents'),
    db.getAll('fieldTestResults'),
  ]);
  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    meta,
    ledger,
    sessions,
    pilotEvents,
    fieldTestResults,
  };
}

export class LearnerStateImportError extends Error {}

export async function importLearnerState(data: LearnerStateExport): Promise<void> {
  if (data.formatVersion !== EXPORT_FORMAT_VERSION) {
    throw new LearnerStateImportError(
      `Unsupported export format version ${data.formatVersion} (expected ${EXPORT_FORMAT_VERSION}).`,
    );
  }
  const db = await getDB();
  const tx = db.transaction(['meta', 'ledger', 'sessions', 'pilotEvents', 'fieldTestResults'], 'readwrite');
  await tx.objectStore('meta').put(data.meta);
  for (const item of data.ledger) await tx.objectStore('ledger').put(item);
  for (const rec of data.sessions) await tx.objectStore('sessions').put(rec);
  for (const ev of data.pilotEvents) await tx.objectStore('pilotEvents').put(ev);
  for (const ft of data.fieldTestResults) await tx.objectStore('fieldTestResults').put(ft);
  await tx.done;
}

export function downloadLearnerStateAsFile(data: LearnerStateExport, filename = 'french-to-fit-in-export.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readLearnerStateFromFile(file: File): Promise<LearnerStateExport> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new LearnerStateImportError('File is not valid JSON.');
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('formatVersion' in parsed) ||
    !('ledger' in parsed)
  ) {
    throw new LearnerStateImportError('File does not look like a French to Fit In export.');
  }
  return parsed as LearnerStateExport;
}
