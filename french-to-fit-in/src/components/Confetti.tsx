import { useEffect, useMemo, useState } from 'react';
import './Confetti.css';

const COLORS = ['var(--accent)', 'var(--terracotta)', 'var(--gold)', 'var(--sage)', 'var(--rose)'];
const PIECE_COUNT = 60;

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  drift: number;
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.6 + Math.random() * 1.2,
    color: COLORS[id % COLORS.length],
    rotate: Math.random() * 360,
    drift: (Math.random() - 0.5) * 120,
  }));
}

/**
 * Celebratory confetti burst. Re-fires whenever `burstKey` changes.
 * Respects prefers-reduced-motion: skips the particle animation entirely
 * (the celebration copy around it still conveys the win).
 */
export function Confetti({ burstKey }: { burstKey: number }) {
  const [active, setActive] = useState(false);
  const pieces = useMemo(() => makePieces(), [burstKey]);
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    if (burstKey <= 0 || reducedMotion) return;
    setActive(true);
    const timeout = setTimeout(() => setActive(false), 3000);
    return () => clearTimeout(timeout);
  }, [burstKey, reducedMotion]);

  if (!active) return null;

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.color,
            // @ts-expect-error custom property for the keyframe
            '--rotate': `${p.rotate}deg`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
