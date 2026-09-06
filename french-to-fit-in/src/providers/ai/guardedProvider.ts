/**
 * Wraps any AIProvider so its output is always schema-validated AND
 * re-checked against the curriculum guard before the app trusts it. If a
 * provider (mock or real) introduces forbidden/future material, that
 * material is stripped or the call is rejected -- it never reaches the UI.
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
import { checkItemsAllowed } from '../../engine/curriculumGuard';
import {
  evaluationResultSchema,
  generateScenarioResponseOutputSchema,
  selectRemediationOutputSchema,
} from './schema';

export class AIProviderGuardRejection extends Error {}

export function createGuardedAIProvider(inner: AIProvider): AIProvider {
  return {
    async evaluateLearnerResponse(input: EvaluateLearnerResponseInput): Promise<EvaluationResult> {
      const raw = await inner.evaluateLearnerResponse(input);
      const parsed = evaluationResultSchema.safeParse(raw);
      if (!parsed.success) {
        throw new AIProviderGuardRejection('AI evaluation output failed schema validation.');
      }
      const violations = checkItemsAllowed(input.envelope.dayNumber, parsed.data.itemIds);
      return { ...parsed.data, itemIds: parsed.data.itemIds.filter((id) => !violations.some((v) => v.itemId === id)) };
    },

    async generateAllowedScenarioResponse(
      input: GenerateScenarioResponseInput,
    ): Promise<GenerateScenarioResponseOutput> {
      const raw = await inner.generateAllowedScenarioResponse(input);
      const parsed = generateScenarioResponseOutputSchema.safeParse(raw);
      if (!parsed.success) {
        throw new AIProviderGuardRejection('AI scenario-response output failed schema validation.');
      }
      const violations = checkItemsAllowed(input.envelope.dayNumber, parsed.data.itemIdsUsed);
      if (violations.length > 0) {
        throw new AIProviderGuardRejection(
          `AI scenario response used forbidden material: ${violations.map((v) => v.itemId).join(', ')}`,
        );
      }
      return parsed.data;
    },

    async explainError(input: ExplainErrorInput): Promise<string> {
      return inner.explainError(input);
    },

    async selectRemediation(input: SelectRemediationInput): Promise<SelectRemediationOutput> {
      const raw = await inner.selectRemediation(input);
      const parsed = selectRemediationOutputSchema.safeParse(raw);
      if (!parsed.success) {
        throw new AIProviderGuardRejection('AI remediation-selection output failed schema validation.');
      }
      const violations = checkItemsAllowed(input.envelope.dayNumber, parsed.data.itemIds);
      return {
        ...parsed.data,
        itemIds: parsed.data.itemIds.filter((id) => !violations.some((v) => v.itemId === id)),
      };
    },
  };
}
