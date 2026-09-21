import { randInt, choice, chance } from './rng.js';
import { pickEnemyType, createEnemy } from './entities.js';
import { randomWeaponDrop, randomArmorDrop } from './items.js';

export const GROUND_Y = 460;
export const BIOMES = ['forest', 'graveyard', 'castle'];

export function biomeForLevel(levelIndex) {
  return BIOMES[levelIndex % BIOMES.length];
}

export function tierForLevel(levelIndex) {
  return Math.floor(levelIndex / BIOMES.length) + 1;
}

export function groundSurfaceAt(segments, x) {
  for (const seg of segments) {
    if (x >= seg.x0 && x <= seg.x1) return GROUND_Y;
  }
  return null;
}

const FOREGROUND_DECOR = {
  forest: ['tree', 'bush', 'rock'],
  graveyard: ['gravestone', 'deadtree', 'crypt'],
  castle: ['pillar', 'banner', 'rubble'],
};

function buildGround(rng, levelWidth) {
  const segments = [];
  const firstWidth = 460;
  segments.push({ x0: 0, x1: firstWidth });
  let x = firstWidth;

  while (x < levelWidth - 500) {
    const gap = chance(rng, 0.55) ? randInt(rng, 60, 110) : 0;
    const x0 = x + gap;
    const x1 = Math.min(levelWidth, x0 + randInt(rng, 180, 420));
    segments.push({ x0, x1 });
    x = x1;
  }

  const gap = chance(rng, 0.4) ? randInt(rng, 60, 100) : 0;
  const finalStart = Math.min(x + gap, levelWidth - 200);
  segments.push({ x0: finalStart, x1: levelWidth });
  return segments;
}

function buildPlatforms(rng, levelWidth) {
  const count = Math.round(levelWidth / 550);
  const platforms = [];
  for (let i = 0; i < count; i++) {
    const width = randInt(rng, 80, 160);
    const x0 = randInt(rng, 380, Math.max(400, levelWidth - 300 - width));
    // Capped comfortably under the ~213px double-jump ceiling (two ~107px
    // arcs at JUMP_VELOCITY/GRAVITY from game.js) so every platform is
    // reachable even without frame-perfect double-jump timing.
    const height = randInt(rng, 70, 170);
    platforms.push({ x0, x1: x0 + width, y: GROUND_Y - height });
  }
  return platforms;
}

// How far a hazard must stay from the forge's x -- wide enough to clear
// both its visual footprint (the house/anvil/dwarf art) and the interact
// range in core/game.js, so a spike patch can never end up hidden behind
// the forge sprite while still being live (the bug: dying "at the
// blacksmith" with the actual spikes invisible underneath the building).
const HAZARD_FORGE_CLEARANCE = 110;

function buildHazards(rng, segments, avoidX) {
  const hazards = [];
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.x1 - seg.x0 < 220) continue;
    if (!chance(rng, 0.15)) continue;
    const width = randInt(rng, 36, 64);
    const x0 = randInt(rng, seg.x0 + 40, seg.x1 - width - 40);
    const x1 = x0 + width;
    if (avoidX !== null && x1 > avoidX - HAZARD_FORGE_CLEARANCE && x0 < avoidX + HAZARD_FORGE_CLEARANCE) continue;
    hazards.push({ x0, x1, y: GROUND_Y });
  }
  return hazards;
}

function placeForge(segments, levelWidth) {
  const midLo = levelWidth * 0.35;
  const midHi = levelWidth * 0.65;
  let forgeSeg = segments.find((s) => s.x1 - s.x0 >= 220 && s.x0 >= midLo && s.x0 <= midHi);
  if (!forgeSeg) forgeSeg = segments.reduce((best, s) => (s.x1 - s.x0 > (best ? best.x1 - best.x0 : -1) ? s : best), null);
  return forgeSeg ? { x: (forgeSeg.x0 + forgeSeg.x1) / 2, y: GROUND_Y } : null;
}

function buildDecorations(rng, biome, segments, levelWidth) {
  const foreground = [];
  const palette = FOREGROUND_DECOR[biome];
  for (const seg of segments) {
    let x = seg.x0 + randInt(rng, 40, 100);
    while (x < seg.x1 - 30) {
      foreground.push({ x, y: GROUND_Y, type: choice(rng, palette), flip: chance(rng, 0.5), scale: 0.65 + rng() * 0.55 });
      x += randInt(rng, 140, 240);
    }
  }

  const background = [];
  let bx = 0;
  while (bx < levelWidth) {
    background.push({ x: bx, type: choice(rng, palette), scale: 0.6 + rng() * 0.5 });
    bx += randInt(rng, 120, 220);
  }

  return { foreground, background };
}

function zoneList(segments, platforms) {
  const zones = [];
  for (let i = 1; i < segments.length; i++) {
    zones.push({ x0: segments[i].x0, x1: segments[i].x1, y: GROUND_Y, kind: 'ground' });
  }
  for (const p of platforms) {
    zones.push({ x0: p.x0, x1: p.x1, y: p.y, kind: 'platform' });
  }
  return zones;
}

function randomXInZone(rng, zone, margin = 20) {
  const lo = zone.x0 + margin;
  const hi = Math.max(lo, zone.x1 - margin);
  return randInt(rng, Math.round(lo), Math.round(hi));
}

export function generateLevel(levelIndex, rng) {
  const biome = biomeForLevel(levelIndex);
  const tier = tierForLevel(levelIndex);
  const levelWidth = Math.min(6400, 3200 + levelIndex * 120);

  const segments = buildGround(rng, levelWidth);
  const forge = placeForge(segments, levelWidth);
  const platforms = buildPlatforms(rng, levelWidth);
  const hazards = buildHazards(rng, segments, forge ? forge.x : null);
  const decor = buildDecorations(rng, biome, segments, levelWidth);
  const zones = zoneList(segments, platforms);

  const enemies = [];
  if (zones.length > 0) {
    const enemyCount = Math.min(16, 4 + Math.floor(levelIndex * 1.5));
    const MIN_SPACING = 110;
    for (let i = 0; i < enemyCount; i++) {
      const zone = choice(rng, zones);
      let x = randomXInZone(rng, zone, 30);
      for (let attempt = 0; attempt < 5; attempt++) {
        const tooClose = enemies.some((e) => Math.abs(e.x - x) < MIN_SPACING);
        if (!tooClose) break;
        x = randomXInZone(rng, zone, 30);
      }
      const type = pickEnemyType(biome, rng);
      enemies.push(createEnemy(type, x, zone.y, zone.x0, zone.x1, tier, rng));
    }
  }

  const pickups = [];
  if (zones.length > 0) {
    const goldCount = Math.round(levelWidth / 300);
    for (let i = 0; i < goldCount; i++) {
      const zone = choice(rng, zones);
      pickups.push({ x: randomXInZone(rng, zone), y: zone.y, kind: 'gold', amount: randInt(rng, 3 + tier, 8 + tier * 2) });
    }
    const scrapCount = Math.round(levelWidth / 450);
    for (let i = 0; i < scrapCount; i++) {
      const zone = choice(rng, zones);
      pickups.push({ x: randomXInZone(rng, zone), y: zone.y, kind: 'scrap', amount: randInt(rng, 2, 5) });
    }
    const potionCount = randInt(rng, 2, 3);
    for (let i = 0; i < potionCount; i++) {
      const zone = choice(rng, zones);
      pickups.push({ x: randomXInZone(rng, zone), y: zone.y, kind: 'potion', amount: 15 });
    }
    const gearCount = randInt(rng, 1, 2);
    for (let i = 0; i < gearCount; i++) {
      const zone = choice(rng, zones);
      const isWeapon = chance(rng, 0.5);
      const item = isWeapon ? randomWeaponDrop(rng, tier) : randomArmorDrop(rng, tier);
      pickups.push({ x: randomXInZone(rng, zone), y: zone.y, kind: isWeapon ? 'weapon' : 'armor', item });
    }
  }

  return {
    biome,
    tier,
    levelIndex,
    width: levelWidth,
    segments,
    platforms,
    hazards,
    decor,
    enemies,
    pickups,
    forge,
    gateX: levelWidth - 50,
    start: { x: 60, y: GROUND_Y },
  };
}
