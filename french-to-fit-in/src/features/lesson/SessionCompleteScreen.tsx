import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import type { DayDefinition, SessionState } from '../../types';
import './SessionCompleteScreen.css';

interface SessionCompleteScreenProps {
  day: DayDefinition;
  state: SessionState;
}

export function SessionCompleteScreen({ day, state }: SessionCompleteScreenProps) {
  return (
    <Card className="session-complete-card">
      <h2>Session complete</h2>
      <p className="session-complete-title">Day {day.dayNumber} &middot; {day.title}</p>
      <p>{day.learningOutcome}</p>
      <p className="session-complete-stat">
        {state.completedExerciseIds.length} exercises completed &middot; {state.retrievalResponses.length} items retrieved
      </p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </Card>
  );
}
