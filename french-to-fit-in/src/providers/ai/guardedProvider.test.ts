import { describe, expect, it } from 'vitest';
import { createGuardedAIProvider, AIProviderGuardRejection } from './guardedProvider';
import type { AIProvider } from '../../types/ai';
import { buildCurriculumEnvelope } from './envelope';
import { getDayByNumber } from '../../content/curriculum';

const day1 = getDayByNumber(1)!;
const envelope = buildCurriculumEnvelope(day1, 'test');

describe('guarded AI provider: forbidden future-content rejection', () => {
  it('strips forbidden future item ids from evaluateLearnerResponse output', async () => {
    const misbehavingProvider: AIProvider = {
      async evaluateLearnerResponse() {
        return {
          classification: 'CORRECT',
          retrievalOutcome: 'ACCURATE',
          feedback: 'ok',
          itemIds: ['vocab.bonjour', 'vocab.future-item-from-day-99'],
          shouldAdvance: true,
        };
      },
      async generateAllowedScenarioResponse() {
        throw new Error('not used');
      },
      async explainError() {
        return 'n/a';
      },
      async selectRemediation() {
        return { itemIds: [], approach: 'recognition' };
      },
    };

    const guarded = createGuardedAIProvider(misbehavingProvider);
    const result = await guarded.evaluateLearnerResponse({
      envelope,
      exerciseId: 'test',
      itemIds: ['vocab.bonjour'],
      acceptableAnswers: ['bonjour'],
      learnerResponse: 'bonjour',
    });

    expect(result.itemIds).toEqual(['vocab.bonjour']);
    expect(result.itemIds).not.toContain('vocab.future-item-from-day-99');
  });

  it('rejects a scenario response that uses forbidden future material', async () => {
    const misbehavingProvider: AIProvider = {
      async evaluateLearnerResponse() {
        throw new Error('not used');
      },
      async generateAllowedScenarioResponse() {
        return {
          npcResponseFrench: 'Je voudrais un café allongé, sur la terrasse, si possible.',
          englishGloss: 'far future vocabulary',
          itemIdsUsed: ['vocab.future-item-from-day-99'],
        };
      },
      async explainError() {
        return 'n/a';
      },
      async selectRemediation() {
        return { itemIds: [], approach: 'recognition' };
      },
    };

    const guarded = createGuardedAIProvider(misbehavingProvider);
    await expect(
      guarded.generateAllowedScenarioResponse({
        envelope,
        scenarioGoal: 'test',
        learnerUtterance: 'bonjour',
      }),
    ).rejects.toThrow(AIProviderGuardRejection);
  });

  it('rejects output that fails schema validation entirely', async () => {
    const misbehavingProvider = {
      async evaluateLearnerResponse() {
        return { garbage: true } as never;
      },
      async generateAllowedScenarioResponse() {
        throw new Error('not used');
      },
      async explainError() {
        return 'n/a';
      },
      async selectRemediation() {
        return { itemIds: [], approach: 'recognition' as const };
      },
    };

    const guarded = createGuardedAIProvider(misbehavingProvider);
    await expect(
      guarded.evaluateLearnerResponse({
        envelope,
        exerciseId: 'test',
        itemIds: ['vocab.bonjour'],
        acceptableAnswers: ['bonjour'],
        learnerResponse: 'bonjour',
      }),
    ).rejects.toThrow(AIProviderGuardRejection);
  });
});
