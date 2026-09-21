import { GROUND_Y } from './core/levelgen.js';
import {
  drawSky, drawFarHill, drawGround, drawPlatform, drawHazard, drawDecoration,
  drawForge, drawGate, drawGold, drawScrap, drawPotionPickup, drawGearPickup,
  drawProjectile, drawPlayer, drawEnemy, drawHUD,
} from './sprites.js';
import { getImage } from './assets.js';

export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
const BG_PARALLAX = 0.4;

// --------------------------------------------------------- image fallback --
// Every draw call below tries an image first and falls back to the existing
// vector art (sprites.js) when that asset hasn't been dropped in yet, so the
// game always renders something correct. Sizes/anchors here are a first
// pass tuned to look right with no real art in hand -- once actual images
// land, these are the constants to revisit if proportions look off.

const DECOR_TARGET_H = 90;
const ITEM_TARGET_H = 26;
const PROJECTILE_TARGET_H = 14;

// Anchored at (x, y) = bottom-center, matching every vector prop's own
// translate() convention, so swapping one prop from vector to image never
// shifts where it sits relative to the ground/platform under it.
function drawAnchoredImage(ctx, img, x, y, targetH, flip) {
  const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
  const h = targetH;
  const w = h * aspect;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}

// Fills a specific w x h box (an entity's actual hitbox) instead of an
// aspect-derived size, so the sprite always matches where hits register.
function drawBoxImage(ctx, img, x, y, w, h, flip) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}

// Tiles an image horizontally across [x0, x1), stretched to bandH tall --
// used for ground/platform strips of arbitrary width, and (with a scroll
// offset) the parallax background layer. Always drawn over a solid-color
// fill underneath (from the vector path) for ground/platform, so there's
// never a gap if a real tile image turns out shorter than the visible band.
// Clips to the target rect and draws whole tiles across it rather than
// cropping source rects per tile -- much simpler, and correctness-critical
// for ground/platform since a tile must never bleed past a segment's real
// edge into the pit beside it. scrollOffset shifts the tile phase without
// moving x0/x1, so a parallax layer's pattern can drift independently of
// the (fixed, screen-space) rect it's clipped to.
function drawTiledImage(ctx, img, x0, x1, top, bandH, scrollOffset = 0) {
  const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
  const tileW = Math.max(4, bandH * aspect);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, top, x1 - x0, bandH);
  ctx.clip();
  const start = x0 - (((x0 + scrollOffset) % tileW) + tileW) % tileW;
  for (let x = start; x < x1; x += tileW) {
    ctx.drawImage(img, x, top, tileW, bandH);
  }
  ctx.restore();
}

// The painted biome backgrounds are single grand vistas (sun, a distant
// castle silhouette, specific mountain peaks) -- not a repeatable pattern,
// so tiling them would make those landmarks visibly repeat every ~1280px
// on a multi-thousand-px level. Instead: scale to cover the viewport once,
// and pan only a little (clamped within the image's own overflow) for a
// touch of depth without ever needing to wrap.
function drawCoverBackground(ctx, img, w, h, panX) {
  const iw = img.naturalWidth || w;
  const ih = img.naturalHeight || h;
  const scale = Math.max(w / iw, h / ih);
  const drawW = iw * scale;
  const drawH = ih * scale;
  const maxPan = Math.max(0, (drawW - w) / 2);
  const px = Math.max(-maxPan, Math.min(maxPan, -panX));
  ctx.drawImage(img, (w - drawW) / 2 + px, (h - drawH) / 2, drawW, drawH);
}

// Platform art is a complete ledge chunk with rounded, decorated ends (not
// a repeating strip like ground) -- tiling it would show a disconnected
// row of chunks, so stretch one copy to fit instead.
function drawStretchImage(ctx, img, x0, x1, top, h) {
  ctx.drawImage(img, x0, top, x1 - x0, h);
}

function playerPoseKey(player) {
  if (player.swingFlash > 0) return 'player.attack';
  if (!player.onGround) return 'player.jump';
  if (Math.abs(player.vx) > 5) return 'player.run';
  return 'player.idle';
}

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

  const bgImg = getImage(`biome.${biome}.background`);
  if (bgImg) {
    drawCoverBackground(ctx, bgImg, VIEW_WIDTH, VIEW_HEIGHT, camera * BG_PARALLAX * 0.15);
  } else {
    drawSky(ctx, biome, VIEW_WIDTH, VIEW_HEIGHT);
    drawFarHill(ctx, biome, -camera * BG_PARALLAX * 0.5, groundScreenY, VIEW_WIDTH * 1.4);
  }

  for (const d of level.decor.background) {
    const sx = d.x - camera * BG_PARALLAX;
    if (sx < -80 || sx > VIEW_WIDTH + 80) continue;
    const img = getImage(`decor.${d.type}`);
    ctx.save();
    ctx.globalAlpha = 0.45;
    if (img) {
      drawAnchoredImage(ctx, img, sx, groundScreenY + 6, DECOR_TARGET_H * d.scale, false);
    } else {
      ctx.translate(sx, groundScreenY + 6);
      drawDecoration(ctx, d.type, false, d.scale);
    }
    ctx.restore();
  }

  const pitGrad = ctx.createLinearGradient(0, groundScreenY, 0, VIEW_HEIGHT);
  pitGrad.addColorStop(0, '#151018');
  pitGrad.addColorStop(1, '#050408');
  ctx.fillStyle = pitGrad;
  ctx.fillRect(0, groundScreenY, VIEW_WIDTH, VIEW_HEIGHT - groundScreenY);

  const groundImg = getImage(`biome.${biome}.ground`);
  for (const seg of level.segments) {
    const sx0 = seg.x0 - camera;
    const sx1 = seg.x1 - camera;
    if (sx1 < 0 || sx0 > VIEW_WIDTH) continue;
    drawGround(ctx, biome, sx0, sx1, groundScreenY, VIEW_HEIGHT);
    if (groundImg) drawTiledImage(ctx, groundImg, sx0, sx1, groundScreenY, VIEW_HEIGHT - groundScreenY);
  }

  const platformImg = getImage(`biome.${biome}.platform`);
  for (const plat of level.platforms) {
    const sx0 = plat.x0 - camera;
    const sx1 = plat.x1 - camera;
    if (sx1 < 0 || sx0 > VIEW_WIDTH) continue;
    drawPlatform(ctx, biome, sx0, sx1, plat.y);
    if (platformImg) drawStretchImage(ctx, platformImg, sx0, sx1, plat.y - 4, 24);
  }

  const spikeImg = getImage('hazard.spike');
  for (const hz of level.hazards) {
    const sx0 = hz.x0 - camera;
    const sx1 = hz.x1 - camera;
    if (sx1 < 0 || sx0 > VIEW_WIDTH) continue;
    if (spikeImg) drawTiledImage(ctx, spikeImg, sx0, sx1, groundScreenY - 27, 27);
    else drawHazard(ctx, sx0, sx1, groundScreenY);
  }

  for (const d of level.decor.foreground) {
    const sx = d.x - camera;
    if (sx < -60 || sx > VIEW_WIDTH + 60) continue;
    const img = getImage(`decor.${d.type}`);
    if (img) {
      drawAnchoredImage(ctx, img, sx, d.y, DECOR_TARGET_H * d.scale, d.flip);
    } else {
      ctx.save();
      ctx.translate(sx, d.y);
      drawDecoration(ctx, d.type, d.flip, d.scale);
      ctx.restore();
    }
  }

  if (level.forge) {
    const sx = level.forge.x - camera;
    if (sx > -60 && sx < VIEW_WIDTH + 60) {
      const img = getImage('structure.forge');
      if (img) {
        drawAnchoredImage(ctx, img, sx, level.forge.y, 100, false);
      } else {
        ctx.save();
        ctx.translate(sx, level.forge.y);
        drawForge(ctx, time);
        ctx.restore();
      }
    }
  }

  const gateSx = level.gateX - camera;
  if (gateSx > -60 && gateSx < VIEW_WIDTH + 60) {
    const gateImg = getImage('structure.gate');
    if (gateImg) {
      drawAnchoredImage(ctx, gateImg, gateSx, groundScreenY, 120, false);
    } else {
      ctx.save();
      ctx.translate(gateSx, groundScreenY);
      drawGate(ctx, 120);
      ctx.restore();
    }
  }

  const pickupImgKeys = { gold: 'item.gold', scrap: 'item.scrap', potion: 'item.potion' };
  for (const p of state.pickups) {
    const sx = p.x - camera;
    if (sx < -30 || sx > VIEW_WIDTH + 30) continue;
    const imgKey = p.kind === 'weapon' || p.kind === 'armor' ? `${p.kind}.${p.item.id}` : pickupImgKeys[p.kind];
    const img = getImage(imgKey);
    if (img) {
      drawAnchoredImage(ctx, img, sx, p.y, ITEM_TARGET_H, false);
      continue;
    }
    ctx.save();
    ctx.translate(sx, p.y);
    if (p.kind === 'gold') drawGold(ctx);
    else if (p.kind === 'scrap') drawScrap(ctx);
    else if (p.kind === 'potion') drawPotionPickup(ctx);
    else drawGearPickup(ctx, p.kind);
    ctx.restore();
  }

  const arrowImg = getImage('item.arrow');
  for (const proj of state.projectiles) {
    const sx = proj.x - camera;
    if (sx < -20 || sx > VIEW_WIDTH + 20) continue;
    const facing = Math.sign(proj.vx) || 1;
    if (arrowImg) {
      drawAnchoredImage(ctx, arrowImg, sx, proj.y + PROJECTILE_TARGET_H / 2, PROJECTILE_TARGET_H, facing < 0);
    } else {
      ctx.save();
      ctx.translate(sx, proj.y);
      drawProjectile(ctx, facing);
      ctx.restore();
    }
  }

  for (const enemy of state.enemies) {
    const sx = enemy.x - camera;
    if (sx < -60 || sx > VIEW_WIDTH + 60) continue;
    const img = getImage(`enemy.${enemy.type}`);
    if (img) {
      const bob = enemy.state === 'chase' ? Math.sin(time * 9) * 2 : 0;
      ctx.save();
      if (enemy.hitFlash > 0) ctx.globalAlpha = 0.55;
      drawBoxImage(ctx, img, sx + enemy.w / 2, enemy.y + enemy.h + bob, enemy.w, enemy.h, enemy.dir < 0);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(-camera, 0);
      drawEnemy(ctx, enemy, time);
      ctx.restore();
    }

    const barY = enemy.y - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(sx, barY, enemy.w, 4);
    ctx.fillStyle = '#d24040';
    ctx.fillRect(sx, barY, enemy.w * (enemy.hp / enemy.maxHp), 4);
  }

  const player = state.player;
  const playerSx = player.x - camera;
  const playerImg = getImage(playerPoseKey(player));
  if (playerImg) {
    ctx.save();
    if (player.hitFlash > 0) ctx.globalAlpha = 0.6;
    if (player.invuln > 0) ctx.globalAlpha = Math.max(0.4, ctx.globalAlpha - 0.25 * (Math.sin(player.invuln * 30) * 0.5 + 0.5));
    drawBoxImage(ctx, playerImg, playerSx + player.w / 2, player.y + player.h, player.w, player.h, player.facing < 0);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(-camera, 0);
    drawPlayer(ctx, player, time);
    ctx.restore();
  }

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
