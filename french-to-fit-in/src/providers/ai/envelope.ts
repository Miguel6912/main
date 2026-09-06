import type { CurriculumEnvelope, DayDefinition } from '../../types';
import { CURRICULUM, getAllItemIdsUpToDay } from '../../content/curriculum';

/**
 * Builds the CURRICULUM ENVELOPE for a given day/exercise -- the only
 * context an AI provider ever receives. Forbidden future capabilities are
 * listed explicitly so a provider (and the curriculum guard re-checking its
 * output) can reject anything that leaks material forward.
 */
export function buildCurriculumEnvelope(day: DayDefinition, exerciseObjective: string): CurriculumEnvelope {
  const previouslyIntroducedIds = Array.from(getAllItemIdsUpToDay(day.dayNumber));
  const forbiddenFutureCapabilities = CURRICULUM.filter((d) => d.dayNumber > day.dayNumber).map(
    (d) => d.capability,
  );
  return {
    dayNumber: day.dayNumber,
    allowedCapabilities: [day.capability],
    allowedVocabularyIds: previouslyIntroducedIds,
    previouslyIntroducedIds,
    forbiddenFutureCapabilities,
    exerciseObjective,
  };
}
