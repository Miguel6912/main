import { useState } from 'react';
import { Card } from '../../components/Card';
import { AnswerInput } from '../../components/AnswerInput';
import { Pill } from '../../components/Pill';
import type { SessionState } from '../../types';
import './RetrievalGateScreen.css';

interface RetrievalGateScreenProps {
  state: SessionState;
  onSubmit: (itemId: string, answer: string) => Promise<void>;
}

export function RetrievalGateScreen({ state, onSubmit }: RetrievalGateScreenProps) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const index = state.retrievalResponses.length;
  const current = state.retrievalGate[index];

  if (!current) return null;

  async function handleSubmit(answer: string) {
    setSubmitting(true);
    await onSubmit(current.itemId, answer);
    setValue('');
    setSubmitting(false);
  }

  return (
    <Card className="retrieval-gate-card">
      <Pill tone="accent">Quick retrieval &middot; {index + 1} of {state.retrievalGate.length}</Pill>
      <h2 className="retrieval-gate-prompt">{current.prompt}</h2>
      <p className="retrieval-gate-hint">From material you've already met -- no new teaching here.</p>
      <AnswerInput value={value} onChange={setValue} onSubmit={handleSubmit} disabled={submitting} autoFocus />
    </Card>
  );
}
