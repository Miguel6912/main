import { Pill } from '../../components/Pill';
import { ProgressHUD } from '../../components/ProgressHUD';
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

      <ProgressHUD totalXP={meta.totalXP} currentStreakDays={meta.currentStreakDays} avatarConfig={meta.avatarConfig} />

      <p className="achievements-longest-streak-note">
        Longest streak: <strong>{meta.longestStreakDays}</strong> day{meta.longestStreakDays === 1 ? '' : 's'}
      </p>

      <p className="achievements-count">
        {earnedCount} of {badgeStates.length} badges earned
      </p>

      <ul className="achievements-badge-grid">
        {badgeStates.map(({ badge, earned }) => (
          <li
            key={badge.id}
            className={`achievements-badge ${earned ? 'achievements-badge-earned' : 'achievements-badge-locked'}`}
          >
            <span className={`achievements-badge-icon achievements-badge-icon-${badge.tone}`} aria-hidden="true">
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
