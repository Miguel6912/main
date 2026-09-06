import { useCallback, useMemo, useState } from 'react';
import { getFieldTestById } from '../../content/fieldTests';
import { scoreFieldTest, isProgressionJustified, type FieldTestStepResponse } from '../../engine/fieldTestScoring';
import { saveFieldTestResult } from '../../storage/fieldTestStore';
import { recordPilotEvent } from '../../storage/pilotStore';
import type { FieldTestResult } from '../../types/fieldTest';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const DIMENSION_LOW_MESSAGE: Record<string, string> = {
  RETRIEVAL: 'Recalling core material under pressure',
  CONTROL: 'Staying in French without falling back to English',
  REPAIR: 'Recovering from a misunderstanding',
  TRANSFER: 'Applying material in a new context',
};

export function useFieldTest(fieldTestId: string, pilotModeEnabled: boolean) {
  const definition = useMemo(() => getFieldTestById(fieldTestId), [fieldTestId]);
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<FieldTestStepResponse[]>([]);
  const [result, setResult] = useState<FieldTestResult | null>(null);

  const currentStep = definition?.steps[stepIndex] ?? null;

  const finish = useCallback(
    async (finalResponses: FieldTestStepResponse[]) => {
      if (!definition) return;
      const dimensionResults = scoreFieldTest(definition.steps, finalResponses);
      const progressionJustified = isProgressionJustified(dimensionResults);
      const weak = dimensionResults.filter((d) => d.score <= 1);
      const strong = dimensionResults.filter((d) => d.score >= 2);

      const fieldTestResult: FieldTestResult = {
        fieldTestId,
        completedAt: new Date().toISOString(),
        dimensionResults,
        whatWorked: strong.map((d) => DIMENSION_LOW_MESSAGE[d.dimension] ?? d.dimension),
        whatBroke: weak.map((d) => DIMENSION_LOW_MESSAGE[d.dimension] ?? d.dimension),
        whatNeedsRetrieval: weak.map((d) => d.dimension),
        progressionJustified,
      };

      await saveFieldTestResult(fieldTestResult);
      if (pilotModeEnabled) {
        await recordPilotEvent({
          id: newId('evt'),
          type: 'FIELD_TEST_SCORE',
          timestamp: new Date().toISOString(),
          dayNumber: definition.afterDayNumber,
          detail: {
            fieldTestId,
            progressionJustified,
            averageScore: dimensionResults.reduce((s, d) => s + d.score, 0) / dimensionResults.length,
          },
        });
      }
      setResult(fieldTestResult);
    },
    [definition, fieldTestId, pilotModeEnabled],
  );

  const submitStepAndMaybeFinish = useCallback(
    async (answer: string) => {
      if (!currentStep || !definition) return;
      const nextResponses = [...responses, { stepId: currentStep.id, answer }];
      setResponses(nextResponses);
      if (stepIndex + 1 >= definition.steps.length) {
        await finish(nextResponses);
      } else {
        setStepIndex((i) => i + 1);
      }
    },
    [currentStep, definition, responses, stepIndex, finish],
  );

  return {
    definition,
    currentStep,
    stepIndex,
    result,
    submitStep: submitStepAndMaybeFinish,
  };
}
