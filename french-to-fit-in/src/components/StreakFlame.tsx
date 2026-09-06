import './StreakFlame.css';

interface StreakFlameProps {
  days: number;
}

export function StreakFlame({ days }: StreakFlameProps) {
  const isActive = days > 0;
  return (
    <span className={`streak-flame ${isActive ? 'streak-flame-active' : ''}`} title={`${days}-day streak`}>
      <span aria-hidden="true">🔥</span>
      <span className="streak-flame-count">{days}</span>
      <span className="visually-hidden">{days}-day practice streak</span>
    </span>
  );
}
