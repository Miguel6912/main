import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { FeedbackBanner } from '../../components/FeedbackBanner';
import type { SessionState } from '../../types';
import './DiagnosisScreen.css';

interface DiagnosisScreenProps {
  state: SessionState;
  onContinue: () => void;
}

export function DiagnosisScreen({ state, onContinue }: DiagnosisScreenProps) {
  const needsRemediation = state.remediationQueue.length > 0;

  return (
    <Card className="diagnosis-card">
      <h2>Retrieval check</h2>
      <ul className="diagnosis-list">
        {state.diagnostics.map((d, i) => {
          const gateItem = state.retrievalGate[i];
          return (
            <li key={gateItem?.itemId ?? i}>
              <div className="diagnosis-item-french">{gateItem?.expectedFrench}</div>
              <FeedbackBanner classification={d.classification} feedback={d.feedback} />
            </li>
          );
        })}
      </ul>
      {needsRemediation ? (
        <p className="diagnosis-note">A couple of items need a quick targeted review before today's material.</p>
      ) : (
        <p className="diagnosis-note">Everything held up -- moving straight to today's material.</p>
      )}
      <Button onClick={onContinue}>Continue</Button>
    </Card>
  );
}
