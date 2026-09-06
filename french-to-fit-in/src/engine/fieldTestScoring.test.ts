import { describe, expect, it } from 'vitest';
import { scoreFieldTest, isProgressionJustified } from './fieldTestScoring';
import type { FieldTestStep } from '../types/fieldTest';

const STEPS: FieldTestStep[] = [
  {
    id: 'step-1',
    promptEnglish: 'Greet and introduce yourself.',
    objective: 'Open the interaction.',
    itemIdsInPlay: ['vocab.bonjour', 'engine.je-mappelle'],
  },
  {
    id: 'step-2',
    promptEnglish: 'The listener looks confused -- repair the misunderstanding.',
    objective: 'Repair a misunderstanding without switching to English.',
    itemIdsInPlay: ['vocab.excusez-moi'],
  },
];

describe('field test scoring', () => {
  it('scores 0 across all dimensions when no steps are authored', () => {
    const result = scoreFieldTest([], []);
    expect(result.every((d) => d.score === 0)).toBe(true);
  });

  it('scores highly for a confident, in-French, on-target response', () => {
    const result = scoreFieldTest(STEPS, [
      { stepId: 'step-1', answer: "Bonjour, je m'appelle Claude." },
      { stepId: 'step-2', answer: "Excusez-moi, je m'appelle Claude." },
    ]);
    const retrieval = result.find((d) => d.dimension === 'RETRIEVAL')!;
    const control = result.find((d) => d.dimension === 'CONTROL')!;
    const repair = result.find((d) => d.dimension === 'REPAIR')!;
    expect(retrieval.score).toBeGreaterThanOrEqual(2);
    expect(control.score).toBeGreaterThanOrEqual(2);
    expect(repair.score).toBeGreaterThanOrEqual(2);
  });

  it('scores CONTROL low when the learner falls back to English filler words', () => {
    const result = scoreFieldTest(STEPS, [
      { stepId: 'step-1', answer: 'hello my name is Claude' },
      { stepId: 'step-2', answer: 'sorry please' },
    ]);
    const control = result.find((d) => d.dimension === 'CONTROL')!;
    expect(control.score).toBe(0);
  });

  it('scores REPAIR low when a repair-required step gets no repair phrase', () => {
    const result = scoreFieldTest(STEPS, [
      { stepId: 'step-1', answer: "Bonjour, je m'appelle Claude." },
      { stepId: 'step-2', answer: "je m'appelle Claude" },
    ]);
    const repair = result.find((d) => d.dimension === 'REPAIR')!;
    expect(repair.score).toBe(0);
  });

  it('scores 0 for an unanswered step', () => {
    const result = scoreFieldTest(STEPS, []);
    const retrieval = result.find((d) => d.dimension === 'RETRIEVAL')!;
    expect(retrieval.score).toBe(0);
  });

  it('progression is not justified when any dimension scores 0', () => {
    const result = scoreFieldTest(STEPS, [{ stepId: 'step-1', answer: "Bonjour, je m'appelle Claude." }]);
    expect(isProgressionJustified(result)).toBe(false);
  });

  it('progression is justified with strong, well-rounded performance', () => {
    const result = scoreFieldTest(STEPS, [
      { stepId: 'step-1', answer: "Bonjour, je m'appelle Claude, enchanté." },
      { stepId: 'step-2', answer: "Excusez-moi, je m'appelle Claude, encore une fois." },
    ]);
    expect(isProgressionJustified(result)).toBe(true);
  });

  it('never automatically passes an empty attempt', () => {
    const result = scoreFieldTest(STEPS, [
      { stepId: 'step-1', answer: '' },
      { stepId: 'step-2', answer: '' },
    ]);
    expect(isProgressionJustified(result)).toBe(false);
  });
});
