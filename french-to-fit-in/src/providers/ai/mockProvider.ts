/**
 * Deterministic mock AI provider. Lets the whole app run fully offline and
 * without any API key. Real providers (see index.ts) must implement the
 * same AIProvider interface and MUST have their output re-validated against
 * the curriculum guard before use -- this mock is guard-safe by
 * construction since it only ever echoes envelope-allowed items.
 */
import type {
  AIProvider,
  EvaluateLearnerResponseInput,
  ExplainErrorInput,
  GenerateScenarioResponseInput,
  GenerateScenarioResponseOutput,
  SelectRemediationInput,
  SelectRemediationOutput,
} from '../../types/ai';
import type { EvaluationResult } from '../../types/evaluation';
import { scoreResponse } from '../../engine/scoring';

export class MockAIProvider implements AIProvider {
  async evaluateLearnerResponse(input: EvaluateLearnerResponseInput): Promise<EvaluationResult> {
    return scoreResponse({
      learnerResponse: input.learnerResponse,
      acceptableAnswers: input.acceptableAnswers,
      itemIds: input.itemIds,
    });
  }

  async generateAllowedScenarioResponse(
    input: GenerateScenarioResponseInput,
  ): Promise<GenerateScenarioResponseOutput> {
    // Deterministic canned reply drawing only on allowed vocabulary --
    // enough to demonstrate the scenario-mission loop without an LLM.
    return {
      npcResponseFrench: 'Bonjour ! Enchanté.',
      englishGloss: 'Hello! Pleased to meet you.',
      itemIdsUsed: input.envelope.allowedVocabularyIds.filter((id) =>
        ['vocab.bonjour', 'vocab.enchante'].includes(id),
      ),
    };
  }

  async explainError(input: ExplainErrorInput): Promise<string> {
    return `Meaning target: "${input.expectedMeaning}". Your response: "${input.learnerResponse}". Focus on the core words, not perfect form.`;
  }

  async selectRemediation(input: SelectRemediationInput): Promise<SelectRemediationOutput> {
    return {
      itemIds: input.failedItemIds,
      approach: 'recognition',
    };
  }
}
