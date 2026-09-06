import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { StreakFlame } from '../../components/StreakFlame';
import type { DayDefinition, GamificationOutcome, SessionState } from '../../types';
import './SessionCompleteScreen.css';

interface SessionCompleteScreenProps {
  day: DayDefinition;
  state: SessionState;
  gamificationOutcome: GamificationOutcome | null;
}

/**
 * The "big moment" (confetti, chime) happens in CelebrationOverlay right
 * before this renders -- this screen is the persistent recap left behind
 * once that's dismissed, so the reward stays visible, not just flashed.
 */
export function SessionCompleteScreen({ day, state, gamificationOutcome }: SessionCompleteScreenProps) {
  return (
    <Card className="session-complete-card">
      <h2>Session complete</h2>
      <p className="session-complete-title">Day {day.dayNumber} &middot; {day.title}</p>
      <p>{day.learningOutcome}</p>
      <p className="session-complete-stat">
        {state.completedExerciseIds.length} exercises completed &middot; {state.retrievalResponses.length} items retrieved
      </p>

      {gamificationOutcome && (
        <div className="session-complete-gamification">
          <div className="session-complete-xp-row">
            <Pill tone="gold">+{gamificationOutcome.xpEarned} XP</Pill>
            <StreakFlame days={gamificationOutcome.streak.currentStreakDays} />
          </div>

          {gamificationOutcome.leveledUp && (
            <p className="session-complete-level-up">
              Level up! You're now level {gamificationOutcome.levelAfter}.
            </p>
          )}

          {gamificationOutcome.newlyEarnedBadges.length > 0 && (
            <div className="session-complete-badges">
              {gamificationOutcome.newlyEarnedBadges.map((badge) => (
                <div key={badge.id} className={`session-complete-badge session-complete-badge-${badge.tone}`}>
                  <span aria-hidden="true">{badge.icon}</span>
                  <span>{badge.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </Card>
  );
}
