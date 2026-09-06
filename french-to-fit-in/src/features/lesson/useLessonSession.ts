import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DayDefinition,
  EvaluationResult,
  ExerciseDefinition,
  GamificationOutcome,
  SessionPhase,
  SessionState,
} from '../../types';
import { getDayByNumber } from '../../content/curriculum';
import { getAllLedgerItems, ensureLedgerSeeded } from '../../storage/ledgerStore';
import { selectRetrievalGateItems, toRetrievalGatePrompts } from '../../engine/retrievalScheduler';
import { initSession, sessionReducer } from '../../engine/sessionMachine';
import { introduceItems, recordRetrieval } from '../ledger/ledgerService';
import { aiProvider, buildCurriculumEnvelope } from '../../providers/ai';
import { getAppMeta, updateAppMeta } from '../../storage/metaStore';
import { createSessionRecord, updateSessionRecord } from '../../storage/sessionStore';
import { recordPilotEvent } from '../../storage/pilotStore';
import { exercisesForPhase } from './dayExercises';
import { xpForClassification, SESSION_COMPLETION_XP } from '../../engine/gamification';
import { applyGamificationForSession } from '../gamification/gamificationService';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const NEW_CONTEXT_PHASES: SessionPhase[] = ['APPLICATION', 'PRESSURE_TRANSFER'];

export interface UseLessonSessionResult {
  day: DayDefinition | undefined;
  state: SessionState | null;
  loading: boolean;
  currentPhaseExercises: ExerciseDefinition[];
  currentExercise: ExerciseDefinition | null;
  latestEvaluation: EvaluationResult | null;
  submitRetrievalResponse: (itemId: string, answer: string) => Promise<void>;
  acknowledgeDiagnosis: () => void;
  acknowledgeTeaching: () => Promise<void>;
  submitExerciseAnswer: (exercise: ExerciseDefinition, answer: string) => Promise<void>;
  resolveRemediation: (itemId: string, answer: string) => Promise<void>;
  finishSession: () => Promise<void>;
  xpPopup: { amount: number; key: number } | null;
  gamificationOutcome: GamificationOutcome | null;
}

export function useLessonSession(dayNumber: number, pilotModeEnabled: boolean): UseLessonSessionResult {
  const day = useMemo(() => getDayByNumber(dayNumber), [dayNumber]);
  const [state, setState] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestEvaluation, setLatestEvaluation] = useState<EvaluationResult | null>(null);
  const gateStartRef = useRef<number>(0);
  const exerciseStartRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(newId('session'));
  const sessionXPRef = useRef<number>(0);
  const xpPopKeyRef = useRef<number>(0);
  const [xpPopup, setXpPopup] = useState<{ amount: number; key: number } | null>(null);
  const [gamificationOutcome, setGamificationOutcome] = useState<GamificationOutcome | null>(null);

  const awardXP = useCallback((classification: EvaluationResult['classification']) => {
    const amount = xpForClassification(classification);
    if (amount > 0) {
      sessionXPRef.current += amount;
      xpPopKeyRef.current += 1;
      setXpPopup({ amount, key: xpPopKeyRef.current });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setLoading(true);
      await ensureLedgerSeeded();
      const ledgerItems = await getAllLedgerItems();
      const gateItems = selectRetrievalGateItems(ledgerItems);
      const gatePrompts = toRetrievalGatePrompts(gateItems);
      if (cancelled) return;
      setState(initSession(dayNumber, gatePrompts));
      gateStartRef.current = performance.now();
      if (pilotModeEnabled) {
        await recordPilotEvent({
          id: newId('evt'),
          type: 'SESSION_START',
          timestamp: new Date().toISOString(),
          dayNumber,
        });
      }
      await createSessionRecord({
        id: sessionIdRef.current,
        dayNumber,
        startedAt: new Date().toISOString(),
        completedAt: null,
        retrievalAccuracy: null,
      });
      setLoading(false);
    }
    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNumber]);

  const submitRetrievalResponse = useCallback(
    async (itemId: string, answer: string) => {
      if (!state || !day) return;
      const latencyMs = performance.now() - gateStartRef.current;
      const gateItem = state.retrievalGate.find((g) => g.itemId === itemId);
      const envelope = buildCurriculumEnvelope(day, 'Retrieval gate check.');
      const evaluation = await aiProvider.evaluateLearnerResponse({
        envelope,
        exerciseId: `gate-${itemId}`,
        itemIds: [itemId],
        acceptableAnswers: gateItem ? [gateItem.expectedFrench] : [],
        learnerResponse: answer,
      });

      await recordRetrieval(itemId, evaluation.retrievalOutcome, {
        dayNumber,
        pilotModeEnabled,
        responseLatencyMs: latencyMs,
      });
      awardXP(evaluation.classification);

      const nextState = sessionReducer(state, {
        type: 'RETRIEVAL_RESPONSE_SUBMITTED',
        response: { itemId, learnerResponse: answer, skipped: answer.trim() === '?', responseLatencyMs: latencyMs },
      });

      const allAnswered = nextState.retrievalResponses.length >= nextState.retrievalGate.length;
      if (allAnswered) {
        const diagnostics: EvaluationResult[] = [];
        for (const response of nextState.retrievalResponses) {
          const gi = nextState.retrievalGate.find((g) => g.itemId === response.itemId);
          const result = await aiProvider.evaluateLearnerResponse({
            envelope,
            exerciseId: `gate-${response.itemId}`,
            itemIds: [response.itemId],
            acceptableAnswers: gi ? [gi.expectedFrench] : [],
            learnerResponse: response.learnerResponse,
          });
          diagnostics.push(result);
        }
        setState(sessionReducer(nextState, { type: 'DIAGNOSTICS_READY', diagnostics }));
      } else {
        gateStartRef.current = performance.now();
        setState(nextState);
      }
    },
    [state, day, dayNumber, pilotModeEnabled, awardXP],
  );

  const acknowledgeDiagnosis = useCallback(() => {
    if (!state) return;
    setState(sessionReducer(state, { type: 'DIAGNOSIS_ACKNOWLEDGED' }));
  }, [state]);

  const acknowledgeTeaching = useCallback(async () => {
    if (!state || !day) return;
    await introduceItems([...day.newEngines, ...day.newVocabulary]);
    exerciseStartRef.current = performance.now();
    setState(sessionReducer(state, { type: 'TEACHING_ACKNOWLEDGED' }));
  }, [state, day]);

  const submitExerciseAnswer = useCallback(
    async (exercise: ExerciseDefinition, answer: string) => {
      if (!state || !day) return;
      const latencyMs = performance.now() - exerciseStartRef.current;
      const envelope = buildCurriculumEnvelope(day, exercise.scenarioGoal ?? exercise.promptEnglish ?? '');
      const evaluation = await aiProvider.evaluateLearnerResponse({
        envelope,
        exerciseId: exercise.id,
        itemIds: exercise.usesItemIds,
        acceptableAnswers: exercise.acceptableAnswers,
        learnerResponse: answer,
      });
      setLatestEvaluation(evaluation);
      awardXP(evaluation.classification);

      const isNewContext = NEW_CONTEXT_PHASES.includes(state.phase);
      for (const itemId of exercise.usesItemIds) {
        await recordRetrieval(itemId, evaluation.retrievalOutcome, {
          dayNumber,
          pilotModeEnabled,
          responseLatencyMs: latencyMs,
          isNewContext,
        });
      }

      if (evaluation.shouldAdvance) {
        let next = sessionReducer(state, { type: 'EXERCISE_COMPLETED', exerciseId: exercise.id });
        const remaining = exercisesForPhase(day, next.phase).length - next.currentExerciseIndex;
        if (remaining <= 0) {
          next = sessionReducer(next, { type: 'PHASE_EXERCISES_EXHAUSTED' });
        }
        exerciseStartRef.current = performance.now();
        setState(next);
      }
    },
    [state, day, dayNumber, pilotModeEnabled, awardXP],
  );

  const resolveRemediation = useCallback(
    async (itemId: string, answer: string) => {
      if (!state || !day) return;
      const ledgerItems = await getAllLedgerItems();
      const item = ledgerItems.find((i) => i.id === itemId);
      const envelope = buildCurriculumEnvelope(day, `Targeted remediation for ${itemId}.`);
      const evaluation = await aiProvider.evaluateLearnerResponse({
        envelope,
        exerciseId: `remediation-${itemId}`,
        itemIds: [itemId],
        acceptableAnswers: item ? [item.canonicalFrench] : [],
        learnerResponse: answer,
      });
      setLatestEvaluation(evaluation);
      awardXP(evaluation.classification);
      await recordRetrieval(itemId, evaluation.retrievalOutcome, { dayNumber, pilotModeEnabled });
      if (pilotModeEnabled) {
        await recordPilotEvent({
          id: newId('evt'),
          type: 'REMEDIATION_EVENT',
          timestamp: new Date().toISOString(),
          dayNumber,
          itemId,
          detail: { resolved: evaluation.shouldAdvance },
        });
      }
      if (evaluation.shouldAdvance) {
        setState(sessionReducer(state, { type: 'REMEDIATION_RESOLVED', itemId }));
      }
    },
    [state, day, dayNumber, pilotModeEnabled, awardXP],
  );

  const finishSession = useCallback(async () => {
    if (!state) return;
    const meta = await getAppMeta();
    if (dayNumber >= meta.currentDay) {
      await updateAppMeta({ currentDay: dayNumber + 1 });
    }
    const gateSuccesses = state.diagnostics.filter(
      (d) => d.retrievalOutcome === 'ACCURATE' || d.retrievalOutcome === 'MEANING_PRESERVED_IMPERFECT',
    ).length;
    await updateSessionRecord({
      id: sessionIdRef.current,
      dayNumber,
      startedAt: state.startedAt,
      completedAt: new Date().toISOString(),
      retrievalAccuracy: state.retrievalGate.length > 0 ? gateSuccesses / state.retrievalGate.length : null,
    });
    if (pilotModeEnabled) {
      await recordPilotEvent({
        id: newId('evt'),
        type: 'SESSION_END',
        timestamp: new Date().toISOString(),
        dayNumber,
      });
    }

    const xpEarned = sessionXPRef.current + SESSION_COMPLETION_XP;
    const outcome = await applyGamificationForSession(xpEarned, dayNumber);
    setGamificationOutcome(outcome);

    setState(sessionReducer(state, { type: 'LEDGER_UPDATE_COMMITTED' }));
  }, [state, dayNumber, pilotModeEnabled]);

  const currentPhaseExercises = day && state ? exercisesForPhase(day, state.phase) : [];
  const currentExercise = currentPhaseExercises[state?.currentExerciseIndex ?? 0] ?? null;

  return {
    day,
    state,
    loading,
    currentPhaseExercises,
    currentExercise,
    latestEvaluation,
    submitRetrievalResponse,
    acknowledgeDiagnosis,
    acknowledgeTeaching,
    submitExerciseAnswer,
    resolveRemediation,
    finishSession,
    xpPopup,
    gamificationOutcome,
  };
}
