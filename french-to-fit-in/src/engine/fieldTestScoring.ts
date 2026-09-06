/**
 * Field-test scoring: deterministic heuristics across the four required
 * dimensions (RETRIEVAL / CONTROL / REPAIR / TRANSFER), each 0-3. This is
 * explicitly a heuristic proxy, not a claim of linguistic assessment --
 * grammar accuracy only pulls a score down when it would change meaning,
 * block comprehension, or block the interaction goal (see project brief).
 */
import { VOCABULARY } from '../content/vocabulary';
import { ENGINES } from '../content/engines';
import type { FieldTestDimensionResult, FieldTestScore, FieldTestStep } from '../types/fieldTest';

const ENGLISH_FILLER_WORDS = new Set([
  'the',
  'is',
  'hello',
  'yes',
  'no',
  'please',
  'thanks',
  'thank',
  'you',
  'sorry',
  'my',
  'name',
  'and',
]);

const REPAIR_MARKERS = ['excusez-moi', 'pardon', "je ne comprends pas", 'répétez'];

function canonicalFor(itemId: string): string | null {
  const v = VOCABULARY.find((x) => x.id === itemId);
  if (v) return v.canonicalFrench;
  const e = ENGINES.find((x) => x.id === itemId);
  if (e) return e.canonicalFrench;
  return null;
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.,!?;:'"()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export interface FieldTestStepResponse {
  stepId: string;
  answer: string;
}

function scoreToLevel(fraction: number): FieldTestScore {
  if (fraction >= 0.8) return 3;
  if (fraction >= 0.5) return 2;
  if (fraction > 0) return 1;
  return 0;
}

export function scoreFieldTest(
  steps: FieldTestStep[],
  responses: FieldTestStepResponse[],
): FieldTestDimensionResult[] {
  if (steps.length === 0) {
    return [
      { dimension: 'RETRIEVAL', score: 0, notes: 'No scenario steps authored yet.' },
      { dimension: 'CONTROL', score: 0, notes: 'No scenario steps authored yet.' },
      { dimension: 'REPAIR', score: 0, notes: 'No scenario steps authored yet.' },
      { dimension: 'TRANSFER', score: 0, notes: 'No scenario steps authored yet.' },
    ];
  }

  let retrievalHits = 0;
  let controlHits = 0;
  let repairApplicableSteps = 0;
  let repairHits = 0;
  let transferHits = 0;

  for (const step of steps) {
    const response = responses.find((r) => r.stepId === step.id);
    const answer = response?.answer.trim() ?? '';
    const words = normalizeWords(answer);

    const targetWords = step.itemIdsInPlay
      .map(canonicalFor)
      .filter((w): w is string => Boolean(w))
      .flatMap((w) => normalizeWords(w));
    if (answer.length > 0 && targetWords.some((w) => words.includes(w))) {
      retrievalHits += 1;
    }

    const englishWordCount = words.filter((w) => ENGLISH_FILLER_WORDS.has(w)).length;
    if (answer.length > 0 && englishWordCount === 0) {
      controlHits += 1;
    }

    const objectiveNeedsRepair = /repair|misunderstand|confus|didn'?t catch/i.test(step.objective);
    if (objectiveNeedsRepair) {
      repairApplicableSteps += 1;
      if (REPAIR_MARKERS.some((marker) => answer.toLowerCase().includes(marker))) {
        repairHits += 1;
      }
    }

    // TRANSFER proxy: response is more than a bare single word, i.e. the
    // learner produced a fuller utterance rather than a memorized fragment.
    if (words.length >= 3) {
      transferHits += 1;
    }
  }

  const retrievalScore = scoreToLevel(retrievalHits / steps.length);
  const controlScore = scoreToLevel(controlHits / steps.length);
  const repairScore: FieldTestScore =
    repairApplicableSteps > 0 ? scoreToLevel(repairHits / repairApplicableSteps) : 2;
  const transferScore = scoreToLevel(transferHits / steps.length);

  return [
    {
      dimension: 'RETRIEVAL',
      score: retrievalScore,
      notes: `Used target material in ${retrievalHits}/${steps.length} steps.`,
    },
    {
      dimension: 'CONTROL',
      score: controlScore,
      notes: `Stayed in French (no English fallback words detected) in ${controlHits}/${steps.length} steps.`,
    },
    {
      dimension: 'REPAIR',
      score: repairScore,
      notes:
        repairApplicableSteps > 0
          ? `Used a repair phrase in ${repairHits}/${repairApplicableSteps} steps that needed one.`
          : 'No steps in this field test required a repair move.',
    },
    {
      dimension: 'TRANSFER',
      score: transferScore,
      notes: `Produced a fuller utterance (not just a memorized fragment) in ${transferHits}/${steps.length} steps.`,
    },
  ];
}

export function isProgressionJustified(dimensionResults: FieldTestDimensionResult[]): boolean {
  if (dimensionResults.length === 0) return false;
  const noZeroes = dimensionResults.every((d) => d.score > 0);
  const average = dimensionResults.reduce((sum, d) => sum + d.score, 0) / dimensionResults.length;
  return noZeroes && average >= 1.5;
}
