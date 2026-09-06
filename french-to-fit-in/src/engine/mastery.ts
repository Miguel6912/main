/**
 * Deterministic automaticity/mastery model.
 *
 * This is explicitly NOT a scientific fluency measurement -- it's a simple,
 * auditable exponential-moving-average over retrieval outcomes, nudged by
 * reuse in new contexts and pulled down by repeated failure. See project
 * brief AUTOMATICITY section.
 */
import type { LedgerItem, LedgerStatus, AutomaticityBand } from '../types/ledger';
import type { RetrievalOutcome } from '../types/evaluation';

/** How strongly a single new outcome moves the running score. */
const LEARNING_RATE = 0.35;

/** Extra bump applied when a success happens in a materially different context. */
const REUSE_BONUS = 0.06;

/** Score thresholds for the AUTOMATIC ledger status. */
export const AUTOMATIC_SCORE_THRESHOLD = 0.85;
export const AUTOMATIC_MIN_SUCCESSFUL_RETRIEVALS = 3;

/** Score thresholds for the coarser UI-facing band. */
const BAND_THRESHOLDS: { min: number; band: AutomaticityBand }[] = [
  { min: 0.85, band: 'Automatic' },
  { min: 0.6, band: 'Reliable' },
  { min: 0.25, band: 'Building' },
  { min: 0, band: 'Introduced' },
];

function outcomeValue(outcome: RetrievalOutcome): number {
  switch (outcome) {
    case 'ACCURATE':
      return 1.0;
    case 'MEANING_PRESERVED_IMPERFECT':
      return 0.85;
    case 'PARTIALLY_RETRIEVED':
      return 0.4;
    case 'FAILED_RETRIEVAL':
      return 0.0;
    case 'SKIPPED':
      return 0.0;
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function automaticityBand(score: number): AutomaticityBand {
  const found = BAND_THRESHOLDS.find((t) => score >= t.min);
  return found ? found.band : 'Introduced';
}

function deriveStatus(item: LedgerItem): LedgerStatus {
  if (item.introducedAt === null) return 'LOCKED';
  const isAutomatic =
    item.automaticityScore >= AUTOMATIC_SCORE_THRESHOLD &&
    item.successfulRetrievals >= AUTOMATIC_MIN_SUCCESSFUL_RETRIEVALS;
  if (isAutomatic) return 'AUTOMATIC';
  if (item.reuseCount > 0) return 'REUSED';
  if (item.successfulRetrievals > 0) return 'RETRIEVED';
  return 'INTRODUCED';
}

export function introduceItem(item: LedgerItem, nowISO: string): LedgerItem {
  if (item.introducedAt !== null) return item;
  return {
    ...item,
    introducedAt: nowISO,
    lastSeen: nowISO,
    status: 'INTRODUCED',
  };
}

export interface ApplyRetrievalOutcomeOptions {
  /** True if this success happened in a context materially different from
   * where the item was introduced/last practised -- drives REUSED status. */
  isNewContext?: boolean;
  nowISO?: string;
}

/**
 * Pure function: applies one retrieval outcome to a ledger item and returns
 * the updated item. Callers persist the result (see storage/ledgerStore).
 */
export function applyRetrievalOutcome(
  item: LedgerItem,
  outcome: RetrievalOutcome,
  options: ApplyRetrievalOutcomeOptions = {},
): LedgerItem {
  const nowISO = options.nowISO ?? new Date().toISOString();
  const isSuccess = outcome === 'ACCURATE' || outcome === 'MEANING_PRESERVED_IMPERFECT';
  const isPartial = outcome === 'PARTIALLY_RETRIEVED';
  const isFailure = outcome === 'FAILED_RETRIEVAL' || outcome === 'SKIPPED';

  let score = item.automaticityScore + LEARNING_RATE * (outcomeValue(outcome) - item.automaticityScore);
  if (isSuccess && options.isNewContext) {
    score += REUSE_BONUS;
  }
  score = clamp01(score);

  const updated: LedgerItem = {
    ...item,
    automaticityScore: score,
    lastSeen: nowISO,
    retrievalAttempts: item.retrievalAttempts + 1,
    successfulRetrievals: item.successfulRetrievals + (isSuccess ? 1 : 0),
    failedRetrievals: item.failedRetrievals + (isFailure ? 1 : 0),
    lastRetrieved: isSuccess || isPartial ? nowISO : item.lastRetrieved,
    reuseCount: item.reuseCount + (isSuccess && options.isNewContext ? 1 : 0),
    introducedAt: item.introducedAt ?? nowISO,
  };
  updated.status = deriveStatus(updated);
  return updated;
}

/** True if this update caused the item to newly reach AUTOMATIC. */
export function justBecameAutomatic(before: LedgerItem, after: LedgerItem): boolean {
  return before.status !== 'AUTOMATIC' && after.status === 'AUTOMATIC';
}

/** True if this update caused the item to fall out of AUTOMATIC. */
export function justLostAutomaticity(before: LedgerItem, after: LedgerItem): boolean {
  return before.status === 'AUTOMATIC' && after.status !== 'AUTOMATIC';
}
