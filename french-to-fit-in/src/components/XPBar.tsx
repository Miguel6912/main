import { levelForXP } from '../engine/gamification';
import './XPBar.css';

interface XPBarProps {
  totalXP: number;
  /** Hide the "Level N" text label -- use when paired with a LevelMedallion. */
  hideLevelLabel?: boolean;
}

export function XPBar({ totalXP, hideLevelLabel }: XPBarProps) {
  const info = levelForXP(totalXP);
  const pct = info.xpForThisLevel > 0 ? Math.round((info.xpIntoLevel / info.xpForThisLevel) * 100) : 100;

  return (
    <div className="xp-bar">
      <div className="xp-bar-header">
        {!hideLevelLabel && <span className="xp-bar-level">Level {info.level}</span>}
        <span className="xp-bar-figures">
          {info.xpIntoLevel} / {info.xpForThisLevel} XP
        </span>
      </div>
      <div className="xp-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="xp-bar-fill" style={{ width: `${pct}%` }}>
          <div className="xp-bar-shine" />
        </div>
      </div>
    </div>
  );
}
