/**
 * Aggregates raw pilot events + ledger + session + field-test records into
 * the summaries shown on the Pilot Dashboard. Everything here runs purely
 * on local IndexedDB data -- nothing is ever sent externally.
 */
import { getAllPilotEvents } from '../../storage/pilotStore';
import { getAllLedgerItems } from '../../storage/ledgerStore';
import { getAllSessionRecords } from '../../storage/sessionStore';
import { getAllFieldTestResults } from '../../storage/fieldTestStore';
import type { LedgerItem } from '../../types/ledger';
import type { FieldTestResult } from '../../types/fieldTest';

export interface RetrievalByDay {
  dayNumber: number;
  attempts: number;
  successes: number;
  successRate: number;
}

export interface DropOffPoint {
  dayNumber: number;
  sessionId: string;
  startedAt: string;
}

export interface PilotSummary {
  retrievalByDay: RetrievalByDay[];
  weakVocabulary: LedgerItem[];
  weakEngines: LedgerItem[];
  averageResponseLatencyMs: number | null;
  remediationEventCount: number;
  fieldTestResults: FieldTestResult[];
  dropOffPoints: DropOffPoint[];
  totalSessions: number;
  completedSessions: number;
}

export async function computePilotSummary(): Promise<PilotSummary> {
  const [events, ledger, sessions, fieldTestResults] = await Promise.all([
    getAllPilotEvents(),
    getAllLedgerItems(),
    getAllSessionRecords(),
    getAllFieldTestResults(),
  ]);

  const byDay = new Map<number, { attempts: number; successes: number }>();
  for (const ev of events) {
    if (ev.type === 'RETRIEVAL_SUCCESS' || ev.type === 'RETRIEVAL_FAILURE') {
      const entry = byDay.get(ev.dayNumber) ?? { attempts: 0, successes: 0 };
      entry.attempts += 1;
      if (ev.type === 'RETRIEVAL_SUCCESS') entry.successes += 1;
      byDay.set(ev.dayNumber, entry);
    }
  }
  const retrievalByDay: RetrievalByDay[] = Array.from(byDay.entries())
    .map(([dayNumber, v]) => ({
      dayNumber,
      attempts: v.attempts,
      successes: v.successes,
      successRate: v.attempts > 0 ? v.successes / v.attempts : 0,
    }))
    .sort((a, b) => a.dayNumber - b.dayNumber);

  const practicedItems = ledger.filter((i) => i.status !== 'LOCKED' && i.retrievalAttempts > 0);
  const weakVocabulary = practicedItems
    .filter((i) => i.type !== 'ENGINE')
    .sort((a, b) => a.automaticityScore - b.automaticityScore)
    .slice(0, 5);
  const weakEngines = practicedItems
    .filter((i) => i.type === 'ENGINE')
    .sort((a, b) => a.automaticityScore - b.automaticityScore)
    .slice(0, 5);

  const latencies = events
    .filter((e) => e.type === 'RESPONSE_TIME' && typeof e.responseLatencyMs === 'number')
    .map((e) => e.responseLatencyMs as number);
  const averageResponseLatencyMs =
    latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;

  const remediationEventCount = events.filter((e) => e.type === 'REMEDIATION_EVENT').length;

  const dropOffPoints: DropOffPoint[] = sessions
    .filter((s) => s.completedAt === null)
    .map((s) => ({ dayNumber: s.dayNumber, sessionId: s.id, startedAt: s.startedAt }));

  return {
    retrievalByDay,
    weakVocabulary,
    weakEngines,
    averageResponseLatencyMs,
    remediationEventCount,
    fieldTestResults,
    dropOffPoints,
    totalSessions: sessions.length,
    completedSessions: sessions.filter((s) => s.completedAt !== null).length,
  };
}
