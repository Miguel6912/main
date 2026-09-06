import { describe, expect, it } from 'vitest';
import { CURRICULUM, WEEK_FIELD_TESTS, getDayByNumber } from './curriculum';
import { assertDayContentAllowed } from '../engine/curriculumGuard';

const LOCKED_TITLES = [
  'Enter the Conversation',
  'Express What Matters',
  'Take Control With Questions',
  'Stay in French When It Breaks',
  'Turn Sentences Into Thoughts',
  'Control Your World',
  'Make Plans',
  'Find Your Way Through a Place',
  'Describe What You Cannot Name',
  'Make Yourself Precise',
  'Talk About What Happened',
  "Talk About Where You've Been",
  'Explain Your Normal Life',
  'Choose, Compare and Recommend',
  'Keep a Conversation Alive',
  'React Like a Human',
  'Turn Conversation Into Social Life',
  'Have an Opinion',
  'Tell a Story Worth Hearing',
  'Recognise the French People Actually Speak',
  'Join the Conversation',
  'Solve a Problem',
  'Survive Without Seeing the Other Person',
  'Navigate Systems and Paperwork',
  'Explain What Is Wrong With You',
  'Explain What You Do',
  'Handle Friction Without Losing the Conversation',
  'Hear Through the Noise',
  'Say What You Mean Without Knowing the Words',
  'Live Here',
];

describe('curriculum order (locked)', () => {
  it('has exactly 30 days', () => {
    expect(CURRICULUM).toHaveLength(30);
  });

  it('has sequential day numbers 1-30 with no gaps, duplicates, or reordering', () => {
    const dayNumbers = CURRICULUM.map((d) => d.dayNumber);
    expect(dayNumbers).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it('matches the exact locked titles in the exact locked order', () => {
    expect(CURRICULUM.map((d) => d.title)).toEqual(LOCKED_TITLES);
  });

  it('groups days into the correct weeks', () => {
    for (const day of CURRICULUM) {
      if (day.dayNumber <= 7) expect(day.week).toBe(1);
      else if (day.dayNumber <= 14) expect(day.week).toBe(2);
      else if (day.dayNumber <= 21) expect(day.week).toBe(3);
      else expect(day.week).toBe(4);
    }
  });

  it('places field tests after days 7, 14, 21, and 30 only', () => {
    expect(WEEK_FIELD_TESTS.map((ft) => ft.afterDayNumber)).toEqual([7, 14, 21, 30]);
  });

  it('every day depends only on the immediately preceding day (no invented prerequisites)', () => {
    for (const day of CURRICULUM) {
      if (day.dayNumber === 1) {
        expect(day.dependencies).toHaveLength(0);
      } else {
        expect(day.dependencies).toHaveLength(1);
        expect(day.dependencies[0].dayNumber).toBe(day.dayNumber - 1);
      }
    }
  });

  it('getDayByNumber finds days by number and returns undefined out of range', () => {
    expect(getDayByNumber(1)?.title).toBe('Enter the Conversation');
    expect(getDayByNumber(30)?.title).toBe('Live Here');
    expect(getDayByNumber(31)).toBeUndefined();
    expect(getDayByNumber(0)).toBeUndefined();
  });

  it('every authored day passes the curriculum guard against itself (no forward leakage)', () => {
    for (const day of CURRICULUM) {
      expect(() => assertDayContentAllowed(day)).not.toThrow();
    }
  });
});
