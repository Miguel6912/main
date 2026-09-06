import type { DayDefinition, ExerciseDefinition, SessionPhase } from '../../types';

export function allExercises(day: DayDefinition): ExerciseDefinition[] {
  return day.applicationMissions.flatMap((m) => m.exercises);
}

/** Maps the pressure-gradient level (1-5) onto the session phase that presents it. */
export function exercisesForPhase(day: DayDefinition, phase: SessionPhase): ExerciseDefinition[] {
  const exercises = allExercises(day);
  switch (phase) {
    case 'CONTROLLED_MANIPULATION':
      return exercises.filter((e) => e.level === 1 || e.level === 2);
    case 'APPLICATION':
      return exercises.filter((e) => e.level === 3);
    case 'PRESSURE_TRANSFER':
      return exercises.filter((e) => e.level === 4 || e.level === 5);
    default:
      return [];
  }
}
