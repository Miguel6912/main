/**
 * Classification of a learner's response to an exercise.
 * FUNCTIONAL answers (meaning survives, imperfect form) should often advance
 * rather than block -- see project brief FEEDBACK rules.
 */
export type ResponseClassification = 'CORRECT' | 'FUNCTIONAL' | 'PARTIAL' | 'FAILED';

/** Finer-grained retrieval outcome used by the ledger/scheduler, distinct
 * from the learner-facing ResponseClassification. */
export type RetrievalOutcome =
  | 'ACCURATE'
  | 'MEANING_PRESERVED_IMPERFECT'
  | 'PARTIALLY_RETRIEVED'
  | 'FAILED_RETRIEVAL'
  | 'SKIPPED'; // learner typed "?"

export interface EvaluationResult {
  classification: ResponseClassification;
  retrievalOutcome: RetrievalOutcome;
  /** Concise, non-punitive feedback message. */
  feedback: string;
  /** Item ids touched by this response, used to update the ledger. */
  itemIds: string[];
  /** Whether this response should advance the exercise sequence. */
  shouldAdvance: boolean;
}
