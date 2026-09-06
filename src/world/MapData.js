// All world geometry lives here as plain data. Adding a building, hotspot,
// or forage spot means adding an entry to one of these lists -- the
// renderer, collision, and interaction systems all read from this file
// rather than hard-coding positions.

import { RNG } from '../core/RNG.js';

export const WORLD_WIDTH = 2200;
export const WORLD_HEIGHT = 2980;

export const PLAYER_SPAWN = { x: 950, y: 700 };

// Broad backdrop regions used for palette/art decisions (which side of the
// world we're drawing "castle" art vs "forest" art vs open village).
export const ZONES = {
  castle: { x: 0, y: 0, w: 300, h: WORLD_HEIGHT },
  village: { x: 300, y: 0, w: 1200, h: WORLD_HEIGHT },
  forest: { x: 1500, y: 0, w: WORLD_WIDTH - 1500, h: WORLD_HEIGHT },
  orchard: { x: 450, y: 1100, w: 550, h: 500 },
  lake: { x: 1300, y: 1300, w: 420, h: 320 },
  neighborhood: { x: 100, y: 1980, w: 2000, h: 920 },
};

// "Cottage Row": a procedurally-laid-out neighborhood of small homes south
// of the orchard, generated once from a fixed seed (so it's stable across
// reloads) rather than hand-placed -- this is what makes housing 100+
// villagers tractable. Each entry is one house: a door position (used as
// an NPC's home in data/villagers.js) plus a colour variant for the
// lightweight cottage renderer (Renderer._drawCottage).
function generateNeighborhood() {
  const rng = new RNG(555);
  const zone = { x: 100, y: 1980, w: 2000, h: 920 };
  const cell = 118;
  const cols = Math.floor(zone.w / cell);
  const rows = Math.floor(zone.h / cell);
  const houses = [];
  let n = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (rng.chance(0.03)) continue; // leave gaps for little greens/paths
      const jitterX = rng.range(-14, 14);
      const jitterY = rng.range(-14, 14);
      const cx = zone.x + col * cell + cell / 2 + jitterX;
      const cy = zone.y + row * cell + cell / 2 + jitterY;
      houses.push({
        id: `house_${n++}`,
        x: cx - 24,
        y: cy - 22,
        w: 48,
        h: 40,
        doorX: cx,
        doorY: cy + 18,
        variant: rng.int(0, 5),
      });
    }
  }
  return houses;
}

export const NEIGHBORHOOD_HOUSES = generateNeighborhood();

// The river runs from the northern edge down to roughly where the lake
// begins, rather than the full world height -- it reads as feeding the
// lake, and (importantly) means it doesn't cut Cottage Row in half with
// no second bridge to cross it.
export const RIVER_END_Y = 1300;

// Solid obstacles the player (and NPC schedule paths) cannot walk through.
export const OBSTACLES = [
  { x: 40, y: 260, w: 260, h: 340, label: 'castle-keep' },
  { x: 600, y: 380, w: 120, h: 90, label: 'bakery' },
  { x: 1000, y: 390, w: 140, h: 100, label: 'inn' },
  { x: 775, y: 585, w: 110, h: 85, label: 'store' },
  { x: 300, y: 450, w: 100, h: 80, label: 'watchpost' },
  { x: 1400, y: 530, w: 90, h: 80, label: 'cobbs-hut' },
  { x: 1130, y: 0, w: 40, h: 460, label: 'river-north' },
  { x: 1130, y: 560, w: 40, h: RIVER_END_Y - 560, label: 'river-south' },
  { x: WORLD_WIDTH - 40, y: 0, w: 40, h: WORLD_HEIGHT, label: 'deep-forest-edge' },
  { x: 1300, y: 1300, w: 420, h: 320, label: 'lake' },
  ...NEIGHBORHOOD_HOUSES.map((h) => ({ x: h.x, y: h.y, w: h.w, h: h.h, label: h.id })),
];

// Buildings drawn with a bit of extra art metadata. `thatch`/`stone` give
// each roof/wall a slightly different earthy tone (rustic, not painted);
// `accent` is the one saturated colour per building (shutters, door trim)
// that keeps them tellable apart at a glance despite the shared material
// palette -- it carries the building's old, more storybook-flat colour.
export const BUILDINGS = [
  { id: 'bakery', x: 600, y: 380, w: 120, h: 90, thatch: '#c9a35a', stone: '#b9ad98', accent: '#c1503f', doorX: 660, doorY: 470, label: "Mira's Bakery" },
  { id: 'inn', x: 1000, y: 390, w: 140, h: 100, thatch: '#b8945a', stone: '#a9a293', accent: '#5b7a55', doorX: 1060, doorY: 490, label: 'The Goodbarrel Inn' },
  { id: 'store', x: 775, y: 585, w: 110, h: 85, thatch: '#d4b06a', stone: '#c2b6a0', accent: '#8a5fae', doorX: 830, doorY: 670, label: "Bramble's General Store" },
  { id: 'watchpost', x: 300, y: 450, w: 100, h: 80, thatch: '#a68352', stone: '#9c9686', accent: '#6b7280', doorX: 350, doorY: 530, label: 'Village Watchpost' },
  { id: 'cobbs-hut', x: 1400, y: 530, w: 90, h: 80, thatch: '#8a6f42', stone: '#8f8a76', accent: '#4b5d3a', doorX: 1445, doorY: 610, label: "Old Cobb's Hut" },
];

// River path, drawn as a ribbon; bridge sits in the gap between the two
// river obstacle segments (y 460-560).
export const RIVER = { x: 1130, y: 0, w: 40, h: RIVER_END_Y, bridgeY: 460, bridgeH: 100 };

// Decorative fence runs (purely visual, not obstacles -- consistent with
// how decorative trees already work). Each is a straight line; the
// renderer spaces posts + rails evenly along it.
export const FENCES = [
  { x1: 718, y1: 494, x2: 800, y2: 494 },
  { x1: 718, y1: 494, x2: 718, y2: 550 },
  { x1: 800, y1: 494, x2: 800, y2: 550 },
  { x1: 718, y1: 550, x2: 760, y2: 550 },
  { x1: 780, y1: 550, x2: 800, y2: 550 },
];

// Small decorative clutter near building fronts -- purely cosmetic, placed
// at each building's doorway with a fixed offset so they read as "sitting
// by the door" rather than floating in the open field.
export const PROPS = [
  { type: 'flowerpot', x: 634, y: 474 }, // bakery
  { type: 'flowerpot', x: 1034, y: 494 }, // inn
  { type: 'flowerpot', x: 1419, y: 614 }, // cobb's hut
  { type: 'barrel', x: 804, y: 676 }, // store
  { type: 'barrel', x: 818, y: 684 }, // store
];

// Interactive points that are not NPCs -- shops, quest boards, forage spots.
export const HOTSPOTS = [
  { id: 'property', x: 760, y: 520, radius: 50, label: 'Empty Plot', prompt: 'Look at the plot' },
  { id: 'jobboard', x: 1000, y: 505, radius: 50, label: 'Notice Board', prompt: 'Read the notice board' },
  { id: 'well', x: 900, y: 520, radius: 45, label: 'The Old Well', prompt: 'Make a wish' },
  { id: 'cider_press', x: 900, y: 1500, radius: 55, label: 'Cider Press', prompt: 'Use the cider press' },
];

export const FORAGE_SPOTS = [
  { id: 'forage_berry', x: 1560, y: 250, radius: 45, item: 'wild_berries', label: 'Berry Bramble' },
  { id: 'forage_mushroom', x: 1620, y: 480, radius: 45, item: 'moon_mushroom', label: 'Mossy Log' },
  { id: 'forage_herb', x: 1540, y: 700, radius: 45, item: 'silverleaf_herb', label: 'Herb Patch' },
  { id: 'forage_root', x: 1680, y: 600, radius: 45, item: 'honey_root', label: 'Root Hollow' },
  { id: 'forage_deep_mushroom', x: 1980, y: 350, radius: 45, item: 'moon_mushroom', label: 'Shadowed Log' },
  { id: 'forage_deep_herb', x: 2020, y: 820, radius: 45, item: 'silverleaf_herb', label: 'Deep Herb Patch' },
  { id: 'forage_apple1', x: 600, y: 1230, radius: 45, item: 'apple', label: 'Apple Tree' },
  { id: 'forage_apple2', x: 800, y: 1340, radius: 45, item: 'apple', label: 'Apple Tree' },
  { id: 'forage_apple3', x: 640, y: 1460, radius: 45, item: 'apple', label: 'Apple Tree' },
];

// The southern orchard district: a belt of apple trees around the forage
// spots above, purely decorative dressing (see Renderer._drawOrchard).
export const ORCHARD = { x: 450, y: 1100, w: 550, h: 500 };

// A still lake south-east of the village -- scenic for Phase 1 (a natural
// spot for a future fishing activity), collision handled by the 'lake'
// entry in OBSTACLES above.
export const LAKE = { x: 1300, y: 1300, w: 420, h: 320 };

export function clampToWorld(x, y, margin = 20) {
  return {
    x: Math.max(margin, Math.min(WORLD_WIDTH - margin, x)),
    y: Math.max(margin, Math.min(WORLD_HEIGHT - margin, y)),
  };
}

export function circleIntersectsRect(cx, cy, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

// Resolve a proposed circular move against all obstacles, sliding along
// walls (checked per-axis) rather than stopping dead.
//
// Obstacles the player is *already* overlapping at the start of this move
// are excluded from that axis's blocking check. Without this, a player who
// ends up grazing a corner (by even a fraction of a pixel, e.g. a tight
// spawn point or a slide along a wall) would have every subsequent move
// recomputed from the same frozen position and rejected identically
// forever -- a permanent stuck-in-the-wall softlock. Ignoring obstacles
// already being overlapped lets the player slide back out naturally.
export function resolveCollision(x, y, nx, ny, radius) {
  const blockersX = OBSTACLES.filter((o) => !circleIntersectsRect(x, y, radius, o));
  let resultX = x;
  if (!blockersX.some((o) => circleIntersectsRect(nx, y, radius, o))) {
    resultX = nx;
  }

  const blockersY = OBSTACLES.filter((o) => !circleIntersectsRect(resultX, y, radius, o));
  let resultY = y;
  if (!blockersY.some((o) => circleIntersectsRect(resultX, ny, radius, o))) {
    resultY = ny;
  }
  return clampToWorld(resultX, resultY, radius);
}
