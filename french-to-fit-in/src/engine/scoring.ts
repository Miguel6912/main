/**
 * Deterministic response scoring -- the mock/offline evaluator the app uses
 * when no AI provider is configured (see providers/ai/mockProvider.ts,
 * which wraps this). Never punishes small spelling/accent errors when
 * meaning is clearly preserved (project brief RETRIEVAL GATE rules).
 */
import type { EvaluationResult, ResponseClassification, RetrievalOutcome } from '../types/evaluation';

function stripAccents(input: string): string {
  return input.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalize(input: string): string {
  return stripAccents(input)
    .toLowerCase()
    .replace(/[.,!?;:'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[a.length][b.length];
}

function wordOverlapRatio(response: string, target: string): number {
  const responseWords = new Set(response.split(' ').filter(Boolean));
  const targetWords = target.split(' ').filter(Boolean);
  if (targetWords.length === 0) return 0;
  const matched = targetWords.filter((w) => responseWords.has(w)).length;
  return matched / targetWords.length;
}

export interface ScoreResponseInput {
  learnerResponse: string;
  acceptableAnswers: string[];
  itemIds: string[];
  /** If true, a non-answer question response is graded loosely (open scenario turns). */
  lenientScenario?: boolean;
}

const SKIP_TOKEN = '?';

export function scoreResponse(input: ScoreResponseInput): EvaluationResult {
  const rawResponse = input.learnerResponse.trim();

  if (rawResponse === SKIP_TOKEN) {
    const reveal = input.acceptableAnswers[0];
    return {
      classification: 'FAILED',
      retrievalOutcome: 'SKIPPED',
      feedback: reveal
        ? `It's "${reveal}". Try producing it yourself once more in a moment.`
        : "No single fixed answer here -- there's nothing to reveal. Try producing something, even imperfect.",
      itemIds: input.itemIds,
      shouldAdvance: false,
    };
  }

  if (input.acceptableAnswers.length === 0) {
    // Open scenario turn (MicroDialogue/RepairScenario/ScenarioMission) with
    // no single ground truth -- any non-empty attempt in French counts as a
    // genuine attempt and advances; deeper evaluation happens via the AI
    // provider layer when configured.
    const attempted = rawResponse.length > 0;
    return {
      classification: attempted ? 'FUNCTIONAL' : 'FAILED',
      retrievalOutcome: attempted ? 'MEANING_PRESERVED_IMPERFECT' : 'FAILED_RETRIEVAL',
      feedback: attempted
        ? 'Good -- you kept the interaction going in French.'
        : 'Try producing something, even imperfect -- staying in French matters more than being exact.',
      itemIds: input.itemIds,
      shouldAdvance: attempted,
    };
  }

  const normResponse = normalize(rawResponse);
  const normalizedAnswers = input.acceptableAnswers.map(normalize);

  if (normalizedAnswers.includes(normResponse)) {
    return {
      classification: 'CORRECT',
      retrievalOutcome: 'ACCURATE',
      feedback: 'Correct.',
      itemIds: input.itemIds,
      shouldAdvance: true,
    };
  }

  // Close match: small edit distance relative to answer length -> meaning
  // clearly preserved, just an imperfect spelling/accent/typo.
  const bestByDistance = normalizedAnswers
    .map((answer) => ({ answer, distance: levenshtein(normResponse, answer) }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (bestByDistance && bestByDistance.distance <= Math.max(2, Math.ceil(bestByDistance.answer.length * 0.2))) {
    return {
      classification: 'FUNCTIONAL',
      retrievalOutcome: 'MEANING_PRESERVED_IMPERFECT',
      feedback: `Meaning survived. The exact form is "${input.acceptableAnswers[0]}" -- close enough to move on.`,
      itemIds: input.itemIds,
      shouldAdvance: true,
    };
  }

  const bestOverlap = normalizedAnswers
    .map((answer) => wordOverlapRatio(normResponse, answer))
    .reduce((max, r) => Math.max(max, r), 0);

  // All of the target's core words are present (possibly with extra words
  // around them, e.g. handing the question back AND adding their own name)
  // -- meaning is fully preserved even though the surface form differs.
  if (bestOverlap >= 1.0) {
    return {
      classification: 'FUNCTIONAL',
      retrievalOutcome: 'MEANING_PRESERVED_IMPERFECT',
      feedback: 'Meaning survived, and you kept going -- good.',
      itemIds: input.itemIds,
      shouldAdvance: true,
    };
  }

  // Partial: response shares some but not all of the target's words.
  if (bestOverlap >= 0.4) {
    return {
      classification: 'PARTIAL',
      retrievalOutcome: 'PARTIALLY_RETRIEVED',
      feedback: `Partly there. Full form: "${input.acceptableAnswers[0]}". Try it once more.`,
      itemIds: input.itemIds,
      shouldAdvance: false,
    };
  }

  return {
    classification: 'FAILED',
    retrievalOutcome: 'FAILED_RETRIEVAL',
    feedback: `Not quite. "${input.acceptableAnswers[0]}" is what we're after -- try it once more.`,
    itemIds: input.itemIds,
    shouldAdvance: false,
  };
}

export function classificationAdvancesSession(classification: ResponseClassification): boolean {
  return classification === 'CORRECT' || classification === 'FUNCTIONAL';
}

export function retrievalOutcomeFromClassification(classification: ResponseClassification): RetrievalOutcome {
  switch (classification) {
    case 'CORRECT':
      return 'ACCURATE';
    case 'FUNCTIONAL':
      return 'MEANING_PRESERVED_IMPERFECT';
    case 'PARTIAL':
      return 'PARTIALLY_RETRIEVED';
    case 'FAILED':
      return 'FAILED_RETRIEVAL';
  }
}
