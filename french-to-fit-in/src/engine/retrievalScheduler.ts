/**
 * Spaced retrieval scheduler.
 *
 * Priority order (per project brief): failed retrieval > weakly retrieved >
 * due material > automatic material needing occasional maintenance.
 * Spacing targets: next session, 2-3 sessions later, ~1 week later, then
 * occasional maintenance once AUTOMATIC. Gate size: 3-5 items, ~2-4 minutes.
 */
import type { LedgerItem } from '../types/ledger';
import type { RetrievalOutcome } from '../types/evaluation';
import type { RetrievalGateItem } from '../types/session';

export const RETRIEVAL_GATE_MIN_SIZE = 3;
export const RETRIEVAL_GATE_MAX_SIZE = 5;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Spacing intervals keyed by how many successful retrievals the item has
 * accumulated at the moment of a successful attempt -- a session-cadence
 * proxy since we assume roughly one session per day. */
const SPACING_DAYS_BY_SUCCESS_COUNT = [1, 3, 7]; // next session, 2-3 sessions later, ~1 week later
const MAINTENANCE_INTERVAL_DAYS = 14; // occasional maintenance once AUTOMATIC

export function computeNextDueAt(
  item: LedgerItem,
  outcome: RetrievalOutcome,
  nowISO: string,
): string {
  const now = new Date(nowISO).getTime();
  const isSuccess = outcome === 'ACCURATE' || outcome === 'MEANING_PRESERVED_IMPERFECT';

  if (!isSuccess) {
    // Failed or skipped: due again immediately (next session's gate).
    return nowISO;
  }

  if (item.status === 'AUTOMATIC') {
    return new Date(now + MAINTENANCE_INTERVAL_DAYS * ONE_DAY_MS).toISOString();
  }

  const successIndex = Math.min(item.successfulRetrievals, SPACING_DAYS_BY_SUCCESS_COUNT.length - 1);
  const days = SPACING_DAYS_BY_SUCCESS_COUNT[successIndex];
  return new Date(now + days * ONE_DAY_MS).toISOString();
}

type PriorityTier = 0 | 1 | 2 | 3 | 4;

function lastAttemptFailed(item: LedgerItem): boolean {
  if (item.retrievalAttempts === 0) return false;
  // lastSeen is bumped on every attempt; lastRetrieved only on success/partial.
  return item.lastSeen !== item.lastRetrieved;
}

function isDue(item: LedgerItem, nowISO: string): boolean {
  if (!item.nextDueAt) return true;
  return item.nextDueAt <= nowISO;
}

function priorityTier(item: LedgerItem, nowISO: string): PriorityTier {
  if (item.status === 'LOCKED') return 0;
  if (lastAttemptFailed(item)) return 4;
  if (item.automaticityScore < 0.6) return 3;
  if (item.status !== 'AUTOMATIC' && isDue(item, nowISO)) return 2;
  if (item.status === 'AUTOMATIC' && isDue(item, nowISO)) return 1;
  return 0;
}

export interface SchedulerOptions {
  nowISO?: string;
  gateSize?: number;
}

/**
 * Selects the retrieval-gate items for a session. Only ever draws from
 * previously introduced material (status !== 'LOCKED') -- never today's
 * brand-new capability, satisfying "retrieval gate uses ONLY previously
 * introduced material".
 */
export function selectRetrievalGateItems(
  allLedgerItems: LedgerItem[],
  options: SchedulerOptions = {},
): LedgerItem[] {
  const nowISO = options.nowISO ?? new Date().toISOString();
  const gateSize = Math.min(
    Math.max(options.gateSize ?? RETRIEVAL_GATE_MAX_SIZE, RETRIEVAL_GATE_MIN_SIZE),
    RETRIEVAL_GATE_MAX_SIZE,
  );

  const eligible = allLedgerItems.filter((item) => item.status !== 'LOCKED');

  const scored = eligible
    .map((item) => ({ item, tier: priorityTier(item, nowISO) }))
    .filter((s) => s.tier > 0)
    .sort((a, b) => {
      if (b.tier !== a.tier) return b.tier - a.tier;
      return a.item.automaticityScore - b.item.automaticityScore;
    });

  let selected = scored.slice(0, gateSize).map((s) => s.item);

  if (selected.length < RETRIEVAL_GATE_MIN_SIZE) {
    const already = new Set(selected.map((i) => i.id));
    const backfill = eligible
      .filter((i) => !already.has(i.id))
      .sort((a, b) => (a.nextDueAt ?? '').localeCompare(b.nextDueAt ?? ''));
    for (const item of backfill) {
      if (selected.length >= RETRIEVAL_GATE_MIN_SIZE) break;
      selected.push(item);
    }
  }

  return selected;
}

export function toRetrievalGatePrompts(items: LedgerItem[]): RetrievalGateItem[] {
  return items.map((item) => ({
    itemId: item.id,
    prompt: `How do you say "${item.englishMeaning}"?`,
    expectedFrench: item.canonicalFrench,
  }));
}
