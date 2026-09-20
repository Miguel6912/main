import { TILE } from './core/dungeon.js';
import { drawFloor, drawWall, drawStairs, drawPlayer, drawMonster, drawGold, drawPotion } from './sprites.js';

export const TILE_SIZE = 28;

const BG = '#0a0a10';
const MEMORY_OVERLAY = 'rgba(8,8,16,0.62)';

function key(x, y) {
  return `${x},${y}`;
}

function withTile(ctx, x, y, drawFn) {
  ctx.save();
  ctx.translate(x * TILE_SIZE, y * TILE_SIZE);
  ctx.scale(TILE_SIZE, TILE_SIZE);
  drawFn(ctx);
  ctx.restore();
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

  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      const k = key(x, y);
      if (!discovered.has(k)) continue;
      const lit = visible.has(k);
      const tile = dungeon.grid[y][x];

      withTile(ctx, x, y, (c) => {
        if (tile === TILE.WALL) drawWall(c, x, y);
        else if (tile === TILE.STAIRS) drawStairs(c);
        else drawFloor(c, x, y);
        if (!lit) {
          c.fillStyle = MEMORY_OVERLAY;
          c.fillRect(0, 0, 1, 1);
        }
      });
    }
  }

  for (const item of items) {
    const k = key(item.x, item.y);
    if (!discovered.has(k)) continue;
    const lit = visible.has(k);
    withTile(ctx, item.x, item.y, (c) => {
      if (item.kind === 'gold') drawGold(c);
      else drawPotion(c);
      if (!lit) {
        c.fillStyle = MEMORY_OVERLAY;
        c.fillRect(0, 0, 1, 1);
      }
    });
  }

  for (const monster of monsters) {
    if (!visible.has(key(monster.x, monster.y))) continue;
    withTile(ctx, monster.x, monster.y, (c) => drawMonster(c, monster.type));
  }

  withTile(ctx, player.x, player.y, drawPlayer);
}
