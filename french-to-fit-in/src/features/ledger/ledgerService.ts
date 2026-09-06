/**
 * Ledger feature service: the write path every part of the app should use
 * to touch the knowledge ledger. Wraps storage + the pure mastery model,
 * and emits pilot events for automaticity transitions.
 */
import { getLedgerItem, putLedgerItem, putLedgerItems, getAllLedgerItems } from '../../storage/ledgerStore';
import { recordPilotEvent } from '../../storage/pilotStore';
import {
  applyRetrievalOutcome,
  introduceItem,
  justBecameAutomatic,
  justLostAutomaticity,
} from '../../engine/mastery';
import { computeNextDueAt } from '../../engine/retrievalScheduler';
import type { RetrievalOutcome } from '../../types/evaluation';
import type { LedgerItem } from '../../types/ledger';

function newEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function introduceItems(itemIds: string[]): Promise<void> {
  const nowISO = new Date().toISOString();
  const items: LedgerItem[] = [];
  for (const id of itemIds) {
    const existing = await getLedgerItem(id);
    if (!existing) continue;
    items.push(introduceItem(existing, nowISO));
  }
  await putLedgerItems(items);
}

export interface RecordRetrievalOptions {
  isNewContext?: boolean;
  dayNumber: number;
  exerciseId?: string;
  responseLatencyMs?: number;
  pilotModeEnabled: boolean;
}

/**
 * Records one retrieval outcome for a single ledger item: updates the
 * ledger, and (when pilot mode is on) logs SUCCESS/FAILURE + latency +
 * automaticity-transition pilot events.
 */
export async function recordRetrieval(
  itemId: string,
  outcome: RetrievalOutcome,
  options: RecordRetrievalOptions,
): Promise<LedgerItem | null> {
  const existing = await getLedgerItem(itemId);
  if (!existing) return null;

  const before = existing;
  const nowISO = new Date().toISOString();
  const afterMastery = applyRetrievalOutcome(before, outcome, {
    isNewContext: options.isNewContext,
    nowISO,
  });
  const after: LedgerItem = { ...afterMastery, nextDueAt: computeNextDueAt(afterMastery, outcome, nowISO) };
  await putLedgerItem(after);

  if (options.pilotModeEnabled) {
    const isSuccess = outcome === 'ACCURATE' || outcome === 'MEANING_PRESERVED_IMPERFECT';
    await recordPilotEvent({
      id: newEventId(),
      type: isSuccess ? 'RETRIEVAL_SUCCESS' : 'RETRIEVAL_FAILURE',
      timestamp: new Date().toISOString(),
      dayNumber: options.dayNumber,
      itemId,
      exerciseId: options.exerciseId,
      responseLatencyMs: options.responseLatencyMs,
      detail: { outcome },
    });
    if (options.responseLatencyMs !== undefined) {
      await recordPilotEvent({
        id: newEventId(),
        type: 'RESPONSE_TIME',
        timestamp: new Date().toISOString(),
        dayNumber: options.dayNumber,
        itemId,
        exerciseId: options.exerciseId,
        responseLatencyMs: options.responseLatencyMs,
      });
    }
    if (justBecameAutomatic(before, after)) {
      await recordPilotEvent({
        id: newEventId(),
        type: 'ITEM_BECAME_AUTOMATIC',
        timestamp: new Date().toISOString(),
        dayNumber: options.dayNumber,
        itemId,
      });
    }
    if (justLostAutomaticity(before, after)) {
      await recordPilotEvent({
        id: newEventId(),
        type: 'ITEM_LOST_AUTOMATICITY',
        timestamp: new Date().toISOString(),
        dayNumber: options.dayNumber,
        itemId,
      });
    }
  }

  return after;
}

export async function getWorkingKnowledgeSummary(): Promise<{
  introduced: number;
  reliable: number;
  automatic: number;
}> {
  const all = await getAllLedgerItems();
  const nonLocked = all.filter((i) => i.status !== 'LOCKED');
  const automatic = nonLocked.filter((i) => i.status === 'AUTOMATIC').length;
  const reliable = nonLocked.filter((i) => i.automaticityScore >= 0.6 && i.status !== 'AUTOMATIC').length;
  return { introduced: nonLocked.length, reliable, automatic };
}
