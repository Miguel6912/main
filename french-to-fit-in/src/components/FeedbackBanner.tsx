import type { ResponseClassification } from '../types/evaluation';
import './FeedbackBanner.css';

const TONE_BY_CLASSIFICATION: Record<ResponseClassification, string> = {
  CORRECT: 'sage',
  FUNCTIONAL: 'sage',
  PARTIAL: 'gold',
  FAILED: 'rose',
};

interface FeedbackBannerProps {
  classification: ResponseClassification;
  feedback: string;
}

export function FeedbackBanner({ classification, feedback }: FeedbackBannerProps) {
  const tone = TONE_BY_CLASSIFICATION[classification];
  return (
    <div className={`feedback-banner feedback-${tone}`} role="status">
      {feedback}
    </div>
  );
}
