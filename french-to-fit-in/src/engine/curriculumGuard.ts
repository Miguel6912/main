/**
 * CURRICULUM GUARD.
 *
 * The single choke point that prevents future curriculum material from
 * leaking backward into an earlier day -- for hand-authored content and for
 * AI-generated content alike (see providers/ai for how AI output is
 * re-checked here before being trusted).
 *
 * Development: violations throw immediately (fail loud during authoring).
 * Production: violations are swallowed (the offending item is not
 * rendered) and recorded in an in-memory violation log for the pilot
 * dashboard / manual inspection.
 */
import { VOCABULARY } from '../content/vocabulary';
import { ENGINES } from '../content/engines';
import type { DayDefinition, ExerciseDefinition } from '../types';

export class CurriculumViolationError extends Error {
  violations: GuardViolation[];
  constructor(message: string, violations: GuardViolation[]) {
    super(message);
    this.name = 'CurriculumViolationError';
    this.violations = violations;
  }
}

export interface GuardViolation {
  itemId: string;
  dayNumber: number;
  reason: string;
}

const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as ImportMeta).env?.DEV);

const violationLog: GuardViolation[] = [];

export function getCurriculumViolationLog(): readonly GuardViolation[] {
  return violationLog;
}

export function clearCurriculumViolationLog(): void {
  violationLog.length = 0;
}

/** Returns the first day an item may be used, or null if the id is unknown. */
export function firstAllowedDayForItem(itemId: string): number | null {
  const vocab = VOCABULARY.find((v) => v.id === itemId);
  if (vocab) return vocab.firstAllowedDay;
  const engine = ENGINES.find((e) => e.id === itemId);
  if (engine) return engine.introducedDay;
  return null;
}

/** Checks a flat list of item ids against a target day. Pure -- no throwing, no logging. */
export function checkItemsAllowed(dayNumber: number, itemIds: string[]): GuardViolation[] {
  const violations: GuardViolation[] = [];
  for (const itemId of itemIds) {
    const firstDay = firstAllowedDayForItem(itemId);
    if (firstDay === null) {
      violations.push({
        itemId,
        dayNumber,
        reason: `Unknown item id "${itemId}" -- not declared in content/vocabulary.ts or content/engines.ts.`,
      });
    } else if (firstDay > dayNumber) {
      violations.push({
        itemId,
        dayNumber,
        reason: `"${itemId}" is first allowed on day ${firstDay}, but was requested for day ${dayNumber}.`,
      });
    }
  }
  return violations;
}

function recordOrThrow(dayNumber: number, violations: GuardViolation[]): void {
  if (violations.length === 0) return;
  if (isDev) {
    const message = violations.map((v) => `${v.itemId}: ${v.reason}`).join(' | ');
    throw new CurriculumViolationError(`Curriculum guard violation on day ${dayNumber}: ${message}`, violations);
  }
  violationLog.push(...violations);
  for (const v of violations) {
    // eslint-disable-next-line no-console
    console.error(`[curriculum-guard] blocked: ${v.itemId} (${v.reason})`);
  }
}

/**
 * assertContentAllowed(day, content) -- verifies a flat set of item ids is
 * safe to present on the given day. Throws in dev, logs+swallows in prod.
 */
export function assertContentAllowed(dayNumber: number, itemIds: string[]): GuardViolation[] {
  const violations = checkItemsAllowed(dayNumber, itemIds);
  recordOrThrow(dayNumber, violations);
  return violations;
}

/** Filters a list of item ids down to only those allowed on dayNumber (production-safe). */
export function filterAllowedItemIds(dayNumber: number, itemIds: string[]): string[] {
  return itemIds.filter((id) => {
    const firstDay = firstAllowedDayForItem(id);
    return firstDay !== null && firstDay <= dayNumber;
  });
}

function collectExerciseItemIds(exercise: ExerciseDefinition): string[] {
  return exercise.usesItemIds;
}

/**
 * Validates an entire DayDefinition: every vocabulary/engine reference in
 * its lesson blocks, retrieval pool, and application-mission exercises must
 * be introduced on or before that day. Also verifies newEngines/
 * newVocabulary are themselves introduced on exactly this day (no
 * forward-declaring another day's material as "new" on this one, and no
 * silently dropping declared items).
 */
export function assertDayContentAllowed(day: DayDefinition): GuardViolation[] {
  const allReferencedIds = new Set<string>();
  day.retrievalPool.forEach((id) => allReferencedIds.add(id));
  day.newEngines.forEach((id) => allReferencedIds.add(id));
  day.newVocabulary.forEach((id) => allReferencedIds.add(id));
  for (const block of day.lessonBlocks) {
    (block.introducesItemIds ?? []).forEach((id) => allReferencedIds.add(id));
  }
  for (const mission of day.applicationMissions) {
    mission.usesItemIds.forEach((id) => allReferencedIds.add(id));
    for (const exercise of mission.exercises) {
      collectExerciseItemIds(exercise).forEach((id) => allReferencedIds.add(id));
    }
  }

  const violations = checkItemsAllowed(day.dayNumber, Array.from(allReferencedIds));

  for (const id of [...day.newEngines, ...day.newVocabulary]) {
    const firstDay = firstAllowedDayForItem(id);
    if (firstDay !== null && firstDay !== day.dayNumber) {
      violations.push({
        itemId: id,
        dayNumber: day.dayNumber,
        reason: `Declared as "new" on day ${day.dayNumber} but its content record says firstAllowedDay/introducedDay=${firstDay}.`,
      });
    }
  }

  recordOrThrow(day.dayNumber, violations);
  return violations;
}
