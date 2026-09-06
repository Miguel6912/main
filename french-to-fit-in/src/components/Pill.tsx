import type { HTMLAttributes } from 'react';
import './Pill.css';

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'accent' | 'sage' | 'gold' | 'rose';
}

export function Pill({ tone = 'neutral', className = '', ...rest }: PillProps) {
  return <span className={`pill pill-${tone} ${className}`} {...rest} />;
}
