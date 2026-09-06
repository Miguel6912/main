import { useState } from 'react';
import { Card } from '../../components/Card';
import { AnswerInput } from '../../components/AnswerInput';
import { FeedbackBanner } from '../../components/FeedbackBanner';
import { Pill } from '../../components/Pill';
import type { EvaluationResult, SessionState } from '../../types';
import './RemediationScreen.css';

interface RemediationScreenProps {
  state: SessionState;
  latestEvaluation: EvaluationResult | null;
  onSubmit: (itemId: string, answer: string) => Promise<void>;
}

/**
 * Remediation is small and targeted: a failed item never replays the whole
 * lesson, just this one item, via a light recognition/production check.
 */
export function RemediationScreen({ state, latestEvaluation, onSubmit }: RemediationScreenProps) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const current = state.remediationQueue.find((r) => !r.resolved);

  if (!current) return null;

  const gateItem = state.retrievalGate.find((g) => g.itemId === current.itemId);

  async function handleSubmit(answer: string) {
    setSubmitting(true);
    await onSubmit(current!.itemId, answer);
    setValue('');
    setSubmitting(false);
  }

  const remainingCount = state.remediationQueue.filter((r) => !r.resolved).length;

  return (
    <Card className="remediation-card">
      <Pill tone="gold">Quick review &middot; {remainingCount} left</Pill>
      <h2 className="remediation-prompt">{gateItem?.prompt ?? 'How do you say this?'}</h2>
      {latestEvaluation && <FeedbackBanner classification={latestEvaluation.classification} feedback={latestEvaluation.feedback} />}
      <AnswerInput value={value} onChange={setValue} onSubmit={handleSubmit} disabled={submitting} autoFocus />
    </Card>
  );
}
