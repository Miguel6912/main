import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { XPBar } from '../../components/XPBar';
import { StreakFlame } from '../../components/StreakFlame';
import { useAppMeta } from '../hooks/useAppMeta';
import { allBadgesWithEarnedState } from '../../features/gamification/gamificationService';
import './AchievementsPage.css';

export function AchievementsPage() {
  const { meta } = useAppMeta();
  if (!meta) return null;

  const badgeStates = allBadgesWithEarnedState(meta.earnedBadgeIds);
  const earnedCount = badgeStates.filter((b) => b.earned).length;

  return (
    <div className="achievements-page">
      <h1>Achievements</h1>

      <Card className="achievements-summary-card">
        <XPBar totalXP={meta.totalXP} />
        <div className="achievements-streak-row">
          <div>
            <StreakFlame days={meta.currentStreakDays} />
            <p className="achievements-streak-label">Current streak</p>
          </div>
          <div>
            <span className="achievements-longest-streak">{meta.longestStreakDays}</span>
            <p className="achievements-streak-label">Longest streak</p>
          </div>
        </div>
      </Card>

      <p className="achievements-count">
        {earnedCount} of {badgeStates.length} badges earned
      </p>

      <ul className="achievements-badge-grid">
        {badgeStates.map(({ badge, earned }) => (
          <li key={badge.id} className={`achievements-badge ${earned ? 'achievements-badge-earned' : 'achievements-badge-locked'}`}>
            <span className="achievements-badge-icon" aria-hidden="true">
              {badge.icon}
            </span>
            <span className="achievements-badge-title">{badge.title}</span>
            <span className="achievements-badge-description">{badge.description}</span>
            {!earned && <Pill tone="neutral">Locked</Pill>}
          </li>
        ))}
      </ul>
    </div>
  );
}
