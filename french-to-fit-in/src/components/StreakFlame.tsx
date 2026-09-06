import './StreakFlame.css';

interface StreakFlameProps {
  days: number;
  size?: 'md' | 'lg';
}

export function StreakFlame({ days, size = 'md' }: StreakFlameProps) {
  const isActive = days > 0;
  return (
    <span
      className={`streak-flame streak-flame-${size} ${isActive ? 'streak-flame-active' : ''}`}
      title={`${days}-day streak`}
    >
      <span className="streak-flame-emoji" aria-hidden="true">
        🔥
      </span>
      <span className="streak-flame-count">{days}</span>
      <span className="visually-hidden">{days}-day practice streak</span>
    </span>
  );
}
