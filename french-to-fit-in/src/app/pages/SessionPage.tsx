import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CelebrationOverlay } from '../../components/CelebrationOverlay';
import { useAppMeta } from '../hooks/useAppMeta';
import { useLessonSession } from '../../features/lesson/useLessonSession';
import { RetrievalGateScreen } from '../../features/retrieval/RetrievalGateScreen';
import { DiagnosisScreen } from '../../features/retrieval/DiagnosisScreen';
import { RemediationScreen } from '../../features/remediation/RemediationScreen';
import { TeachingScreen } from '../../features/lesson/TeachingScreen';
import { ExerciseScreen } from '../../features/lesson/ExerciseScreen';
import { SessionCompleteScreen } from '../../features/lesson/SessionCompleteScreen';
import './SessionPage.css';

export function SessionPage() {
  const params = useParams<{ dayNumber: string }>();
  const dayNumber = Number(params.dayNumber ?? '1');
  const { meta } = useAppMeta();
  const session = useLessonSession(dayNumber, meta?.pilotModeEnabled ?? false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  const { state, day, finishSession } = session;

  useEffect(() => {
    if (state?.phase === 'LEDGER_UPDATE') {
      finishSession();
    }
  }, [state?.phase, finishSession]);

  if (session.loading || !state) {
    return <p>Loading session...</p>;
  }

  if (!day) {
    return (
      <Card>
        <p>Day {dayNumber} doesn't exist in the curriculum.</p>
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
      </Card>
    );
  }

  if (day.lessonBlocks.length === 0 && day.applicationMissions.length === 0) {
    return (
      <Card>
        <h2>{day.title}</h2>
        <p>This day's content hasn't been authored yet — it's a locked curriculum slot awaiting approved material.</p>
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="session-page">
      <p className="session-page-eyebrow">
        Day {day.dayNumber} &middot; {day.title}
      </p>

      {state.phase === 'RETRIEVAL_GATE' && (
        <RetrievalGateScreen state={state} onSubmit={session.submitRetrievalResponse} />
      )}

      {state.phase === 'SCORE_DIAGNOSE' && <DiagnosisScreen state={state} onContinue={session.acknowledgeDiagnosis} />}

      {state.phase === 'REMEDIATION' && (
        <RemediationScreen
          state={state}
          latestEvaluation={session.latestEvaluation}
          xpPopup={session.xpPopup}
          onSubmit={session.resolveRemediation}
        />
      )}

      {state.phase === 'NEW_CAPABILITY_TEACHING' && (
        <TeachingScreen lessonBlocks={day.lessonBlocks} onDone={session.acknowledgeTeaching} />
      )}

      {(state.phase === 'CONTROLLED_MANIPULATION' ||
        state.phase === 'APPLICATION' ||
        state.phase === 'PRESSURE_TRANSFER') &&
        (session.currentExercise ? (
          <ExerciseScreen
            exercise={session.currentExercise}
            phase={state.phase}
            positionLabel={`${state.currentExerciseIndex + 1} of ${session.currentPhaseExercises.length}`}
            latestEvaluation={session.latestEvaluation}
            xpPopup={session.xpPopup}
            onSubmit={session.submitExerciseAnswer}
          />
        ) : (
          <p>Moving on...</p>
        ))}

      {state.phase === 'LEDGER_UPDATE' && <p>Saving progress...</p>}

      {state.phase === 'SESSION_COMPLETE' && (
        <>
          {session.gamificationOutcome && !celebrationDismissed && (
            <CelebrationOverlay
              outcome={session.gamificationOutcome}
              onContinue={() => setCelebrationDismissed(true)}
            />
          )}
          <SessionCompleteScreen day={day} state={state} gamificationOutcome={session.gamificationOutcome} />
        </>
      )}
    </div>
  );
}
