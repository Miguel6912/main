/**
 * Field test scenario definitions for Day 7 / 14 / 21 / 30.
 * All DRAFT -- shells only, ready for a curriculum author to populate with
 * approved scenario steps. Field tests score RETRIEVAL / CONTROL / REPAIR /
 * TRANSFER (0-3 each); see engine/scoring.ts.
 */
import type { FieldTestDefinition } from '../types';

export const FIELD_TESTS: FieldTestDefinition[] = [
  {
    id: 'field-test-week-1',
    afterDayNumber: 7,
    title: 'Week 1 Field Test',
    scenario:
      '[DRAFT] A short, unscripted real-world interaction drawing only on Days 1-7 material (entering a conversation, expressing needs, asking questions, making plans).',
    steps: [
      {
        id: 'week1-ft-step-1',
        promptEnglish: 'Enter the interaction and introduce yourself without switching to English.',
        objective: 'Open the interaction independently.',
        itemIdsInPlay: ['vocab.bonjour', 'engine.je-mappelle'],
      },
    ],
    status: 'DRAFT',
  },
  {
    id: 'field-test-week-2',
    afterDayNumber: 14,
    title: 'Week 2 Field Test',
    scenario: '[DRAFT] Scenario drawing on Days 8-14 (navigation, description, past events, routines, comparisons).',
    steps: [],
    status: 'DRAFT',
  },
  {
    id: 'field-test-week-3',
    afterDayNumber: 21,
    title: 'Week 3 Field Test',
    scenario: '[DRAFT] Scenario drawing on Days 15-21 (social conversation, opinions, storytelling, group talk).',
    steps: [],
    status: 'DRAFT',
  },
  {
    id: 'field-test-final',
    afterDayNumber: 30,
    title: 'Final Mission',
    scenario: '[DRAFT] Independent multi-step day-in-the-life mission drawing on the full 30-day curriculum.',
    steps: [],
    status: 'DRAFT',
  },
];

export function getFieldTestById(id: string): FieldTestDefinition | undefined {
  return FIELD_TESTS.find((ft) => ft.id === id);
}
