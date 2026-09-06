import { Link } from 'react-router-dom';
import { Card } from './Card';
import { LevelMedallion } from './LevelMedallion';
import { XPBar } from './XPBar';
import { StreakFlame } from './StreakFlame';
import { levelForXP } from '../engine/gamification';
import './ProgressHUD.css';

interface ProgressHUDProps {
  totalXP: number;
  currentStreakDays: number;
  showAchievementsLink?: boolean;
}

export function ProgressHUD({ totalXP, currentStreakDays, showAchievementsLink }: ProgressHUDProps) {
  return (
    <Card className="progress-hud">
      <LevelMedallion level={levelForXP(totalXP).level} size="lg" />
      <div className="progress-hud-main">
        <XPBar totalXP={totalXP} hideLevelLabel />
        <div className="progress-hud-footer">
          <StreakFlame days={currentStreakDays} size="md" />
          {showAchievementsLink && (
            <Link to="/achievements" className="progress-hud-link">
              Achievements &rarr;
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
