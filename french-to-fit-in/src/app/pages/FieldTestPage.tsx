import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { AnswerInput } from '../../components/AnswerInput';
import { CelebrationOverlay } from '../../components/CelebrationOverlay';
import { useAppMeta } from '../hooks/useAppMeta';
import { useFieldTest } from '../../features/fieldTest/useFieldTest';
import './FieldTestPage.css';

const DIMENSION_LABEL: Record<string, string> = {
  RETRIEVAL: 'Retrieval',
  CONTROL: 'Control',
  REPAIR: 'Repair',
  TRANSFER: 'Transfer',
};

const SCORE_LABEL = ['Unable', 'Heavily supported', 'Functional', 'Independent'];

export function FieldTestPage() {
  const { fieldTestId = '' } = useParams<{ fieldTestId: string }>();
  const { meta } = useAppMeta();
  const { definition, currentStep, result, gamificationOutcome, submitStep } = useFieldTest(
    fieldTestId,
    meta?.pilotModeEnabled ?? false,
  );
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  if (!definition) {
    return (
      <Card>
        <p>Unknown field test.</p>
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
      </Card>
    );
  }

  if (definition.steps.length === 0) {
    return (
      <Card>
        <h2>{definition.title}</h2>
        <p>{definition.scenario}</p>
        <p>This field test's scenario steps haven't been authored yet.</p>
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
      </Card>
    );
  }

  if (result) {
    return (
      <>
        {gamificationOutcome && !celebrationDismissed && (
          <CelebrationOverlay outcome={gamificationOutcome} onContinue={() => setCelebrationDismissed(true)} />
        )}
        <Card className="field-test-results">
          <h2>{definition.title} — results</h2>
          <div className="field-test-dimensions">
            {result.dimensionResults.map((d) => (
              <div key={d.dimension} className="field-test-dimension">
                <div className="field-test-dimension-header">
                  <span>{DIMENSION_LABEL[d.dimension]}</span>
                  <Pill tone={d.score >= 2 ? 'sage' : d.score === 1 ? 'gold' : 'rose'}>
                    {d.score} &middot; {SCORE_LABEL[d.score]}
                  </Pill>
                </div>
                <p>{d.notes}</p>
              </div>
            ))}
          </div>

          <div className="field-test-summary">
            <h3>What worked</h3>
            <p>{result.whatWorked.length > 0 ? result.whatWorked.join('; ') : 'Nothing scored strongly yet.'}</p>
            <h3>What broke</h3>
            <p>{result.whatBroke.length > 0 ? result.whatBroke.join('; ') : 'Nothing broke down.'}</p>
            <h3>What needs retrieval</h3>
            <p>{result.whatNeedsRetrieval.length > 0 ? result.whatNeedsRetrieval.join(', ') : 'Nothing flagged.'}</p>
            <h3>Progression</h3>
            <Pill tone={result.progressionJustified ? 'sage' : 'rose'}>
              {result.progressionJustified ? 'Justified' : 'Not yet justified'}
            </Pill>
          </div>

          {gamificationOutcome && (
            <div className="field-test-gamification">
              <Pill tone="gold">+{gamificationOutcome.xpEarned} XP</Pill>
              {gamificationOutcome.leveledUp && <span>Level up! Now level {gamificationOutcome.levelAfter}.</span>}
              {gamificationOutcome.newlyEarnedBadges.map((badge) => (
                <span key={badge.id} className={`field-test-badge field-test-badge-${badge.tone}`}>
                  <span aria-hidden="true">{badge.icon}</span> {badge.title}
                </span>
              ))}
            </div>
          )}

          <Link to="/">
            <Button>Back to home</Button>
          </Link>
        </Card>
      </>
    );
  }

  async function handleSubmit(answer: string) {
    setSubmitting(true);
    await submitStep(answer);
    setValue('');
    setSubmitting(false);
  }

  return (
    <Card className="field-test-scenario">
      <Pill tone="accent">{definition.title}</Pill>
      <p className="field-test-scenario-text">{definition.scenario}</p>
      {currentStep && (
        <>
          <h2>{currentStep.promptEnglish}</h2>
          <p className="field-test-objective">Objective: {currentStep.objective}</p>
          <AnswerInput value={value} onChange={setValue} onSubmit={handleSubmit} disabled={submitting} autoFocus />
        </>
      )}
    </Card>
  );
}
