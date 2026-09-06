export type FieldTestDimension = 'RETRIEVAL' | 'CONTROL' | 'REPAIR' | 'TRANSFER';

/** 0 = unable, 1 = heavily supported, 2 = functional, 3 = independent. */
export type FieldTestScore = 0 | 1 | 2 | 3;

export interface FieldTestDimensionResult {
  dimension: FieldTestDimension;
  score: FieldTestScore;
  notes: string;
}

export interface FieldTestStep {
  id: string;
  promptEnglish: string;
  /** The scenario "beat" this step is testing, e.g. "order without English". */
  objective: string;
  itemIdsInPlay: string[];
}

export interface FieldTestDefinition {
  id: string;
  afterDayNumber: number;
  title: string;
  scenario: string;
  steps: FieldTestStep[];
  status: 'DRAFT' | 'APPROVED';
}

export interface FieldTestResult {
  fieldTestId: string;
  completedAt: string;
  dimensionResults: FieldTestDimensionResult[];
  whatWorked: string[];
  whatBroke: string[];
  whatNeedsRetrieval: string[];
  progressionJustified: boolean;
}
