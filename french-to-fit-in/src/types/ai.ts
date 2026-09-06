import type { ItemId } from './curriculum';
import type { EvaluationResult } from './evaluation';

/**
 * The CURRICULUM ENVELOPE is the only context an AI provider ever receives.
 * It exists so an AI evaluator/generator can never introduce forbidden
 * (future) material -- output is schema-validated and re-checked against
 * this envelope by the curriculum guard before being trusted.
 */
export interface CurriculumEnvelope {
  dayNumber: number;
  allowedCapabilities: string[];
  allowedVocabularyIds: ItemId[];
  previouslyIntroducedIds: ItemId[];
  forbiddenFutureCapabilities: string[];
  exerciseObjective: string;
}

export interface EvaluateLearnerResponseInput {
  envelope: CurriculumEnvelope;
  exerciseId: string;
  /** The specific item id(s) this response is being tested on -- NOT the
   * full envelope of previously-introduced material. Drives which ledger
   * rows the caller updates and which items land in a remediation queue. */
  itemIds: ItemId[];
  acceptableAnswers: string[];
  learnerResponse: string;
}

export interface GenerateScenarioResponseInput {
  envelope: CurriculumEnvelope;
  scenarioGoal: string;
  learnerUtterance: string;
}

export interface GenerateScenarioResponseOutput {
  /** French utterance the (allowed-vocabulary) NPC produces. */
  npcResponseFrench: string;
  englishGloss: string;
  /** Item ids used, for curriculum-guard verification. */
  itemIdsUsed: ItemId[];
}

export interface ExplainErrorInput {
  envelope: CurriculumEnvelope;
  learnerResponse: string;
  expectedMeaning: string;
}

export interface SelectRemediationInput {
  envelope: CurriculumEnvelope;
  failedItemIds: ItemId[];
}

export interface SelectRemediationOutput {
  itemIds: ItemId[];
  approach: 'recognition' | 'completion' | 'contrast' | 'short_production' | 'new_context_reuse';
}

/**
 * Provider-agnostic AI coach interface. Implementations MUST NOT be tightly
 * coupled to a single LLM vendor -- see providers/ai/. A deterministic mock
 * implementation (providers/ai/mockProvider.ts) lets the app run fully
 * offline / without an API key.
 */
export interface AIProvider {
  evaluateLearnerResponse(input: EvaluateLearnerResponseInput): Promise<EvaluationResult>;
  generateAllowedScenarioResponse(
    input: GenerateScenarioResponseInput,
  ): Promise<GenerateScenarioResponseOutput>;
  explainError(input: ExplainErrorInput): Promise<string>;
  selectRemediation(input: SelectRemediationInput): Promise<SelectRemediationOutput>;
}
