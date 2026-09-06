/**
 * Curriculum data types.
 *
 * The 30-day capability sequence is LOCKED (see src/content/curriculum.ts).
 * These types describe the shape of that locked data; they do not enforce
 * the lock themselves -- see src/engine/curriculumGuard.ts for enforcement.
 */

export type Week = 1 | 2 | 3 | 4;

export type ContentStatus = 'DRAFT' | 'APPROVED';

/** Unique id for a single trainable capability, e.g. "enter-conversation". */
export type CapabilityId = string;

/** Unique id for a vocabulary or engine item, e.g. "vocab.je-voudrais". */
export type ItemId = string;

export type LedgerItemType = 'ENGINE' | 'INTERACTION' | 'DOMAIN' | 'PHRASE' | 'PATTERN';

export interface DayDependency {
  /** Day number this day depends on (must be <= dayNumber - 1). */
  dayNumber: number;
  /** Human-readable reason the dependency exists. */
  reason: string;
}

export type LessonBlockKind =
  | 'EXPLANATION'
  | 'SOUND_ANCHOR'
  | 'MODEL_SENTENCE'
  | 'CONTROLLED_MANIPULATION';

export interface SoundAnchor {
  /** The French sound being introduced, e.g. "u" */
  sound: string;
  /** Short plain-English anchor, e.g. "keep tongue near English 'ee'..." */
  anchor: string;
  /** Mouth/tongue/lip instruction. */
  articulation: string;
}

export interface LessonBlock {
  id: string;
  kind: LessonBlockKind;
  /** Plain-English teaching text shown to the learner. */
  text: string;
  /** French model sentence(s) demonstrated, if any. */
  modelFrench?: string[];
  soundAnchor?: SoundAnchor;
  /** Item ids this block introduces (must match newVocabulary/newEngines). */
  introducesItemIds?: ItemId[];
}

export type ExerciseKind =
  | 'RetrievalProduction'
  | 'MeaningRecognition'
  | 'SentenceCompletion'
  | 'ControlledTransformation'
  | 'QuestionResponse'
  | 'ListenAndRespond'
  | 'RepairScenario'
  | 'MicroDialogue'
  | 'ScenarioMission';

/** Pressure gradient level within an exercise sequence. */
export type PressureLevel = 1 | 2 | 3 | 4 | 5;

export type AudioDifficulty =
  | 'CLEAN'
  | 'NATURAL'
  | 'CONNECTED_SPEECH'
  | 'ALTERNATE_SPEAKER'
  | 'NOISY';

export interface ExerciseDefinition {
  id: string;
  kind: ExerciseKind;
  level: PressureLevel;
  /** Prompt shown to the learner (English framing + French where relevant). */
  promptEnglish?: string;
  promptFrench?: string;
  /** Item ids this exercise is allowed to use -- must all be <= current day. */
  usesItemIds: ItemId[];
  /** Acceptable answer(s); evaluators use this as ground truth. */
  acceptableAnswers: string[];
  /** For listening exercises. */
  audioDifficulty?: AudioDifficulty;
  audioScript?: string;
  /** Free-form scenario description for ScenarioMission exercises. */
  scenarioGoal?: string;
}

export interface ApplicationMission {
  id: string;
  title: string;
  description: string;
  /** Item ids the mission is built from. */
  usesItemIds: ItemId[];
  exercises: ExerciseDefinition[];
}

export interface DayDefinition {
  id: string;
  dayNumber: number;
  title: string;
  week: Week;
  /** Short capability statement, e.g. "Enter a conversation politely." */
  capability: string;
  learningOutcome: string;
  dependencies: DayDependency[];
  newEngines: ItemId[];
  newVocabulary: ItemId[];
  retrievalPool: ItemId[];
  lessonBlocks: LessonBlock[];
  applicationMissions: ApplicationMission[];
  fieldTestId?: string;
  estimatedMinutes: number;
  /** Content authorship status -- never present DRAFT content as canonical. */
  status: ContentStatus;
}

export interface WeekFieldTest {
  id: string;
  afterDayNumber: number;
  title: string;
}
