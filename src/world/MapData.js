// All world geometry lives here as plain data. Adding a building, hotspot,
// or forage spot means adding an entry to one of these lists -- the
// renderer, collision, and interaction systems all read from this file
// rather than hard-coding positions.

export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1000;

export const PLAYER_SPAWN = { x: 950, y: 700 };

// Broad backdrop regions used for palette/art decisions (which side of the
// world we're drawing "castle" art vs "forest" art vs open village).
export const ZONES = {
  castle: { x: 0, y: 0, w: 300, h: WORLD_HEIGHT },
  village: { x: 300, y: 0, w: 1200, h: WORLD_HEIGHT },
  forest: { x: 1500, y: 0, w: 300, h: WORLD_HEIGHT },
};

// Solid obstacles the player (and NPC schedule paths) cannot walk through.
export const OBSTACLES = [
  { x: 40, y: 260, w: 260, h: 340, label: 'castle-keep' },
  { x: 600, y: 380, w: 120, h: 90, label: 'bakery' },
  { x: 1000, y: 390, w: 140, h: 100, label: 'inn' },
  { x: 775, y: 585, w: 110, h: 85, label: 'store' },
  { x: 300, y: 450, w: 100, h: 80, label: 'watchpost' },
  { x: 1400, y: 530, w: 90, h: 80, label: 'cobbs-hut' },
  { x: 1130, y: 0, w: 40, h: 460, label: 'river-north' },
  { x: 1130, y: 560, w: 40, h: 440, label: 'river-south' },
  { x: 1760, y: 0, w: 40, h: WORLD_HEIGHT, label: 'deep-forest-edge' },
];

// Buildings drawn with a bit of extra art metadata (roof colour etc.).
export const BUILDINGS = [
  { id: 'bakery', x: 600, y: 380, w: 120, h: 90, roof: '#c1503f', wall: '#f2d9b8', doorX: 660, doorY: 470, label: "Mira's Bakery" },
  { id: 'inn', x: 1000, y: 390, w: 140, h: 100, roof: '#5b7a55', wall: '#e8c99b', doorX: 1060, doorY: 490, label: 'The Goodbarrel Inn' },
  { id: 'store', x: 775, y: 585, w: 110, h: 85, roof: '#8a5fae', wall: '#efe2c8', doorX: 830, doorY: 670, label: "Bramble's General Store" },
  { id: 'watchpost', x: 300, y: 450, w: 100, h: 80, roof: '#6b7280', wall: '#d8ccb8', doorX: 350, doorY: 530, label: 'Village Watchpost' },
  { id: 'cobbs-hut', x: 1400, y: 530, w: 90, h: 80, roof: '#4b5d3a', wall: '#cbb995', doorX: 1445, doorY: 610, label: "Old Cobb's Hut" },
];

// River path, drawn as a ribbon; bridge sits in the gap between the two
// river obstacle segments (y 460-560).
export const RIVER = { x: 1130, y: 0, w: 40, h: WORLD_HEIGHT, bridgeY: 460, bridgeH: 100 };

// Interactive points that are not NPCs -- shops, quest boards, forage spots.
export const HOTSPOTS = [
  { id: 'property', x: 760, y: 520, radius: 50, label: 'Empty Plot', prompt: 'Look at the plot' },
  { id: 'jobboard', x: 1000, y: 505, radius: 50, label: 'Notice Board', prompt: 'Read the notice board' },
  { id: 'well', x: 900, y: 520, radius: 45, label: 'The Old Well', prompt: 'Make a wish' },
];

export const FORAGE_SPOTS = [
  { id: 'forage_berry', x: 1560, y: 250, radius: 45, item: 'wild_berries', label: 'Berry Bramble' },
  { id: 'forage_mushroom', x: 1620, y: 480, radius: 45, item: 'moon_mushroom', label: 'Mossy Log' },
  { id: 'forage_herb', x: 1540, y: 700, radius: 45, item: 'silverleaf_herb', label: 'Herb Patch' },
  { id: 'forage_root', x: 1680, y: 600, radius: 45, item: 'honey_root', label: 'Root Hollow' },
];

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
