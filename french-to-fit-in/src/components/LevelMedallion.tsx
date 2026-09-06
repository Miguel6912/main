import './LevelMedallion.css';

interface LevelMedallionProps {
  level: number;
  size?: 'md' | 'lg';
}

export function LevelMedallion({ level, size = 'md' }: LevelMedallionProps) {
  return (
    <div className={`level-medallion level-medallion-${size}`}>
      <div className="level-medallion-inner">
        <span className="level-medallion-number">{level}</span>
        <span className="level-medallion-label">Level</span>
      </div>
    </div>
  );
}
