import { useEffect } from 'react';
import { Button } from './Button';
import { Confetti } from './Confetti';
import { LevelMedallion } from './LevelMedallion';
import { StreakFlame } from './StreakFlame';
import { playCelebrationChime } from '../utils/sound';
import type { GamificationOutcome } from '../types/gamification';
import './CelebrationOverlay.css';

interface CelebrationOverlayProps {
  outcome: GamificationOutcome;
  onContinue: () => void;
}

/**
 * Full-screen celebration moment shown right after a session or field test
 * completes -- this is the "unmissable" version of the gamification layer.
 * Reserves confetti + the celebration chime for genuine milestones
 * (level-up / new badge); a plain completion still gets a clear XP recap.
 */
export function CelebrationOverlay({ outcome, onContinue }: CelebrationOverlayProps) {
  const hasBadges = outcome.newlyEarnedBadges.length > 0;
  const isMilestone = outcome.leveledUp || hasBadges;

  useEffect(() => {
    if (isMilestone) {
      playCelebrationChime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="celebration-overlay" role="dialog" aria-modal="true" aria-label="Session results">
      <Confetti burstKey={isMilestone ? 1 : 0} />
      <div className="celebration-card">
        {hasBadges ? (
          <>
            <p className="celebration-eyebrow">New badge{outcome.newlyEarnedBadges.length > 1 ? 's' : ''} unlocked!</p>
            <div className="celebration-badge-row">
              {outcome.newlyEarnedBadges.map((badge) => (
                <div key={badge.id} className={`celebration-badge celebration-badge-${badge.tone}`}>
                  <span aria-hidden="true">{badge.icon}</span>
                  <span className="celebration-badge-title">{badge.title}</span>
                </div>
              ))}
            </div>
          </>
        ) : outcome.leveledUp ? (
          <>
            <p className="celebration-eyebrow">Level up!</p>
            <LevelMedallion level={outcome.levelAfter} size="lg" />
          </>
        ) : (
          <p className="celebration-eyebrow">Nice work!</p>
        )}

        <div className="celebration-xp">+{outcome.xpEarned} XP</div>

        {outcome.streakExtended && (
          <div className="celebration-streak">
            <StreakFlame days={outcome.streak.currentStreakDays} size="lg" />
            <span>day streak</span>
          </div>
        )}

        <Button onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
}
