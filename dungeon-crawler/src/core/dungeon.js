import { randInt } from './rng.js';

export const TILE = {
  WALL: '#',
  FLOOR: '.',
  STAIRS: '>',
};

export function inBounds(width, height, x, y) {
  return x >= 0 && y >= 0 && x < width && y < height;
}

export function isWall(grid, x, y) {
  const row = grid[y];
  if (!row) return true;
  const t = row[x];
  return t === undefined || t === TILE.WALL;
}

export function isWalkable(grid, x, y) {
  return !isWall(grid, x, y);
}

function rectsOverlap(a, b) {
  return (
    a.x <= b.x + b.w &&
    a.x + a.w >= b.x &&
    a.y <= b.y + b.h &&
    a.y + a.h >= b.y
  );
}

function carveRoom(grid, room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      grid[y][x] = TILE.FLOOR;
    }
  }
}

function carveCorridor(grid, x0, y0, x1, y1, rng) {
  // Random-order L-shaped corridor between two points.
  if (rng() < 0.5) {
    carveHLine(grid, x0, x1, y0);
    carveVLine(grid, y0, y1, x1);
  } else {
    carveVLine(grid, y0, y1, x0);
    carveHLine(grid, x0, x1, y1);
  }
}

function carveHLine(grid, x0, x1, y) {
  const [lo, hi] = x0 < x1 ? [x0, x1] : [x1, x0];
  for (let x = lo; x <= hi; x++) grid[y][x] = TILE.FLOOR;
}

function carveVLine(grid, y0, y1, x) {
  const [lo, hi] = y0 < y1 ? [y0, y1] : [y1, y0];
  for (let y = lo; y <= hi; y++) grid[y][x] = TILE.FLOOR;
}

function roomCenter(room) {
  return {
    x: Math.floor(room.x + room.w / 2),
    y: Math.floor(room.y + room.h / 2),
  };
}

/**
 * Generates a dungeon floor: a grid of rooms joined by corridors, a player
 * start point in the first room, and stairs down in the room farthest from
 * it (so descending always means crossing the floor).
 */
export function generateDungeon({
  width,
  height,
  rng,
  minRooms = 6,
  maxRooms = 10,
  minRoomSize = 4,
  maxRoomSize = 8,
}) {
  const grid = [];
  for (let y = 0; y < height; y++) grid.push(new Array(width).fill(TILE.WALL));

  const targetRooms = randInt(rng, minRooms, maxRooms);
  const rooms = [];
  let attempts = 0;

  while (rooms.length < targetRooms && attempts < targetRooms * 30) {
    attempts++;
    const w = randInt(rng, minRoomSize, maxRoomSize);
    const h = randInt(rng, minRoomSize, maxRoomSize);
    const x = randInt(rng, 1, width - w - 2);
    const y = randInt(rng, 1, height - h - 2);
    const room = { x, y, w, h };
    const padded = { x: x - 1, y: y - 1, w: w + 2, h: h + 2 };
    if (rooms.some((r) => rectsOverlap(padded, r.padded))) continue;
    room.padded = padded;
    rooms.push(room);
  }

  if (rooms.length === 0) {
    // Degenerate case (shouldn't happen with sane sizes): carve one big room.
    const room = { x: 1, y: 1, w: width - 2, h: height - 2 };
    rooms.push(room);
  }

  for (const room of rooms) carveRoom(grid, room);

  for (let i = 1; i < rooms.length; i++) {
    const a = roomCenter(rooms[i - 1]);
    const b = roomCenter(rooms[i]);
    carveCorridor(grid, a.x, a.y, b.x, b.y, rng);
  }

  const start = roomCenter(rooms[0]);

  // Stairs go in whichever room's center is farthest (by straight-line
  // distance) from the start, so each floor requires real traversal.
  let stairsRoom = rooms[0];
  let bestDist = -1;
  for (const room of rooms) {
    const c = roomCenter(room);
    const d = (c.x - start.x) ** 2 + (c.y - start.y) ** 2;
    if (d > bestDist) {
      bestDist = d;
      stairsRoom = room;
    }
  }
  const stairs = roomCenter(stairsRoom);
  grid[stairs.y][stairs.x] = TILE.STAIRS;

  return { grid, width, height, rooms, start, stairs };
}

function bresenhamLine(x0, y0, x1, y1) {
  const points = [];
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  while (true) {
    points.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

/**
 * Simple ray-based field of view: for every tile within radius, walk the
 * line of sight from the origin and stop at (but include) the first wall.
 * Not a perfect shadowcast, but cheap and good enough for a small dungeon.
 */
export function computeFOV(grid, width, height, ox, oy, radius) {
  const visible = new Set();
  visible.add(`${ox},${oy}`);
  const minY = Math.max(0, oy - radius);
  const maxY = Math.min(height - 1, oy + radius);
  const minX = Math.max(0, ox - radius);
  const maxX = Math.min(width - 1, ox + radius);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - ox;
      const dy = y - oy;
      if (dx * dx + dy * dy > radius * radius) continue;
      const line = bresenhamLine(ox, oy, x, y);
      for (const [lx, ly] of line) {
        visible.add(`${lx},${ly}`);
        if (isWall(grid, lx, ly) && !(lx === ox && ly === oy)) break;
      }
    }
  }
  return visible;
}
