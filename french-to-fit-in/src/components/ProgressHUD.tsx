import { Link } from 'react-router-dom';
import { Card } from './Card';
import { LevelMedallion } from './LevelMedallion';
import { AvatarSvg } from './avatar/AvatarSvg';
import { XPBar } from './XPBar';
import { StreakFlame } from './StreakFlame';
import { levelForXP } from '../engine/gamification';
import type { AvatarConfig } from '../types/avatar';
import './ProgressHUD.css';

interface ProgressHUDProps {
  totalXP: number;
  currentStreakDays: number;
  avatarConfig?: AvatarConfig;
  showAchievementsLink?: boolean;
}

export function ProgressHUD({ totalXP, currentStreakDays, avatarConfig, showAchievementsLink }: ProgressHUDProps) {
  const level = levelForXP(totalXP).level;

  return (
    <Card className="progress-hud">
      {avatarConfig ? (
        <Link to="/avatar" className="progress-hud-avatar-link" aria-label="Edit your avatar">
          <AvatarSvg config={avatarConfig} size={72} title="Your avatar" />
          <span className="progress-hud-avatar-level">{level}</span>
        </Link>
      ) : (
        <LevelMedallion level={level} size="lg" />
      )}
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
