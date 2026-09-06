import type { ReactNode } from 'react';

/**
 * Fixed warm-black ink used for every avatar outline/line-art stroke,
 * independent of the app's light/dark theme -- illustration linework reads
 * as a drawn character, not UI chrome, so it shouldn't invert like the rest
 * of the app does.
 */
export const OUTLINE = '#241a12';
/** Silhouette-scale stroke: face, hair mass, animal bodies. */
export const OUTLINE_WIDTH = 3.5;
/** Accessory-scale stroke: ears, facial hair, glasses, headwear details. */
export const OUTLINE_THIN = 2;
/**
 * Warm amber rim-light used in place of a black outline on hair only --
 * the signature two-tone linework of the flat-portrait style (dark hair
 * fill, bright colored edge instead of ink) rather than a shading trick.
 */
export const RIM = '#e0a04a';

export function darken(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) - amount);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function lighten(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  const r = Math.min(255, parseInt(n.slice(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(n.slice(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(n.slice(4, 6), 16) + amount);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * A colored line with its own ink outline behind it -- a wider OUTLINE-color
 * stroke, then the real color on top, both following the same path. This is
 * the cheap way to get "outlined linework" (eyebrows, mouth lines, whiskers)
 * out of plain SVG strokes instead of a flat single-color line.
 */
export function inkStroke(d: string, color: string, width: number): ReactNode {
  return (
    <>
      <path d={d} stroke={OUTLINE} strokeWidth={width + 2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}
