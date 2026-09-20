// Deterministic PRNG (mulberry32) so a seed can reproduce a run.
export function makeRng(seed) {
  let state = seed >>> 0;
  return function rng() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng, min, max) {
  // inclusive of both ends
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function choice(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function chance(rng, probability) {
  return rng() < probability;
}
