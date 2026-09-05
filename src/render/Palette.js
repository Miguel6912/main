// All time-of-day and season colour data lives here so the renderer stays
// purely mechanical -- tweaking the mood of dusk or adding a new season
// palette never requires touching drawing code.

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToCss({ r, g, b }, a = 1) {
  return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
}

export function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToCss({
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  });
}

function interpolateKeyframes(hourFrac, keyframes, interpolate) {
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (hourFrac >= a.hour && hourFrac <= b.hour) {
      const t = (hourFrac - a.hour) / (b.hour - a.hour || 1);
      return interpolate(a, b, t);
    }
  }
  return interpolate(keyframes[0], keyframes[0], 0);
}

const SKY_KEYFRAMES = [
  { hour: 0, color: '#0d1230' },
  { hour: 4, color: '#0d1230' },
  { hour: 6, color: '#f2a765' },
  { hour: 7.5, color: '#8fd0f0' },
  { hour: 17, color: '#8fd0f0' },
  { hour: 19, color: '#e08a5f' },
  { hour: 20.5, color: '#141a3d' },
  { hour: 24, color: '#0d1230' },
];

export function getSkyColor(hourFrac) {
  return interpolateKeyframes(hourFrac, SKY_KEYFRAMES, (a, b, t) => lerpColor(a.color, b.color, t));
}

const NIGHT_OVERLAY_KEYFRAMES = [
  { hour: 0, a: 0.6 },
  { hour: 4, a: 0.6 },
  { hour: 6, a: 0.25 },
  { hour: 7.5, a: 0 },
  { hour: 17, a: 0 },
  { hour: 19, a: 0.2 },
  { hour: 20.5, a: 0.6 },
  { hour: 24, a: 0.6 },
];

export function getNightOverlayAlpha(hourFrac) {
  return interpolateKeyframes(hourFrac, NIGHT_OVERLAY_KEYFRAMES, (a, b, t) => a.a + (b.a - a.a) * t);
}

export const SEASON_PALETTE = {
  spring: { grass: '#a8d17c', grassShade: '#8fc167', accent: '#f6c6db', water: '#7ec7d6' },
  summer: { grass: '#6fb454', grassShade: '#5a9c42', accent: '#f7e17d', water: '#4fb3c9' },
  autumn: { grass: '#c99a4a', grassShade: '#b3823a', accent: '#e0672f', water: '#4a93a8' },
  winter: { grass: '#eef3f6', grassShade: '#d9e3ea', accent: '#ffffff', water: '#7fa8bd' },
};

export const FOLIAGE_PALETTE = {
  spring: ['#9fd17a', '#b8e08f', '#f2b6d0'],
  summer: ['#4f9a3d', '#5fae4a', '#3f8530'],
  autumn: ['#d97b2e', '#e0a13a', '#b5451f'],
  winter: ['#e8eef2', '#cfd9e0', '#8a9aa5'],
};
