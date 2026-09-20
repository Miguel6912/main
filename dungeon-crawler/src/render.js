import { TILE } from './core/dungeon.js';

export const TILE_SIZE = 18;

const WALL_LIT = '#5a5a72';
const WALL_DIM = '#2a2a38';
const FLOOR_LIT = '#7d7d94';
const FLOOR_DIM = '#3a3a4a';
const STAIRS_LIT = '#ffd76a';
const STAIRS_DIM = '#7a6a3a';
const BG = '#111017';

function key(x, y) {
  return `${x},${y}`;
}

function drawGlyph(ctx, glyph, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillText(glyph, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2 + 1);
}

export function renderGame(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { dungeon, visible, discovered, monsters, items, player } = state;
  const w = dungeon.width * TILE_SIZE;
  const h = dungeon.height * TILE_SIZE;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  ctx.font = `${TILE_SIZE - 2}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      const k = key(x, y);
      if (!discovered.has(k)) continue;
      const lit = visible.has(k);
      const tile = dungeon.grid[y][x];
      if (tile === TILE.WALL) {
        drawGlyph(ctx, '#', x, y, lit ? WALL_LIT : WALL_DIM);
      } else if (tile === TILE.STAIRS) {
        drawGlyph(ctx, '>', x, y, lit ? STAIRS_LIT : STAIRS_DIM);
      } else {
        drawGlyph(ctx, '.', x, y, lit ? FLOOR_LIT : FLOOR_DIM);
      }
    }
  }

  for (const item of items) {
    if (!visible.has(key(item.x, item.y))) continue;
    if (item.kind === 'gold') drawGlyph(ctx, '$', item.x, item.y, '#f4d35e');
    else drawGlyph(ctx, '!', item.x, item.y, '#ef6f9e');
  }

  for (const monster of monsters) {
    if (!visible.has(key(monster.x, monster.y))) continue;
    drawGlyph(ctx, monster.glyph, monster.x, monster.y, monster.color);
  }

  drawGlyph(ctx, '@', player.x, player.y, '#ffffff');
}
