import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { AnswerInput } from '../../components/AnswerInput';
import { FeedbackBanner } from '../../components/FeedbackBanner';
import { audioProvider } from '../../providers/audio';
import type { EvaluationResult, ExerciseDefinition, SessionPhase } from '../../types';
import './ExerciseScreen.css';

const PHASE_LABEL: Record<SessionPhase, string> = {
  RETRIEVAL_GATE: 'Retrieval',
  SCORE_DIAGNOSE: 'Diagnosis',
  REMEDIATION: 'Quick review',
  NEW_CAPABILITY_TEACHING: "Today's material",
  CONTROLLED_MANIPULATION: 'Controlled practice',
  APPLICATION: 'Application',
  PRESSURE_TRANSFER: 'Pressure test',
  LEDGER_UPDATE: 'Saving progress',
  SESSION_COMPLETE: 'Done',
};

interface ExerciseScreenProps {
  exercise: ExerciseDefinition;
  phase: SessionPhase;
  positionLabel: string;
  latestEvaluation: EvaluationResult | null;
  onSubmit: (exercise: ExerciseDefinition, answer: string) => Promise<void>;
}

export function ExerciseScreen({ exercise, phase, positionLabel, latestEvaluation, onSubmit }: ExerciseScreenProps) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastAttemptFailed, setLastAttemptFailed] = useState(false);

  useEffect(() => {
    setValue('');
    setLastAttemptFailed(false);
  }, [exercise.id]);

  async function handleSubmit(answer: string) {
    setSubmitting(true);
    await onSubmit(exercise, answer);
    setSubmitting(false);
    setLastAttemptFailed(true);
    setValue('');
  }

  function playAudio() {
    if (exercise.audioScript) {
      audioProvider.speak(exercise.audioScript, { difficulty: exercise.audioDifficulty });
    }
  }

  return (
    <Card className="exercise-card">
      <Pill tone="accent">
        {PHASE_LABEL[phase]} &middot; {positionLabel} &middot; Level {exercise.level}
      </Pill>

      {exercise.promptFrench && <p className="exercise-french-prompt">{exercise.promptFrench}</p>}

      {exercise.audioScript && (
        <button type="button" className="exercise-audio-btn" onClick={playAudio}>
          &#9658; Listen
        </button>
      )}

      {exercise.promptEnglish && <p className="exercise-english-prompt">{exercise.promptEnglish}</p>}
      {exercise.scenarioGoal && <p className="exercise-scenario-goal">Goal: {exercise.scenarioGoal}</p>}

      {lastAttemptFailed && latestEvaluation && (
        <FeedbackBanner classification={latestEvaluation.classification} feedback={latestEvaluation.feedback} />
      )}

      <AnswerInput value={value} onChange={setValue} onSubmit={handleSubmit} disabled={submitting} autoFocus />
    </Card>
  );
}
