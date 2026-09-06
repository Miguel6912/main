import type { ItemId } from './curriculum';
import type { EvaluationResult } from './evaluation';

/**
 * The session state machine, exactly as specified:
 * RETRIEVAL_GATE -> SCORE_DIAGNOSE -> REMEDIATION (optional) ->
 * NEW_CAPABILITY_TEACHING -> CONTROLLED_MANIPULATION -> APPLICATION ->
 * PRESSURE_TRANSFER -> LEDGER_UPDATE -> SESSION_COMPLETE
 */
export type SessionPhase =
  | 'RETRIEVAL_GATE'
  | 'SCORE_DIAGNOSE'
  | 'REMEDIATION'
  | 'NEW_CAPABILITY_TEACHING'
  | 'CONTROLLED_MANIPULATION'
  | 'APPLICATION'
  | 'PRESSURE_TRANSFER'
  | 'LEDGER_UPDATE'
  | 'SESSION_COMPLETE';

export interface RetrievalGateItem {
  itemId: ItemId;
  prompt: string;
  /** English meaning shown only after the learner responds, or on "?" skip. */
  expectedFrench: string;
}

export interface RetrievalGateResponse {
  itemId: ItemId;
  learnerResponse: string;
  /** true if the learner typed "?" to explicitly skip/pass. */
  skipped: boolean;
  responseLatencyMs?: number;
}

export interface RemediationEvent {
  itemId: ItemId;
  reason: 'FAILED_RETRIEVAL' | 'PARTIAL_RETRIEVAL';
  resolved: boolean;
}

export interface SessionState {
  dayNumber: number;
  phase: SessionPhase;
  startedAt: string;
  retrievalGate: RetrievalGateItem[];
  retrievalResponses: RetrievalGateResponse[];
  diagnostics: EvaluationResult[];
  remediationQueue: RemediationEvent[];
  currentExerciseIndex: number;
  completedExerciseIds: string[];
  sessionComplete: boolean;
}
