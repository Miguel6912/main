import { WORLD_WIDTH, WORLD_HEIGHT, BUILDINGS, RIVER, HOTSPOTS, FORAGE_SPOTS, OBSTACLES } from '../world/MapData.js';
import { getSkyColor, getNightOverlayAlpha, SEASON_PALETTE, FOLIAGE_PALETTE, lerpColor } from './Palette.js';
import { RNG } from '../core/RNG.js';
import { PROPERTY_LEVELS } from '../data/properties.js';
import { AssetLoader } from './Assets.js';

const TREE_BASE_WIDTH = 108; // on-screen width in world px at scale=1
const MEADOW_TILE_SIZE = 240; // on-screen width/height of one tiled meadow patch
const MEADOW_TILE_SEASONS = new Set(['spring', 'summer']);
const MEADOW_TILE_MAX_X = 1480; // keep the forest floor clear of open-meadow texture

const ROAD_STRIPS = [
  { x: 280, y: 540, w: 1220, h: 46 }, // main street
  { x: 878, y: 380, w: 46, h: 420 }, // well square spur
  { x: 320, y: 490, w: 46, h: 90 }, // watchpost spur
];

const HEART_TREE = { x: 900, y: 442, scale: 2.15 };

function clampCamera(target, viewSize, worldSize) {
  if (worldSize <= viewSize) return (worldSize - viewSize) / 2;
  return Math.max(0, Math.min(worldSize - viewSize, target));
}

function shade(hex, amount) {
  return lerpColor(hex, amount > 0 ? '#ffffff' : '#000000', Math.min(1, Math.abs(amount)));
}

function tooCloseToAny(x, y, rects, buffer) {
  return rects.some((r) => {
    const cx = Math.max(r.x, Math.min(x, r.x + (r.w || 0)));
    const cy = Math.max(r.y, Math.min(y, r.y + (r.h || 0)));
    return Math.hypot(x - cx, y - cy) < buffer;
  }) || HOTSPOTS.some((h) => Math.hypot(x - h.x, y - h.y) < buffer) || FORAGE_SPOTS.some((f) => Math.hypot(x - f.x, y - f.y) < buffer);
}

// Canvas-only renderer: draws the painterly, storybook-style village scene.
// All game-world geometry comes from MapData.js and all colour choices from
// Palette.js, so this file is pure "how to draw a rect/circle/tree", not
// "where things are" or "what colour is autumn".
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = new AssetLoader();
    this._generateDecor();
  }

  _generateDecor() {
    const rng = new RNG(42); // fixed seed: decoration is stable across reloads
    this.villageTrees = [];
    for (let i = 0; i < 22 && this.villageTrees.length < 16; i++) {
      const x = rng.range(340, 1080);
      const y = rng.range(70, 930);
      if (!tooCloseToAny(x, y, [...OBSTACLES, RIVER], 55)) {
        this.villageTrees.push({ x, y, scale: rng.range(0.8, 1.3) });
      }
    }
    this.forestTrees = [];
    for (let i = 0; i < 90; i++) {
      const x = rng.range(1505, 1795);
      const y = rng.range(20, 980);
      if (!tooCloseToAny(x, y, [], 40)) {
        this.forestTrees.push({ x, y, scale: rng.range(0.9, 1.6), depth: rng.next() });
      }
    }
    this.grassPatches = [];
    for (let i = 0; i < 160; i++) {
      this.grassPatches.push({ x: rng.range(0, WORLD_WIDTH), y: rng.range(0, WORLD_HEIGHT), r: rng.range(8, 22) });
    }
    this.castleBushes = [
      { x: 90, y: 610 }, { x: 220, y: 620 }, { x: 150, y: 640 },
    ];
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({ x: rng.next(), y: rng.range(0, 0.6), s: rng.range(0.5, 1.8), tw: rng.range(0, Math.PI * 2) });
    }

    this.roadMottles = [];
    for (const strip of ROAD_STRIPS) {
      const count = Math.round((strip.w * strip.h) / 260);
      for (let i = 0; i < count; i++) {
        this.roadMottles.push({
          x: strip.x + rng.range(4, strip.w - 4),
          y: strip.y + rng.range(4, strip.h - 4),
          r: rng.range(3, 8),
          dark: rng.chance(0.6),
        });
      }
    }

    const buildingRng = new RNG(77); // separate stream so building texture doesn't shift if decor generation changes
    this.buildingTextures = {};
    for (const b of BUILDINGS) {
      const wallSpots = [];
      const spotCount = Math.round((b.w * b.h) / 260);
      for (let i = 0; i < spotCount; i++) {
        wallSpots.push({
          fx: buildingRng.range(0.04, 0.96),
          fy: buildingRng.range(0.08, 0.92),
          r: buildingRng.range(2.5, 5.5),
          dark: buildingRng.chance(0.5),
        });
      }
      const bumpCount = Math.max(5, Math.round(b.w / 22));
      const thatchBumps = [];
      for (let i = 0; i <= bumpCount; i++) {
        thatchBumps.push(buildingRng.range(-5, 5));
      }
      this.buildingTextures[b.id] = { wallSpots, thatchBumps };
    }
  }

  render(state) {
    const { player, npcs, time, propertyLevel, particles, interactTarget, clockT } = state;
    const { ctx, canvas } = this;
    const viewW = canvas.width;
    const viewH = canvas.height;
    const camX = clampCamera(player.x - viewW / 2, viewW, WORLD_WIDTH);
    const camY = clampCamera(player.y - viewH / 2, viewH, WORLD_HEIGHT);
    const hourFrac = time.hour + time.minute / 60;
    const season = time.season;

    ctx.fillStyle = getSkyColor(hourFrac);
    ctx.fillRect(0, 0, viewW, viewH);
    if (time.phase === 'night' || time.phase === 'dusk') this._drawStars(clockT, viewW, viewH, time.phase === 'night' ? 1 : 0.3);

    ctx.save();
    ctx.translate(-camX, -camY);

    this._drawGround(season);
    this._drawCastle();
    this._drawRiver(season);
    this._drawRoads();
    this._drawForestBackdrop(season, 'back');
    this._drawDecor(season);
    this._drawTree(HEART_TREE.x, HEART_TREE.y, HEART_TREE.scale, season);
    this._drawHotspots(propertyLevel, interactTarget);
    this._drawForageSpots(state.economy, time.dayCount, interactTarget);
    this._drawBuildings(time.phase, interactTarget);

    const drawables = [
      ...npcs.map((n) => ({ type: 'npc', ref: n, y: n.y })),
      { type: 'player', ref: player, y: player.y },
    ];
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      if (d.type === 'npc') this._drawNpc(d.ref, interactTarget);
      else this._drawPlayer(d.ref);
    }

    this._drawForestBackdrop(season, 'front');
    particles.draw(ctx);
    ctx.restore();

    const overlay = getNightOverlayAlpha(hourFrac);
    if (overlay > 0) {
      ctx.fillStyle = `rgba(12,16,42,${overlay})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }

    this._drawVignette(viewW, viewH);

    if (state.rareFlourish) this._drawRareFlourishGlow(state.rareFlourish, camX, camY);
  }

  // Soft edge-darkening for a bit of atmospheric depth, in screen space so
  // it stays fixed to the viewport rather than the world.
  _drawVignette(viewW, viewH) {
    const { ctx } = this;
    const grad = ctx.createRadialGradient(
      viewW / 2, viewH / 2, Math.min(viewW, viewH) * 0.38,
      viewW / 2, viewH / 2, Math.max(viewW, viewH) * 0.72
    );
    grad.addColorStop(0, 'rgba(10,8,5,0)');
    grad.addColorStop(1, 'rgba(10,8,5,0.32)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  _drawStars(t, viewW, viewH, alpha) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff8e0';
    for (const s of this.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + s.tw);
      ctx.globalAlpha = alpha * twinkle;
      ctx.beginPath();
      ctx.arc(s.x * viewW, s.y * viewH, s.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawGround(season) {
    const { ctx } = this;
    const pal = SEASON_PALETTE[season];
    ctx.fillStyle = pal.grass;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.fillStyle = pal.grassShade;
    ctx.globalAlpha = 0.35;
    for (const p of this.grassPatches) {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (MEADOW_TILE_SEASONS.has(season)) this._drawMeadowTexture();
  }

  // Tiles the baked meadow-tile image (real grass+wildflower detail) over
  // the open village ground in the warmer seasons. Alternating flips break
  // up the repeating grid without needing more source art. The forest zone
  // is left as flat colour so it still reads as darker/denser underfoot.
  _drawMeadowTexture() {
    const img = this.assets.get('meadow-tile');
    if (!img) return;
    const { ctx } = this;
    const cols = Math.ceil(Math.min(WORLD_WIDTH, MEADOW_TILE_MAX_X) / MEADOW_TILE_SIZE);
    const rows = Math.ceil(WORLD_HEIGHT / MEADOW_TILE_SIZE);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const flipX = (col + row) % 2 === 0;
        const flipY = (col * 3 + row * 7) % 5 < 2;
        const x = col * MEADOW_TILE_SIZE;
        const y = row * MEADOW_TILE_SIZE;
        ctx.save();
        ctx.translate(x + MEADOW_TILE_SIZE / 2, y + MEADOW_TILE_SIZE / 2);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctx.drawImage(img, -MEADOW_TILE_SIZE / 2, -MEADOW_TILE_SIZE / 2, MEADOW_TILE_SIZE, MEADOW_TILE_SIZE);
        ctx.restore();
      }
    }
  }

  // A worn dirt path rather than a flat tinted strip: a soft-edged base
  // tone plus scattered darker/lighter mottling, like foot-trodden earth
  // with grass creeping at the edges.
  _drawRoads() {
    const { ctx } = this;
    for (const strip of ROAD_STRIPS) {
      const grad = strip.w >= strip.h
        ? ctx.createLinearGradient(strip.x, strip.y, strip.x, strip.y + strip.h)
        : ctx.createLinearGradient(strip.x, strip.y, strip.x + strip.w, strip.y);
      grad.addColorStop(0, 'rgba(191,166,115,0)');
      grad.addColorStop(0.18, 'rgba(191,166,115,0.7)');
      grad.addColorStop(0.82, 'rgba(191,166,115,0.7)');
      grad.addColorStop(1, 'rgba(191,166,115,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(strip.x, strip.y, strip.w, strip.h);
    }
    for (const m of this.roadMottles) {
      ctx.fillStyle = m.dark ? 'rgba(120,98,64,0.35)' : 'rgba(214,196,155,0.4)';
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, m.r, m.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawCastle() {
    const { ctx } = this;
    ctx.fillStyle = '#7d8592';
    ctx.fillRect(60, 300, 220, 300);
    ctx.fillStyle = '#6b7280';
    for (const tx of [60, 150, 250]) {
      ctx.fillRect(tx, 260, 40, 60);
      ctx.fillRect(tx, 250, 8, 20);
      ctx.fillRect(tx + 32, 250, 8, 20);
      ctx.fillRect(tx + 16, 250, 8, 20);
    }
    ctx.fillStyle = '#5b6169';
    ctx.fillRect(150, 440, 40, 160);
    ctx.beginPath();
    ctx.moveTo(140, 440);
    ctx.lineTo(170, 400);
    ctx.lineTo(200, 440);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a3f47';
    for (const b of this.castleBushes) {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 20, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#4f6b3a';
      ctx.fill();
    }
    // pennant
    ctx.fillStyle = '#c1503f';
    ctx.fillRect(168, 388, 2, 16);
    ctx.beginPath();
    ctx.moveTo(170, 390);
    ctx.lineTo(186, 396);
    ctx.lineTo(170, 402);
    ctx.closePath();
    ctx.fill();
  }

  _drawRiver(season) {
    const { ctx } = this;
    const pal = SEASON_PALETTE[season];
    ctx.fillStyle = pal.water;
    ctx.fillRect(RIVER.x, RIVER.y, RIVER.w, RIVER.bridgeY);
    ctx.fillRect(RIVER.x, RIVER.bridgeY + RIVER.bridgeH, RIVER.w, WORLD_HEIGHT - (RIVER.bridgeY + RIVER.bridgeH));
    // bridge
    ctx.fillStyle = '#a9784a';
    ctx.fillRect(RIVER.x - 6, RIVER.bridgeY, RIVER.w + 12, RIVER.bridgeH);
    ctx.strokeStyle = '#7a5432';
    ctx.lineWidth = 2;
    for (let y = RIVER.bridgeY + 8; y < RIVER.bridgeY + RIVER.bridgeH; y += 12) {
      ctx.beginPath();
      ctx.moveTo(RIVER.x - 6, y);
      ctx.lineTo(RIVER.x + RIVER.w + 6, y);
      ctx.stroke();
    }
  }

  _drawForestBackdrop(season, layer) {
    for (const t of this.forestTrees) {
      const isBack = t.depth < 0.5;
      if ((layer === 'back') !== isBack) continue;
      this._drawTree(t.x, t.y, t.scale, season);
    }
  }

  _drawDecor(season) {
    for (const t of this.villageTrees) this._drawTree(t.x, t.y, t.scale, season);
  }

  _drawTree(x, y, scale, season) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 16 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    const img = this.assets.get(`tree-${season}`);
    if (img) {
      const w = TREE_BASE_WIDTH * scale;
      const h = w * (img.height / img.width);
      ctx.drawImage(img, x - w / 2, y - h, w, h);
    } else {
      this._drawTreeVector(x, y, scale, FOLIAGE_PALETTE[season]);
    }
  }

  // Fallback used only for the handful of frames before the baked tree
  // image has finished decoding (see Assets.js) -- keeps the scene from
  // ever showing an empty gap where a tree should be.
  _drawTreeVector(x, y, scale, colors) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#6b4a2e';
    ctx.fillRect(-4, -10, 8, 22);
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.arc(-8, -22, 15, 0, Math.PI * 2);
    ctx.arc(8, -20, 14, 0, Math.PI * 2);
    ctx.arc(0, -32, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors[1] || colors[0];
    ctx.beginPath();
    ctx.arc(0, -30, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawBuildings(phase, interactTarget) {
    const { ctx } = this;
    const nightGlow = phase === 'night' || phase === 'dusk';
    for (const b of BUILDINGS) {
      const tex = this.buildingTextures[b.id];
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(b.x + b.w / 2, b.y + b.h + 8, b.w / 2, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      this._drawStoneWall(b, tex);
      this._drawThatchRoof(b, tex);

      // door: dark planked wood with an accent-coloured frame
      ctx.fillStyle = '#3d2a1a';
      ctx.fillRect(b.doorX - 14, b.doorY - 28, 28, 28);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(b.doorX - 14 + i * 9, b.doorY - 28);
        ctx.lineTo(b.doorX - 14 + i * 9, b.doorY);
        ctx.stroke();
      }
      ctx.strokeStyle = b.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(b.doorX - 14, b.doorY - 28, 28, 28);

      // windows with mullions and accent-coloured shutters
      const winY = b.y + b.h * 0.55;
      for (const wx of [b.x + 14, b.x + b.w - 32]) {
        ctx.fillStyle = nightGlow ? '#ffe9a8' : '#bcd9e8';
        if (nightGlow) {
          ctx.save();
          ctx.shadowColor = '#ffe9a8';
          ctx.shadowBlur = 14;
        }
        ctx.fillRect(wx, winY, 18, 18);
        if (nightGlow) ctx.restore();
        ctx.strokeStyle = 'rgba(60,45,30,0.7)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(wx, winY, 18, 18);
        ctx.beginPath();
        ctx.moveTo(wx + 9, winY);
        ctx.lineTo(wx + 9, winY + 18);
        ctx.moveTo(wx, winY + 9);
        ctx.lineTo(wx + 18, winY + 9);
        ctx.stroke();
        ctx.fillStyle = b.accent;
        ctx.fillRect(wx - 6, winY, 5, 18);
        ctx.fillRect(wx + 19, winY, 5, 18);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, b.x + b.w / 2, b.y - b.h * 0.3 - 30);

      if (interactTarget?.type === 'building' && interactTarget.id === b.id) {
        this._drawInteractRing(b.x + b.w / 2, b.y + b.h + 8, Math.max(b.w, b.h) * 0.6);
      }
    }
  }

  // Rough-plastered stone rather than a flat paint fill: a base tone,
  // scattered light/dark mottling, faint coursing lines, a dark foundation
  // strip, and exposed dark timber corner posts + a header beam under the
  // eave (Tudor-style framing), echoing the reference village's material feel.
  _drawStoneWall(b, tex) {
    const { ctx } = this;
    const wallY = b.y + b.h * 0.35;
    const wallH = b.h * 0.65;

    ctx.fillStyle = b.stone;
    ctx.fillRect(b.x, wallY, b.w, wallH);

    for (const s of tex.wallSpots) {
      ctx.fillStyle = s.dark ? 'rgba(70,60,50,0.18)' : 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.ellipse(b.x + s.fx * b.w, wallY + s.fy * wallH, s.r, s.r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(70,60,50,0.15)';
    ctx.lineWidth = 1;
    const rows = Math.max(2, Math.round(wallH / 14));
    for (let r = 1; r < rows; r++) {
      const ly = wallY + (wallH / rows) * r;
      ctx.beginPath();
      ctx.moveTo(b.x + 2, ly);
      ctx.lineTo(b.x + b.w - 2, ly);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(58,50,42,0.55)';
    ctx.fillRect(b.x, wallY + wallH - 5, b.w, 5);

    const postW = 7;
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(b.x + 1, wallY, postW, wallH);
    ctx.fillRect(b.x + b.w - 1 - postW, wallY, postW, wallH);
    ctx.fillRect(b.x, wallY, b.w, 5);
  }

  // A rounded, bundled thatch silhouette instead of a sharp painted
  // triangle: a solid "skirt" row hugging the eave (so it always meets the
  // wall with no gap) topped by a peaked hump row, then one darker depth
  // patch and one lighter ridge highlight layered on top -- the same
  // three-tone recipe the baked tree canopy uses, for a consistent
  // hand-made look. Finished with a few curved bundle-row strokes.
  _drawThatchRoof(b, tex) {
    const { ctx } = this;
    const eaveY = b.y + b.h * 0.4;
    const ridgeY = b.y - b.h * 0.3;
    const cx = b.x + b.w / 2;
    const halfW = b.w / 2 + 14;

    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(cx, eaveY + 3, halfW * 0.85, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = b.thatch;
    const skirtCount = Math.max(6, Math.round(b.w / 16));
    for (let i = 0; i <= skirtCount; i++) {
      const x = b.x - 12 + (i / skirtCount) * (b.w + 24);
      ctx.beginPath();
      ctx.arc(x, eaveY - 4, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    const bumps = tex.thatchBumps;
    const n = bumps.length;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = b.x - 6 + t * (b.w + 12);
      const heightFactor = Math.sin(t * Math.PI);
      const y = eaveY - 8 - heightFactor * (eaveY - 8 - ridgeY) + bumps[i] * 0.35;
      const r = 13 + heightFactor * 9 + Math.abs(bumps[i]) * 0.25;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = shade(b.thatch, -0.16);
    ctx.beginPath();
    ctx.ellipse(b.x + b.w * 0.24, eaveY - (eaveY - ridgeY) * 0.4, halfW * 0.34, halfW * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shade(b.thatch, 0.15);
    ctx.beginPath();
    ctx.ellipse(cx + b.w * 0.06, ridgeY + 7, halfW * 0.28, halfW * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = shade(b.thatch, -0.22);
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    for (let row = 0; row < 3; row++) {
      const rowY = eaveY - 10 - row * 10;
      ctx.beginPath();
      ctx.moveTo(cx - halfW * 0.65, rowY);
      ctx.quadraticCurveTo(cx, rowY - 6, cx + halfW * 0.65, rowY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  _drawHotspots(propertyLevel, interactTarget) {
    const { ctx } = this;
    for (const h of HOTSPOTS) {
      if (h.id === 'property') {
        const tier = PROPERTY_LEVELS[propertyLevel];
        this._drawPropertyPlot(h.x, h.y, propertyLevel, tier);
      } else if (h.id === 'well') {
        ctx.fillStyle = '#8a8f96';
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, 26, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3d6b7a';
        ctx.beginPath();
        ctx.ellipse(h.x, h.y - 3, 18, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5c5148';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(h.x - 20, h.y - 20);
        ctx.lineTo(h.x - 20, h.y - 40);
        ctx.moveTo(h.x + 20, h.y - 20);
        ctx.lineTo(h.x + 20, h.y - 40);
        ctx.moveTo(h.x - 20, h.y - 40);
        ctx.lineTo(h.x + 20, h.y - 40);
        ctx.stroke();
      } else if (h.id === 'jobboard') {
        ctx.fillStyle = '#7a5432';
        ctx.fillRect(h.x - 4, h.y - 10, 8, 40);
        ctx.fillStyle = '#e8d9b5';
        ctx.fillRect(h.x - 22, h.y - 34, 44, 30);
        ctx.strokeStyle = '#5a3d24';
        ctx.lineWidth = 2;
        ctx.strokeRect(h.x - 22, h.y - 34, 44, 30);
      }
      if (interactTarget?.type === 'hotspot' && interactTarget.id === h.id) {
        this._drawInteractRing(h.x, h.y, h.radius * 0.7);
      }
    }
  }

  _drawPropertyPlot(x, y, level, tier) {
    const { ctx } = this;
    if (level === 0) {
      ctx.strokeStyle = 'rgba(120,90,50,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(x - 30, y - 22, 60, 44);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(120,90,50,0.5)';
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('For sale', x, y + 4);
      return;
    }
    const roofColors = ['#c9a34a', '#b8577a', '#4a8fb8'];
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y + 20, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d9b5';
    ctx.fillRect(x - 28, y - 6, 56, 26);
    ctx.fillStyle = roofColors[level - 1] || '#c9a34a';
    ctx.fillRect(x - 32, y - 20, 64, 16);
    if (level >= 2) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(tier.name, x, y - 26);
    }
  }

  _drawForageSpots(economy, dayCount, interactTarget) {
    const { ctx } = this;
    for (const f of FORAGE_SPOTS) {
      const ready = economy.canForage(f.id, dayCount);
      ctx.save();
      ctx.globalAlpha = ready ? 1 : 0.4;
      ctx.fillStyle = '#3f6b2e';
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ready ? '#e0672f' : '#7a7a6a';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(f.x - 12 + i * 8, f.y - 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (interactTarget?.type === 'forage' && interactTarget.id === f.id) {
        this._drawInteractRing(f.x, f.y, f.radius * 0.7);
      }
    }
  }

  _drawInteractRing(x, y, r) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,224,130,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawNpc(npc, interactTarget) {
    const { ctx } = this;
    const bob = npc.moving ? Math.sin(npc.bobT * 8) * 2 : Math.sin(npc.bobT * 2) * 1;
    ctx.save();
    ctx.translate(npc.x, npc.y + bob);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = npc.data.color;
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = npc.data.accent;
    ctx.beginPath();
    ctx.arc(0, -12, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2b2320';
    ctx.beginPath();
    ctx.arc(-3, -13, 1.6, 0, Math.PI * 2);
    ctx.arc(3, -13, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(npc.data.name, 0, -34);
    ctx.restore();

    if (interactTarget?.type === 'npc' && interactTarget.id === npc.id) {
      this._drawInteractRing(npc.x, npc.y + 4, 26);
    }
  }

  _drawPlayer(player) {
    const { ctx } = this;
    const bob = player.moving ? Math.sin(player.animT * 10) * 2 : 0;
    ctx.save();
    ctx.translate(player.x, player.y + bob);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a6fa5';
    ctx.beginPath();
    ctx.ellipse(0, 6, 13, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f0c9a0';
    ctx.beginPath();
    ctx.arc(0, -13, 11, 0, Math.PI * 2);
    ctx.fill();

    const dir = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[player.facing] || [0, 1];
    ctx.fillStyle = '#2b2320';
    ctx.beginPath();
    ctx.arc(dir[0] * 4 - 3, -14 + dir[1] * 2, 1.7, 0, Math.PI * 2);
    ctx.arc(dir[0] * 4 + 3, -14 + dir[1] * 2, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawRareFlourishGlow(flourish, camX, camY) {
    const { ctx, canvas } = this;
    const sx = flourish.x - camX;
    const sy = flourish.y - camY;
    const grad = ctx.createRadialGradient(sx, sy, 10, sx, sy, 260);
    grad.addColorStop(0, 'rgba(255,244,200,0.55)');
    grad.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}
