import { GROUND_Y } from './core/levelgen.js';
import {
  drawSky, drawFarHill, drawGround, drawPlatform, drawHazard, drawDecoration,
  drawForge, drawGate, drawGold, drawScrap, drawPotionPickup, drawGearPickup,
  drawProjectile, drawSliceWave, drawPlayer, drawEnemy, drawHUD,
} from './sprites.js';
import { getImage } from './assets.js';
import { frameRect, frameForElapsed, frameForPhase } from './animator.js';

// Bumped from 960x540 -- at the old size, making things read bigger meant
// zooming into the same on-screen area, which necessarily showed less of
// the level at once (a smaller play window, correctly flagged as feeling
// cramped). A bigger canvas plus a milder zoom (below) gets a bigger view
// on the page AND keeps roughly as much world visible as before.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
const BG_PARALLAX = 0.4;

// Camera zoom: the canvas is drawn into a slightly smaller world-space
// window that gets scaled up to fill it, so the world (and everyone in it)
// reads bigger without changing anything's size relative to anything else.
// SCREEN_W/SCREEN_H are that window's size in world px; SCREEN_TOP/
// SCREEN_BOTTOM are its world-y extents. There's no vertical scroll (the
// ground never moves), so the window is pinned to the ground line rather
// than following the player. At 1.3x here on a 1280-wide canvas, the
// visible world window (~985px) comes out close to the old un-zoomed
// 960px view -- the size boost comes from the bigger canvas, not from
// shrinking how much of the level you can see.
const ZOOM = 1.3;
const SCREEN_W = VIEW_WIDTH / ZOOM;
const SCREEN_H = VIEW_HEIGHT / ZOOM;
// How much ground/pit stays visible below the ground line -- the rest of
// the window goes above it, which comfortably covers the tallest platform
// (170) plus a full jump arc without needing to track the player vertically.
const BELOW_GROUND_MARGIN = 50;
const SCREEN_TOP = GROUND_Y + BELOW_GROUND_MARGIN - SCREEN_H;
const SCREEN_BOTTOM = SCREEN_TOP + SCREEN_H;

// --------------------------------------------------------- image fallback --
// Every draw call below tries an image first and falls back to the existing
// vector art (sprites.js) when that asset hasn't been dropped in yet, so the
// game always renders something correct. Sizes/anchors here are a first
// pass tuned to look right with no real art in hand -- once actual images
// land, these are the constants to revisit if proportions look off.

// Per-type base heights -- a flat 90px for everything made trees read too
// small (they should dominate) and rocks/gravestones too big (they're
// low, incidental clutter). Each instance still multiplies this by its own
// placement scale (levelgen.js) for size variety within a type. Small
// clutter (rock/gravestone/rubble) is capped low enough that even the
// tallest scale roll (1.2x, see levelgen.js) stays under the player's own
// drawn height (~83, see PLAYER_VISUAL_SCALE below) -- these should read
// as ankle-height set dressing, never tower over the character.
const DECOR_BASE_H = {
  tree: 170,
  bush: 60,
  rock: 42,
  gravestone: 56,
  deadtree: 145,
  crypt: 125,
  pillar: 165,
  banner: 130,
  rubble: 58,
  icetree: 145,
  icespike: 50,
  frostcairn: 70,
  mangrove: 140,
  reeds: 40,
  bogstone: 42,
};
const ITEM_TARGET_H = 26;
const PROJECTILE_TARGET_H = 14;
// Was 27, then 40 -- 40 (tuned to be visible against painted ground) ended
// up reading as oversized once actually in play. Settled between the two:
// tall enough to read as a threat, well short of the player's hurtbox (64).
const SPIKE_H = 30;
// Visual-only boost so the player reads clearly against enemy art -- the
// hitbox (38x64) is unchanged, this only scales what's drawn, anchored on
// the same bottom-center point so it doesn't shift where hits register.
const PLAYER_VISUAL_SCALE = 1.3;
// Same idea per humanoid enemy type -- their hitboxes (entities.js) sit
// noticeably shorter than the player's own scaled-up height, which read as
// "enemies smaller than the player" even though the wolf (left unscaled;
// its low, stocky hitbox already reads fine) was never the complaint.
// Purely cosmetic, like PLAYER_VISUAL_SCALE: collision/AI ranges are
// unaffected.
const ENEMY_VISUAL_SCALE = {
  bandit: 1.35,
  skeleton: 1.35,
  zombie: 1.35,
  guard: 1.3,
  gargoyle: 1.4,
};

// ----------------------------------------------------------- player anims --
// Every player sheet is a 4x4 grid (src/animator.js); a clip is a named
// slice of its 16 frames. Several clips can share one sheet (moods.png
// alone covers idle/hurt/dodge/victory). dodge and victory are defined but
// not currently selected by pickPlayerClip below -- there's no dodge-roll
// or level-complete-pause mechanic yet for them to represent, so they sit
// ready rather than being force-fit onto something that doesn't fit.
const PLAYER_CLIPS = {
  idle: { key: 'player.sheet.moods', start: 0, count: 4 },
  hurt: { key: 'player.sheet.moods', start: 4, count: 4 },
  dodge: { key: 'player.sheet.moods', start: 8, count: 4 },
  victory: { key: 'player.sheet.moods', start: 12, count: 4 },
  run: { key: 'player.sheet.runJump', start: 0, count: 8 },
  jump: { key: 'player.sheet.runJump', start: 8, count: 8 },
  death: { key: 'player.sheet.walkDeath', start: 8, count: 8 },
  swing0: { key: 'player.sheet.melee', start: 0, count: 4 },
  swing1: { key: 'player.sheet.melee', start: 4, count: 4 },
  swing2: { key: 'player.sheet.melee', start: 8, count: 4 },
  swing3: { key: 'player.sheet.melee', start: 12, count: 4 },
};
// Mirrors core/game.js's SWING_VISUAL/hurtPlayer's hitFlash duration --
// kept as separate constants (render.js doesn't otherwise depend on
// game.js) rather than importing them, matching how ENEMY_WINDUP_REFERENCE
// above already mirrors game.js's ENEMY_WINDUP. Keep both in sync if either
// changes.
const PLAYER_SWING_DURATION = 0.28;
const PLAYER_HURT_DURATION = 0.25;
const PLAYER_JUMP_DURATION = 0.5;
const PLAYER_DEATH_DURATION = 0.6;
// World px of travel per full 8-frame run cycle -- tuned so the stride
// looks natural at the player's actual move speed, not by wall-clock time
// (so it freezes cleanly the instant you stop, exactly like the old bob
// hack did, but now with a real running animation instead of one static
// pose bouncing up and down).
const PLAYER_RUN_STRIDE = 60;

function pickPlayerClipName(player, gameOver) {
  if (gameOver) return 'death';
  if (player.swingFlash > 0) return `swing${player.comboStep}`;
  if (player.hitFlash > 0) return 'hurt';
  if (!player.onGround) return 'jump';
  if (Math.abs(player.vx) > 5) return 'run';
  return 'idle';
}

function playerClipFrame(clipName, clip, player, time, deathElapsed) {
  if (clipName === 'run') {
    return frameForPhase(clip, (player.x / PLAYER_RUN_STRIDE) * clip.count);
  }
  if (clipName === 'jump') {
    return frameForElapsed({ count: clip.count, fps: clip.count / PLAYER_JUMP_DURATION, loop: false }, player.airTime);
  }
  if (clipName === 'death') {
    return frameForElapsed({ count: clip.count, fps: clip.count / PLAYER_DEATH_DURATION, loop: false }, deathElapsed);
  }
  if (clipName === 'hurt') {
    return frameForElapsed(
      { count: clip.count, fps: clip.count / PLAYER_HURT_DURATION, loop: false },
      PLAYER_HURT_DURATION - player.hitFlash,
    );
  }
  if (clipName.startsWith('swing')) {
    return frameForElapsed(
      { count: clip.count, fps: clip.count / PLAYER_SWING_DURATION, loop: false },
      PLAYER_SWING_DURATION - player.swingFlash,
    );
  }
  // idle (and dodge/victory, if ever wired) -- a slow ambient loop driven
  // by wall-clock time since there's no movement to drive it off while
  // standing still.
  return frameForElapsed({ count: clip.count, fps: 3, loop: true }, time);
}

// Tracks when the current death animation started so its frame can be
// computed from elapsed wall-clock time (renderGame only receives `time`,
// not a per-state timer -- game.js's own update() loop stops entirely once
// gameOver is set, so there's nowhere on the simulation side to count this
// from). Reset the moment a new run starts.
let deathStartTime = null;

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
// visualScale grows the drawn box around the same bottom-center anchor
// without touching w/h themselves -- for when the art needs to read
// bigger than the actual collision box (see PLAYER_VISUAL_SCALE).
function drawBoxImage(ctx, img, x, y, w, h, flip, visualScale = 1) {
  const dw = w * visualScale;
  const dh = h * visualScale;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -dw / 2, -dh, dw, dh);
  ctx.restore();
}

// Same as drawBoxImage, but draws one frame out of a 4x4 animation sheet
// (see src/animator.js) instead of the whole image.
function drawSheetBox(ctx, img, frameIndex, x, y, w, h, flip, visualScale = 1) {
  const { sx, sy, sw, sh } = frameRect(img, frameIndex);
  const dw = w * visualScale;
  const dh = h * visualScale;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh, dw, dh);
  ctx.restore();
}

// Tiles an image horizontally across [x0, x1), stretched to bandH tall --
// used for ground/platform strips of arbitrary width, and (with a scroll
// offset) the parallax background layer. Every tile is drawn at exactly
// bandH regardless of the source image's own aspect ratio, so it always
// fully covers the target band -- drawing the vector fallback underneath
// as a permanent safety net (the original design, before real art existed)
// turned out to actively hurt once real art landed: any translucent edge
// pixel on the image let that flat vector fill show through as a seam.
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

// The attack telegraph (pulsing ring + "!") was only ever drawn inside the
// vector drawEnemy() path in sprites.js -- with a real enemy image active
// it silently never showed at all, quietly undoing the earlier fairness
// work (a windup with no visible tell is just an unavoidable hit). Drawn
// here instead, once per enemy regardless of which body art is active.
const ENEMY_WINDUP_REFERENCE = 0.35;
function drawWindupTelegraph(ctx, sx, enemy, walkPhase) {
  const cx = sx + enemy.w / 2;
  const cy = enemy.y + enemy.h * 0.4;
  const urgency = 1 - enemy.windup / ENEMY_WINDUP_REFERENCE;
  const pulse = 0.5 + 0.5 * Math.sin(walkPhase * 26);
  ctx.save();
  ctx.strokeStyle = `rgba(255,70,60,${0.35 + 0.4 * urgency})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, enemy.w * 0.55 + pulse * 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,90,70,0.9)';
  ctx.font = `bold ${Math.round(enemy.h * 0.36)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('!', cx, enemy.y - enemy.h * 0.08);
  ctx.restore();
}

export function computeCamera(state) {
  const target = state.player.x + state.player.w / 2 - SCREEN_W / 2;
  return Math.max(0, Math.min(Math.max(0, state.level.width - SCREEN_W), target));
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
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(0, -SCREEN_TOP);

  const bgImg = getImage(`biome.${biome}.background`);
  ctx.save();
  ctx.translate(0, SCREEN_TOP);
  if (bgImg) {
    drawCoverBackground(ctx, bgImg, SCREEN_W, SCREEN_H, camera * BG_PARALLAX * 0.15);
  } else {
    drawSky(ctx, biome, SCREEN_W, SCREEN_H);
    drawFarHill(ctx, biome, -camera * BG_PARALLAX * 0.5, groundScreenY - SCREEN_TOP, SCREEN_W * 1.4);
  }
  ctx.restore();

  for (const d of level.decor.background) {
    const sx = d.x - camera * BG_PARALLAX;
    if (sx < -80 || sx > SCREEN_W + 80) continue;
    const img = getImage(`decor.${d.type}`);
    ctx.save();
    ctx.globalAlpha = 0.45;
    if (img) {
      drawAnchoredImage(ctx, img, sx, groundScreenY + 6, (DECOR_BASE_H[d.type] || 90) * d.scale, false);
    } else {
      ctx.translate(sx, groundScreenY + 6);
      drawDecoration(ctx, d.type, false, d.scale);
    }
    ctx.restore();
  }

  const pitGrad = ctx.createLinearGradient(0, groundScreenY, 0, SCREEN_BOTTOM);
  pitGrad.addColorStop(0, '#151018');
  pitGrad.addColorStop(1, '#050408');
  ctx.fillStyle = pitGrad;
  ctx.fillRect(0, groundScreenY, SCREEN_W, SCREEN_BOTTOM - groundScreenY);

  const groundImg = getImage(`biome.${biome}.ground`);
  for (const seg of level.segments) {
    const sx0 = seg.x0 - camera;
    const sx1 = seg.x1 - camera;
    if (sx1 < 0 || sx0 > SCREEN_W) continue;
    if (groundImg) drawTiledImage(ctx, groundImg, sx0, sx1, groundScreenY, SCREEN_BOTTOM - groundScreenY);
    else drawGround(ctx, biome, sx0, sx1, groundScreenY, SCREEN_BOTTOM);
  }

  const platformImg = getImage(`biome.${biome}.platform`);
  for (const plat of level.platforms) {
    const sx0 = plat.x0 - camera;
    const sx1 = plat.x1 - camera;
    if (sx1 < 0 || sx0 > SCREEN_W) continue;
    if (platformImg) drawStretchImage(ctx, platformImg, sx0, sx1, plat.y - 4, 24);
    else drawPlatform(ctx, biome, sx0, sx1, plat.y);
  }

  const spikeImg = getImage('hazard.spike');
  for (const hz of level.hazards) {
    const sx0 = hz.x0 - camera;
    const sx1 = hz.x1 - camera;
    if (sx1 < 0 || sx0 > SCREEN_W) continue;
    if (spikeImg) {
      // A floating red bar above the hazard made it visible, but a thin
      // horizontal black-then-red rect hovering over something is exactly
      // the shape of this game's own enemy HP bars -- read as one at a
      // glance. A glow hugging the spikes' own silhouette instead reads as
      // ambient danger lighting, not a UI element, while still popping
      // against the painted ground.
      const glow = ctx.createLinearGradient(0, groundScreenY - SPIKE_H, 0, groundScreenY);
      glow.addColorStop(0, 'rgba(255,60,50,0)');
      glow.addColorStop(1, 'rgba(255,60,50,0.4)');
      ctx.fillStyle = glow;
      ctx.fillRect(sx0 - 4, groundScreenY - SPIKE_H, sx1 - sx0 + 8, SPIKE_H);
      drawTiledImage(ctx, spikeImg, sx0, sx1, groundScreenY - SPIKE_H, SPIKE_H);
    } else {
      drawHazard(ctx, sx0, sx1, groundScreenY);
    }
  }

  for (const d of level.decor.foreground) {
    const sx = d.x - camera;
    if (sx < -60 || sx > SCREEN_W + 60) continue;
    const img = getImage(`decor.${d.type}`);
    if (img) {
      drawAnchoredImage(ctx, img, sx, d.y, (DECOR_BASE_H[d.type] || 90) * d.scale, d.flip);
    } else {
      ctx.save();
      ctx.translate(sx, d.y);
      drawDecoration(ctx, d.type, d.flip, d.scale);
      ctx.restore();
    }
  }

  if (level.forge) {
    const sx = level.forge.x - camera;
    if (sx > -60 && sx < SCREEN_W + 60) {
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
  if (gateSx > -60 && gateSx < SCREEN_W + 60) {
    const gateImg = getImage('structure.gate');
    if (gateImg) {
      // Was 120 -- small enough that the actual glowing "doorway" inside
      // the archway read as a tiny detail, not a destination, so it felt
      // like you had to walk almost on top of the art before it registered
      // as the level exit.
      drawAnchoredImage(ctx, gateImg, gateSx, groundScreenY, 190, false);
    } else {
      ctx.save();
      ctx.translate(gateSx, groundScreenY);
      drawGate(ctx, 190);
      ctx.restore();
    }
  }

  const pickupImgKeys = { gold: 'item.gold', scrap: 'item.scrap', potion: 'item.potion' };
  for (const p of state.pickups) {
    const sx = p.x - camera;
    if (sx < -30 || sx > SCREEN_W + 30) continue;
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
    if (sx < -20 || sx > SCREEN_W + 20) continue;
    const facing = Math.sign(proj.vx) || 1;
    if (proj.kind === 'wave') {
      // No dedicated art delivered for the combo finisher's wave yet --
      // vector for now, same fallback philosophy as everything else here.
      ctx.save();
      ctx.translate(sx, proj.y);
      drawSliceWave(ctx, facing);
      ctx.restore();
    } else if (arrowImg) {
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
    if (sx < -60 || sx > SCREEN_W + 60) continue;
    const img = getImage(`enemy.${enemy.type}`);
    // A static pose translated in a straight line reads as sliding, not
    // walking. Bob phase is driven by the enemy's own x, not wall-clock
    // time, so the "step" rate naturally matches how fast it's actually
    // moving and freezes cleanly the instant it stops (windup/hitstun).
    const moving = (enemy.state === 'chase' || enemy.state === 'patrol') && enemy.windup <= 0 && enemy.hitstun <= 0;
    const bob = moving ? -Math.abs(Math.sin(enemy.x * 0.05)) * 3 : 0;
    if (img) {
      ctx.save();
      if (enemy.hitFlash > 0) ctx.globalAlpha = 0.55;
      // Every painted enemy faces left by default (the source art), the
      // opposite of the old vector sprites it replaced -- flipping on
      // dir < 0 (the vector convention) mirrored it backwards: facing left
      // while moving right and vice versa, i.e. walking backwards. Flip on
      // dir > 0 instead so it only mirrors when actually moving right.
      drawBoxImage(ctx, img, sx + enemy.w / 2, enemy.y + enemy.h + bob, enemy.w, enemy.h, enemy.dir > 0, ENEMY_VISUAL_SCALE[enemy.type] || 1);
      ctx.restore();
      // The vector path (drawEnemy in sprites.js) draws its own windup
      // ring internally -- only add it here for the image path, so it's
      // never drawn twice.
      if (enemy.windup > 0) drawWindupTelegraph(ctx, sx, enemy, time);
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
  const clipName = pickPlayerClipName(player, state.gameOver);
  const clip = PLAYER_CLIPS[clipName];
  const playerImg = getImage(clip.key);
  if (playerImg) {
    if (state.gameOver) {
      if (deathStartTime === null) deathStartTime = time;
    } else {
      deathStartTime = null;
    }
    const deathElapsed = state.gameOver ? time - deathStartTime : 0;
    const localFrame = playerClipFrame(clipName, clip, player, time, deathElapsed);
    ctx.save();
    if (player.hitFlash > 0) ctx.globalAlpha = 0.6;
    if (player.invuln > 0) ctx.globalAlpha = Math.max(0.4, ctx.globalAlpha - 0.25 * (Math.sin(player.invuln * 30) * 0.5 + 0.5));
    drawSheetBox(
      ctx, playerImg, clip.start + localFrame,
      playerSx + player.w / 2, player.y + player.h,
      player.w, player.h, player.facing < 0, PLAYER_VISUAL_SCALE,
    );
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
    if (sx < -40 || sx > SCREEN_W + 40) continue;
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life / 0.35));
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, sx, f.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  drawHUD(ctx, state.player);
}
