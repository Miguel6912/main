import { GROUND_Y } from './core/levelgen.js';
import {
  drawSky, drawFarHill, drawGround, drawPlatform, drawHazard, drawDecoration,
  drawForge, drawGate, drawGold, drawScrap, drawPotionPickup, drawGearPickup,
  drawProjectile, drawPlayer, drawEnemy, drawHUD,
} from './sprites.js';

export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
const BG_PARALLAX = 0.4;

export function computeCamera(state) {
  const target = state.player.x + state.player.w / 2 - VIEW_WIDTH / 2;
  return Math.max(0, Math.min(Math.max(0, state.level.width - VIEW_WIDTH), target));
}

export function renderGame(canvas, state, time) {
  const ctx = canvas.getContext('2d');
  if (canvas.width !== VIEW_WIDTH) canvas.width = VIEW_WIDTH;
  if (canvas.height !== VIEW_HEIGHT) canvas.height = VIEW_HEIGHT;

  const { level } = state;
  const biome = level.biome;
  const camera = computeCamera(state);
  const groundScreenY = GROUND_Y;

  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake * 7, (Math.random() - 0.5) * state.shake * 5);
  }

  drawSky(ctx, biome, VIEW_WIDTH, VIEW_HEIGHT);
  drawFarHill(ctx, biome, -camera * BG_PARALLAX * 0.5, groundScreenY, VIEW_WIDTH * 1.4);

  for (const d of level.decor.background) {
    const sx = d.x - camera * BG_PARALLAX;
    if (sx < -80 || sx > VIEW_WIDTH + 80) continue;
    ctx.save();
    ctx.translate(sx, groundScreenY + 6);
    ctx.globalAlpha = 0.45;
    drawDecoration(ctx, d.type, false, d.scale);
    ctx.restore();
  }

  const pitGrad = ctx.createLinearGradient(0, groundScreenY, 0, VIEW_HEIGHT);
  pitGrad.addColorStop(0, '#151018');
  pitGrad.addColorStop(1, '#050408');
  ctx.fillStyle = pitGrad;
  ctx.fillRect(0, groundScreenY, VIEW_WIDTH, VIEW_HEIGHT - groundScreenY);

  for (const seg of level.segments) {
    const sx0 = seg.x0 - camera;
    const sx1 = seg.x1 - camera;
    if (sx1 < 0 || sx0 > VIEW_WIDTH) continue;
    drawGround(ctx, biome, sx0, sx1, groundScreenY, VIEW_HEIGHT);
  }

  for (const plat of level.platforms) {
    const sx0 = plat.x0 - camera;
    const sx1 = plat.x1 - camera;
    if (sx1 < 0 || sx0 > VIEW_WIDTH) continue;
    drawPlatform(ctx, biome, sx0, sx1, plat.y);
  }

  for (const hz of level.hazards) {
    const sx0 = hz.x0 - camera;
    const sx1 = hz.x1 - camera;
    if (sx1 < 0 || sx0 > VIEW_WIDTH) continue;
    drawHazard(ctx, sx0, sx1, groundScreenY);
  }

  for (const d of level.decor.foreground) {
    const sx = d.x - camera;
    if (sx < -60 || sx > VIEW_WIDTH + 60) continue;
    ctx.save();
    ctx.translate(sx, d.y);
    drawDecoration(ctx, d.type, d.flip, d.scale);
    ctx.restore();
  }

  if (level.forge) {
    const sx = level.forge.x - camera;
    if (sx > -60 && sx < VIEW_WIDTH + 60) {
      ctx.save();
      ctx.translate(sx, level.forge.y);
      drawForge(ctx, time);
      ctx.restore();
    }
  }

  const gateSx = level.gateX - camera;
  if (gateSx > -60 && gateSx < VIEW_WIDTH + 60) {
    ctx.save();
    ctx.translate(gateSx, groundScreenY);
    drawGate(ctx, 120);
    ctx.restore();
  }

  for (const p of state.pickups) {
    const sx = p.x - camera;
    if (sx < -30 || sx > VIEW_WIDTH + 30) continue;
    ctx.save();
    ctx.translate(sx, p.y);
    if (p.kind === 'gold') drawGold(ctx);
    else if (p.kind === 'scrap') drawScrap(ctx);
    else if (p.kind === 'potion') drawPotionPickup(ctx);
    else drawGearPickup(ctx, p.kind);
    ctx.restore();
  }

  for (const proj of state.projectiles) {
    const sx = proj.x - camera;
    if (sx < -20 || sx > VIEW_WIDTH + 20) continue;
    ctx.save();
    ctx.translate(sx, proj.y);
    drawProjectile(ctx, Math.sign(proj.vx) || 1);
    ctx.restore();
  }

  for (const enemy of state.enemies) {
    const sx = enemy.x - camera;
    if (sx < -60 || sx > VIEW_WIDTH + 60) continue;
    ctx.save();
    ctx.translate(-camera, 0);
    drawEnemy(ctx, enemy, time);
    ctx.restore();

    const barY = enemy.y - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(sx, barY, enemy.w, 4);
    ctx.fillStyle = '#d24040';
    ctx.fillRect(sx, barY, enemy.w * (enemy.hp / enemy.maxHp), 4);
  }

  ctx.save();
  ctx.translate(-camera, 0);
  drawPlayer(ctx, state.player, time);
  ctx.restore();

  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.textAlign = 'center';
  for (const f of state.floatingTexts) {
    const sx = f.x - camera;
    if (sx < -40 || sx > VIEW_WIDTH + 40) continue;
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life / 0.35));
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, sx, f.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  drawHUD(ctx, state.player);
}
