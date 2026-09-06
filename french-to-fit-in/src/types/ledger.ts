import type { ItemId, LedgerItemType } from './curriculum';

export type LedgerStatus = 'LOCKED' | 'INTRODUCED' | 'RETRIEVED' | 'REUSED' | 'AUTOMATIC';

/** Coarse UI-facing bucket derived from automaticityScore. Never shown as a
 * pseudo-scientific fluency number -- see AUTOMATICITY rules. */
export type AutomaticityBand = 'Introduced' | 'Building' | 'Reliable' | 'Automatic';

export interface LedgerItem {
  id: ItemId;
  canonicalFrench: string;
  englishMeaning: string;
  type: LedgerItemType;
  introducedDay: number;
  /** ISO timestamp of first introduction, or null if not yet introduced. */
  introducedAt: string | null;
  retrievalAttempts: number;
  successfulRetrievals: number;
  failedRetrievals: number;
  /** Count of successful applications in a materially different context. */
  reuseCount: number;
  /** ISO timestamp of last exposure of any kind. */
  lastSeen: string | null;
  /** ISO timestamp of last successful retrieval. */
  lastRetrieved: string | null;
  /** Deterministic 0-1 score -- see engine/mastery.ts. */
  automaticityScore: number;
  status: LedgerStatus;
  /** ISO timestamp this item is next due for spaced retrieval, or null. */
  nextDueAt: string | null;
}

export function createLockedLedgerItem(params: {
  id: ItemId;
  canonicalFrench: string;
  englishMeaning: string;
  type: LedgerItemType;
  introducedDay: number;
}): LedgerItem {
  return {
    ...params,
    introducedAt: null,
    retrievalAttempts: 0,
    successfulRetrievals: 0,
    failedRetrievals: 0,
    reuseCount: 0,
    lastSeen: null,
    lastRetrieved: null,
    automaticityScore: 0,
    status: 'LOCKED',
    nextDueAt: null,
  };
}
