import { z } from 'zod';

/** Schema validation for AI provider output before it is ever trusted. */
export const generateScenarioResponseOutputSchema = z.object({
  npcResponseFrench: z.string().min(1),
  englishGloss: z.string().min(1),
  itemIdsUsed: z.array(z.string()),
});

export const selectRemediationOutputSchema = z.object({
  itemIds: z.array(z.string()),
  approach: z.enum(['recognition', 'completion', 'contrast', 'short_production', 'new_context_reuse']),
});

export const evaluationResultSchema = z.object({
  classification: z.enum(['CORRECT', 'FUNCTIONAL', 'PARTIAL', 'FAILED']),
  retrievalOutcome: z.enum([
    'ACCURATE',
    'MEANING_PRESERVED_IMPERFECT',
    'PARTIALLY_RETRIEVED',
    'FAILED_RETRIEVAL',
    'SKIPPED',
  ]),
  feedback: z.string(),
  itemIds: z.array(z.string()),
  shouldAdvance: z.boolean(),
});
