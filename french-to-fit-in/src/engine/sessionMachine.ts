/**
 * Session state machine, exactly the 9-step engine from the project brief:
 * RETRIEVAL_GATE -> SCORE_DIAGNOSE -> REMEDIATION (optional) ->
 * NEW_CAPABILITY_TEACHING -> CONTROLLED_MANIPULATION -> APPLICATION ->
 * PRESSURE_TRANSFER -> LEDGER_UPDATE -> SESSION_COMPLETE.
 *
 * Pure and content-agnostic: it only tracks phase/progress bookkeeping. The
 * features/lesson layer wires actual exercises and ledger writes to it.
 */
import type { EvaluationResult } from '../types/evaluation';
import type {
  RemediationEvent,
  RetrievalGateItem,
  RetrievalGateResponse,
  SessionPhase,
  SessionState,
} from '../types/session';

export type SessionAction =
  | { type: 'RETRIEVAL_RESPONSE_SUBMITTED'; response: RetrievalGateResponse }
  | { type: 'DIAGNOSTICS_READY'; diagnostics: EvaluationResult[] }
  | { type: 'DIAGNOSIS_ACKNOWLEDGED' }
  | { type: 'REMEDIATION_RESOLVED'; itemId: string }
  | { type: 'TEACHING_ACKNOWLEDGED' }
  | { type: 'EXERCISE_COMPLETED'; exerciseId: string }
  | { type: 'PHASE_EXERCISES_EXHAUSTED' }
  | { type: 'LEDGER_UPDATE_COMMITTED' };

export function initSession(dayNumber: number, retrievalGate: RetrievalGateItem[]): SessionState {
  return {
    dayNumber,
    phase: retrievalGate.length > 0 ? 'RETRIEVAL_GATE' : 'SCORE_DIAGNOSE',
    startedAt: new Date().toISOString(),
    retrievalGate,
    retrievalResponses: [],
    diagnostics: [],
    remediationQueue: [],
    currentExerciseIndex: 0,
    completedExerciseIds: [],
    sessionComplete: false,
  };
}

const PHASE_ORDER: SessionPhase[] = [
  'RETRIEVAL_GATE',
  'SCORE_DIAGNOSE',
  'REMEDIATION',
  'NEW_CAPABILITY_TEACHING',
  'CONTROLLED_MANIPULATION',
  'APPLICATION',
  'PRESSURE_TRANSFER',
  'LEDGER_UPDATE',
  'SESSION_COMPLETE',
];

function nextPhaseAfter(phase: SessionPhase): SessionPhase {
  const idx = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)];
}

function buildRemediationQueue(diagnostics: EvaluationResult[]): RemediationEvent[] {
  const queue: RemediationEvent[] = [];
  for (const d of diagnostics) {
    if (d.retrievalOutcome === 'FAILED_RETRIEVAL' || d.retrievalOutcome === 'SKIPPED') {
      d.itemIds.forEach((itemId) => queue.push({ itemId, reason: 'FAILED_RETRIEVAL', resolved: false }));
    } else if (d.retrievalOutcome === 'PARTIALLY_RETRIEVED') {
      d.itemIds.forEach((itemId) => queue.push({ itemId, reason: 'PARTIAL_RETRIEVAL', resolved: false }));
    }
  }
  return queue;
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'RETRIEVAL_RESPONSE_SUBMITTED': {
      const retrievalResponses = [...state.retrievalResponses, action.response];
      const allAnswered = retrievalResponses.length >= state.retrievalGate.length;
      return {
        ...state,
        retrievalResponses,
        phase: allAnswered ? 'SCORE_DIAGNOSE' : state.phase,
      };
    }

    case 'DIAGNOSTICS_READY': {
      const remediationQueue = buildRemediationQueue(action.diagnostics);
      return {
        ...state,
        diagnostics: action.diagnostics,
        remediationQueue,
        phase: 'SCORE_DIAGNOSE',
      };
    }

    case 'DIAGNOSIS_ACKNOWLEDGED':
      return {
        ...state,
        phase: state.remediationQueue.length > 0 ? 'REMEDIATION' : 'NEW_CAPABILITY_TEACHING',
      };

    case 'REMEDIATION_RESOLVED': {
      const remediationQueue = state.remediationQueue.map((r) =>
        r.itemId === action.itemId ? { ...r, resolved: true } : r,
      );
      const allResolved = remediationQueue.every((r) => r.resolved);
      return {
        ...state,
        remediationQueue,
        phase: allResolved ? 'NEW_CAPABILITY_TEACHING' : 'REMEDIATION',
      };
    }

    case 'TEACHING_ACKNOWLEDGED':
      return { ...state, phase: 'CONTROLLED_MANIPULATION' };

    case 'EXERCISE_COMPLETED':
      return {
        ...state,
        completedExerciseIds: [...state.completedExerciseIds, action.exerciseId],
        currentExerciseIndex: state.currentExerciseIndex + 1,
      };

    case 'PHASE_EXERCISES_EXHAUSTED':
      return { ...state, phase: nextPhaseAfter(state.phase), currentExerciseIndex: 0 };

    case 'LEDGER_UPDATE_COMMITTED':
      return { ...state, phase: 'SESSION_COMPLETE', sessionComplete: true };

    default:
      return state;
  }
}
