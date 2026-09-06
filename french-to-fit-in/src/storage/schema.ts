import type { DBSchema } from 'idb';
import type { LedgerItem } from '../types/ledger';
import type { PilotEvent } from '../types/pilot';
import type { FieldTestResult } from '../types/fieldTest';

export interface SessionRecord {
  id: string;
  dayNumber: number;
  startedAt: string;
  completedAt: string | null;
  /** Snapshot of retrieval-gate accuracy for quick history display. */
  retrievalAccuracy: number | null;
}

export interface AppMeta {
  key: 'app-meta';
  /** Highest day number the learner has unlocked (completed sessions advance this). */
  currentDay: number;
  pilotModeEnabled: boolean;
  /** Developer setting: allows browsing days ahead of currentDay. */
  curriculumPreviewEnabled: boolean;
  createdAt: string;
}

export interface FrenchToFitInDB extends DBSchema {
  ledger: {
    key: string;
    value: LedgerItem;
    indexes: { 'by-status': string; 'by-day': number };
  };
  sessions: {
    key: string;
    value: SessionRecord;
    indexes: { 'by-day': number };
  };
  pilotEvents: {
    key: string;
    value: PilotEvent;
    indexes: { 'by-type': string; 'by-day': number };
  };
  fieldTestResults: {
    key: string;
    value: FieldTestResult;
  };
  meta: {
    key: string;
    value: AppMeta;
  };
}

export const DB_NAME = 'french-to-fit-in';
export const DB_VERSION = 1;
