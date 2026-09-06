import { WORLD_WIDTH, WORLD_HEIGHT, BUILDINGS, RIVER, HOTSPOTS, FORAGE_SPOTS, OBSTACLES, FENCES, PROPS, ORCHARD, LAKE } from '../world/MapData.js';
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
  { x: 878, y: 380, w: 46, h: 1170 }, // well square spur, extended south to the orchard
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
    for (let i = 0; i < 320; i++) {
      const x = rng.range(1505, WORLD_WIDTH - 15);
      const y = rng.range(20, WORLD_HEIGHT - 20);
      if (!tooCloseToAny(x, y, [], 40)) {
        this.forestTrees.push({ x, y, scale: rng.range(0.9, 1.6), depth: rng.next() });
      }
    }
    this.grassPatches = [];
    for (let i = 0; i < 350; i++) {
      this.grassPatches.push({ x: rng.range(0, WORLD_WIDTH), y: rng.range(0, WORLD_HEIGHT), r: rng.range(8, 22) });
    }
    this.castleBushes = [
      { x: 90, y: 610 }, { x: 220, y: 620 }, { x: 150, y: 640 },
    ];

    this.orchardTrees = [];
    for (let i = 0; i < 26; i++) {
      const x = rng.range(ORCHARD.x + 20, ORCHARD.x + ORCHARD.w - 20);
      const y = rng.range(ORCHARD.y + 20, ORCHARD.y + ORCHARD.h - 20);
      if (!tooCloseToAny(x, y, [], 50)) {
        this.orchardTrees.push({ x, y, scale: rng.range(0.75, 1.0) });
      }
    }

    this.lakeReeds = [];
    for (let i = 0; i < 18; i++) {
      const edge = rng.pick(['top', 'bottom', 'left', 'right']);
      const pad = rng.range(-10, 6);
      let x, y;
      if (edge === 'top') { x = rng.range(LAKE.x, LAKE.x + LAKE.w); y = LAKE.y + pad; }
      else if (edge === 'bottom') { x = rng.range(LAKE.x, LAKE.x + LAKE.w); y = LAKE.y + LAKE.h - pad; }
      else if (edge === 'left') { x = LAKE.x + pad; y = rng.range(LAKE.y, LAKE.y + LAKE.h); }
      else { x = LAKE.x + LAKE.w - pad; y = rng.range(LAKE.y, LAKE.y + LAKE.h); }
      this.lakeReeds.push({ x, y, h: rng.range(10, 18) });
    }
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

    const castleRng = new RNG(133);
    this.castleMottles = [];
    for (let i = 0; i < 40; i++) {
      this.castleMottles.push({
        x: castleRng.range(62, 278), y: castleRng.range(302, 598),
        r: castleRng.range(4, 10), dark: castleRng.chance(0.5),
      });
    }
  }

  render(state) {
    const { player, npcs, animals, time, propertyLevel, particles, interactTarget, clockT } = state;
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
    this._drawLake(season);
    this._drawRoads();
    this._drawFences();
    this._drawForestBackdrop(season, 'back');
    this._drawOrchard(season);
    this._drawDecor(season);
    this._drawTree(HEART_TREE.x, HEART_TREE.y, HEART_TREE.scale, season);
    this._drawHotspots(propertyLevel, interactTarget, state.ciderStage);
    this._drawForageSpots(state.economy, time.dayCount, interactTarget);
    this._drawBuildings(time.phase, interactTarget);
    this._drawBuildingSigns();
    this._drawProps();

    const drawables = [
      ...npcs.map((n) => ({ type: 'npc', ref: n, y: n.y })),
      ...animals.map((a) => ({ type: 'animal', ref: a, y: a.y })),
      { type: 'player', ref: player, y: player.y },
    ];
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      if (d.type === 'npc') this._drawNpc(d.ref, interactTarget);
      else if (d.type === 'animal') this._drawAnimal(d.ref);
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
    for (const m of this.castleMottles) {
      ctx.fillStyle = m.dark ? 'rgba(50,54,62,0.18)' : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, m.r, m.r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
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

  // A still lake south of the village, drawn as a rounded rect matching its
  // (rectangular) collision bounds so the water's edge is never a step
  // away from where the player actually stops -- plus a few reeds around
  // the shore.
  _drawLake(season) {
    const { ctx } = this;
    const pal = SEASON_PALETTE[season];
    const r = 40;
    const { x, y, w, h } = LAKE;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    this._roundRectPath(x - 4, y + 6, w + 8, h, r);
    ctx.fill();
    ctx.fillStyle = pal.water;
    this._roundRectPath(x, y, w, h, r);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, y + h * 0.25, w * 0.22, h * 0.12, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3f6a3a';
    ctx.lineWidth = 3;
    for (const reed of this.lakeReeds) {
      ctx.beginPath();
      ctx.moveTo(reed.x, reed.y);
      ctx.lineTo(reed.x - 2, reed.y - reed.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(reed.x + 4, reed.y);
      ctx.lineTo(reed.x + 5, reed.y - reed.h * 0.7);
      ctx.stroke();
    }
  }

  _roundRectPath(x, y, w, h, r) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // The southern orchard: apple trees (the same baked tree sprite, with a
  // handful of small red/gold fruit dots layered on so it reads as an
  // orchard rather than a random tree cluster) around the apple forage
  // spots defined in MapData.js.
  _drawOrchard(season) {
    const fruity = season === 'summer' || season === 'autumn';
    for (const t of this.orchardTrees) {
      this._drawTree(t.x, t.y, t.scale, season);
      if (!fruity) continue;
      const { ctx } = this;
      const w = TREE_BASE_WIDTH * t.scale;
      ctx.fillStyle = season === 'autumn' ? '#c1503f' : '#8fae4a';
      const fruitPositions = [[-0.2, -0.75], [0.15, -0.65], [-0.05, -0.55], [0.25, -0.8]];
      for (const [fx, fy] of fruitPositions) {
        ctx.beginPath();
        ctx.arc(t.x + fx * w, t.y + fy * w, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
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

  // A wooden hanging sign beside each building's door -- a plain post,
  // an arm, and a board tinted with the building's accent colour -- for
  // the "little market street" character from the reference image.
  _drawBuildingSigns() {
    const { ctx } = this;
    for (const b of BUILDINGS) {
      const sx = b.x + b.w + 16;
      const sy = b.y + b.h * 0.62;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 34, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4a3220';
      ctx.fillRect(sx - 2, sy - 8, 4, 40);
      ctx.fillRect(sx - 2, sy - 8, 22, 4);

      ctx.save();
      ctx.translate(sx + 17, sy + 8);
      ctx.rotate(0.03);
      ctx.fillStyle = '#7a5432';
      ctx.fillRect(-9, 0, 18, 22);
      ctx.strokeStyle = b.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(-9, 0, 18, 22);
      ctx.restore();
    }
  }

  // Small clutter (flower pots, barrels) sitting on the ground at fixed
  // doorside spots -- see data/MapData.js PROPS. Purely decorative.
  _drawProps() {
    const { ctx } = this;
    for (const p of PROPS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 8, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      if (p.type === 'barrel') {
        ctx.fillStyle = '#8a6a42';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(58,42,28,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - 4, 8, 2.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 4, 8, 2.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'flowerpot') {
        ctx.fillStyle = '#a9754a';
        ctx.beginPath();
        ctx.moveTo(p.x - 7, p.y);
        ctx.lineTo(p.x + 7, p.y);
        ctx.lineTo(p.x + 5, p.y + 10);
        ctx.lineTo(p.x - 5, p.y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#4f8a3a';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - 2, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        const petalColors = ['#e58fb0', '#f0c94a', '#ffffff'];
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = petalColors[i];
          ctx.beginPath();
          ctx.arc(p.x - 5 + i * 5, p.y - 6, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // A simple picket-style fence: two rails plus evenly spaced posts along
  // each straight run in data/MapData.js FENCES.
  _drawFences() {
    const { ctx } = this;
    for (const f of FENCES) {
      const dx = f.x2 - f.x1;
      const dy = f.y2 - f.y1;
      const len = Math.hypot(dx, dy) || 1;

      ctx.strokeStyle = '#8a6a42';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(f.x1, f.y1 - 5);
      ctx.lineTo(f.x2, f.y2 - 5);
      ctx.moveTo(f.x1, f.y1 - 12);
      ctx.lineTo(f.x2, f.y2 - 12);
      ctx.stroke();

      const count = Math.max(1, Math.round(len / 22));
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const x = f.x1 + dx * t;
        const y = f.y1 + dy * t;
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(x, y + 2, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6b4a2e';
        ctx.fillRect(x - 2, y - 17, 4, 17);
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

  _drawHotspots(propertyLevel, interactTarget, ciderStage) {
    const { ctx } = this;
    for (const h of HOTSPOTS) {
      if (h.id === 'property') {
        const tier = PROPERTY_LEVELS[propertyLevel];
        this._drawPropertyPlot(h.x, h.y, propertyLevel, tier);
      } else if (h.id === 'well') {
        this._drawWell(h.x, h.y);
      } else if (h.id === 'cider_press') {
        this._drawCiderPress(h.x, h.y, ciderStage);
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

  // A wooden apple press with a stage-dependent flourish: nothing extra
  // while empty, a few rising bubbles while fermenting, three corked
  // bottles waiting alongside once ready.
  _drawCiderPress(x, y, stage) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y + 26, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a3220';
    ctx.fillRect(x - 26, y - 6, 6, 32);
    ctx.fillRect(x + 20, y - 6, 6, 32);
    ctx.fillRect(x - 28, y - 10, 56, 6);

    ctx.fillStyle = '#8a6a42';
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 20, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(58,42,28,0.6)';
    ctx.lineWidth = 2;
    for (const oy of [-4, 4, 12]) {
      ctx.beginPath();
      ctx.ellipse(x, y + 8 + oy, 20, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#5a3d24';
    ctx.fillRect(x - 3, y - 18, 6, 14);

    if (stage === 'fermenting') {
      ctx.fillStyle = 'rgba(230,200,120,0.8)';
      for (const [bx, by] of [[-6, -4], [4, -10], [0, -16]]) {
        ctx.beginPath();
        ctx.arc(x + bx, y + by, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (stage === 'ready') {
      for (let i = 0; i < 3; i++) {
        const bx = x + 32 + i * 12;
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(bx, y + 26, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c9a35a';
        ctx.beginPath();
        ctx.ellipse(bx, y + 16, 4.5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a3d24';
        ctx.fillRect(bx - 1.5, y + 8, 3, 4);
      }
    }
  }

  // A proper stone wishing-well: mottled stone ring, water, twin posts,
  // a small peaked thatch roof, and a bucket on a rope -- replacing the
  // old flat two-tone ellipse.
  _drawWell(x, y) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y + 20, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a9a293';
    ctx.beginPath();
    ctx.ellipse(x, y, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(70,60,50,0.2)';
    for (const [ox, oy, r] of [[-14, -4, 4], [11, 6, 3.5], [2, -9, 3], [-6, 9, 3.5]]) {
      ctx.beginPath();
      ctx.ellipse(x + ox, y + oy, r, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#3d6b7a';
    ctx.beginPath();
    ctx.ellipse(x, y - 3, 17, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(x - 4, y - 6, 6, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a3220';
    ctx.fillRect(x - 23, y - 46, 5, 28);
    ctx.fillRect(x + 18, y - 46, 5, 28);

    const roofColor = '#c9a35a';
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(x - 31, y - 42);
    ctx.lineTo(x, y - 58);
    ctx.lineTo(x + 31, y - 42);
    ctx.lineTo(x + 25, y - 40);
    ctx.lineTo(x, y - 53);
    ctx.lineTo(x - 25, y - 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(roofColor, -0.18);
    ctx.beginPath();
    ctx.moveTo(x, y - 58);
    ctx.lineTo(x + 31, y - 42);
    ctx.lineTo(x + 25, y - 40);
    ctx.lineTo(x, y - 53);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 40);
    ctx.lineTo(x, y - 15);
    ctx.stroke();
    ctx.fillStyle = '#6b4a2e';
    ctx.fillRect(x - 5, y - 17, 10, 8);
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
    const walkPhase = npc.bobT * 9;
    const bob = npc.moving ? Math.abs(Math.sin(walkPhase)) * 2 : Math.sin(npc.bobT * 2) * 1;
    const d = npc.data;
    this._drawCharacter({
      x: npc.x, y: npc.y, bob, scale: d.outfit === 'child' ? 0.8 : 1,
      bodyColor: d.color, accent: d.accent, hair: d.hair || '#5a3d2a',
      outfit: d.outfit || 'plain', label: d.name, facing: npc.facing,
      moving: npc.moving, walkPhase,
    });
    if (interactTarget?.type === 'npc' && interactTarget.id === npc.id) {
      this._drawInteractRing(npc.x, npc.y + 4, 26);
    }
  }

  _drawPlayer(player) {
    const walkPhase = player.animT * 11;
    const bob = player.moving ? Math.abs(Math.sin(walkPhase)) * 2 : 0;
    this._drawCharacter({
      x: player.x, y: player.y, bob, scale: 1,
      bodyColor: '#4a6fa5', accent: '#8a6a42', hair: '#6b4a2e',
      outfit: 'traveler', facing: player.facing,
      moving: player.moving, walkPhase,
    });
  }

  // Ambient wildlife. Quadrupeds (cat/dog/horse) trot with diagonal leg
  // pairs moving together (front-left+back-right, then front-right+
  // back-left) -- the real gait, not all four legs in lockstep. Birds hop
  // on two legs with a wing-flutter instead.
  _drawAnimal(animal) {
    const { ctx } = this;
    const walkPhase = animal.bobT * 10;
    const stride = animal.moving ? Math.sin(walkPhase) : 0;
    const facingLeft = animal.facing === 'left';
    const bob = animal.moving ? Math.abs(Math.sin(walkPhase)) * 1.6 : Math.sin(animal.bobT * 1.5) * 0.6;

    ctx.save();
    ctx.translate(animal.x, animal.y + bob);
    ctx.scale((facingLeft ? -1 : 1) * animal.profile.scale, animal.profile.scale);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (animal.type === 'bird') {
      this._drawBirdShape(animal.color, stride, animal.moving);
    } else {
      this._drawQuadrupedShape(animal.type, animal.color, stride);
    }

    ctx.restore();
  }

  _drawQuadrupedShape(type, color, stride) {
    const { ctx } = this;
    const isHorse = type === 'horse';
    const legShade = shade(color, -0.35);
    const legLen = isHorse ? 20 : 9;
    const bodyLen = isHorse ? 24 : 14;
    const bodyHeightRatio = isHorse ? 0.4 : 0.55;
    // Diagonal pairs: (front-left, back-right) share `stride`, the other
    // pair gets the opposite phase.
    const legs = [
      { x: -bodyLen * 0.55, phase: stride }, // back-left
      { x: -bodyLen * 0.55, phase: -stride, side: 1 }, // back-right
      { x: bodyLen * 0.5, phase: -stride }, // front-left
      { x: bodyLen * 0.5, phase: stride, side: 1 }, // front-right
    ];
    ctx.fillStyle = legShade;
    for (const leg of legs) {
      const lift = Math.max(0, leg.phase);
      ctx.beginPath();
      ctx.ellipse(leg.x + (leg.side ? 2 : -2), bodyLen * bodyHeightRatio - lift * 2, 2.6, legLen / 2 - lift * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyLen, bodyLen * bodyHeightRatio, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(color, -0.18);
    ctx.beginPath();
    ctx.ellipse(-bodyLen * 0.3, bodyLen * bodyHeightRatio * 0.35, bodyLen * 0.55, bodyLen * bodyHeightRatio * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isHorse) {
      const neckTopX = bodyLen * 0.72;
      const neckTopY = -bodyLen * 0.82;
      ctx.fillStyle = shade(color, -0.05);
      ctx.beginPath();
      ctx.moveTo(bodyLen * 0.55, -bodyLen * 0.1);
      ctx.quadraticCurveTo(bodyLen * 0.62, -bodyLen * 0.55, neckTopX, neckTopY);
      ctx.lineTo(neckTopX + 9, neckTopY + 4);
      ctx.quadraticCurveTo(bodyLen * 0.85, -bodyLen * 0.35, bodyLen * 0.92, -bodyLen * 0.05);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = shade(color, -0.4);
      ctx.beginPath();
      ctx.moveTo(bodyLen * 0.58, -bodyLen * 0.15);
      ctx.quadraticCurveTo(bodyLen * 0.6, -bodyLen * 0.55, neckTopX - 2, neckTopY + 2);
      ctx.lineTo(neckTopX + 4, neckTopY + 5);
      ctx.quadraticCurveTo(bodyLen * 0.72, -bodyLen * 0.4, bodyLen * 0.72, -bodyLen * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(neckTopX + 11, neckTopY + 6, 11, 5.5, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(neckTopX - 1, neckTopY - 5);
      ctx.lineTo(neckTopX + 4, neckTopY - 11);
      ctx.lineTo(neckTopX + 6, neckTopY - 3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = shade(color, -0.4);
      ctx.beginPath();
      ctx.ellipse(-bodyLen * 0.95, -bodyLen * 0.15, 3, 11, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(neckTopX - 1, neckTopY + 1, 2.2, 6, 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2b2320';
      ctx.beginPath();
      ctx.arc(neckTopX + 18, neckTopY + 4, 1.4, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // head/neck (cat/dog)
    const headX = bodyLen * 0.95;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(headX, -bodyLen * 0.25, bodyLen * 0.32, bodyLen * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(headX - 6, -bodyLen * 0.4);
      ctx.arc(headX - 6, -bodyLen * 0.4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(headX + 4, -bodyLen * 0.42);
      ctx.arc(headX + 4, -bodyLen * 0.42, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = type === 'dog' ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(-bodyLen * 0.9, -2);
      if (type === 'dog') ctx.quadraticCurveTo(-bodyLen * 1.2, -bodyLen * 0.3, -bodyLen * 1.05, -bodyLen * 0.55);
      else ctx.quadraticCurveTo(-bodyLen * 1.3, 2, -bodyLen * 1.1, -bodyLen * 0.35);
      ctx.stroke();
    }
    ctx.fillStyle = '#2b2320';
    ctx.beginPath();
    ctx.arc(headX + 3, -bodyLen * 0.28, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawBirdShape(color, stride, moving) {
    const { ctx } = this;
    ctx.fillStyle = shade(color, -0.3);
    const lift = moving ? Math.abs(stride) : 0;
    ctx.beginPath();
    ctx.ellipse(-1.5, 7 - lift, 1, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1.5, 7 - (moving ? Math.abs(Math.sin(stride + Math.PI)) : 0), 1, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const wingFlap = moving ? Math.abs(Math.sin(stride * 2)) * 0.6 : 0;
    ctx.fillStyle = shade(color, -0.2);
    ctx.beginPath();
    ctx.ellipse(-2, -1 - wingFlap * 4, 5, 3, -0.3 - wingFlap, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(7, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0a13a';
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.lineTo(14, -3);
    ctx.lineTo(10, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2b2320';
    ctx.beginPath();
    ctx.arc(8.5, -5, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shared layered character sprite: shadow, legs, a tunic-shaped body with
  // simple two-tone shading for volume (same shade() trick as the roofs),
  // an outfit-specific silhouette accessory, then head/hair/eyes. Every NPC
  // and the player run through this so a new look is a new `outfit` case,
  // not a new draw routine.
  _drawCharacter({ x, y, bob, scale = 1, bodyColor, accent, hair, outfit, label, facing = 'down', moving = false, walkPhase = 0 }) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs alternate (one lifts/shortens while the other plants/lengthens)
    // rather than moving in lockstep -- a real stride, not a shuffle.
    const stride = moving ? Math.sin(walkPhase) : 0;
    const legShade = shade(bodyColor, -0.4);
    ctx.fillStyle = legShade;
    ctx.beginPath();
    ctx.ellipse(-5, 13 - stride * 2, 4, 7 - Math.abs(stride) * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, 13 + stride * 2, 4, 7 - Math.abs(stride) * 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // tunic body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-7, -7);
    ctx.quadraticCurveTo(-14, 3, -13, 15);
    ctx.quadraticCurveTo(0, 20, 13, 15);
    ctx.quadraticCurveTo(14, 3, 7, -7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = shade(bodyColor, -0.2);
    ctx.beginPath();
    ctx.moveTo(2, -7);
    ctx.quadraticCurveTo(0, 4, 3, 15);
    ctx.quadraticCurveTo(9, 11, 13, 15);
    ctx.quadraticCurveTo(14, 3, 7, -7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = shade(bodyColor, 0.18);
    ctx.beginPath();
    ctx.ellipse(-6, -1, 3.5, 9, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Arms swing opposite their same-side leg (left arm forward with right
    // leg forward, and vice versa) -- the natural contralateral gait,
    // rather than both arms/legs on one side moving together. Drawn as
    // sleeves resting over the tunic's shoulders.
    ctx.fillStyle = shade(bodyColor, -0.08);
    ctx.beginPath();
    ctx.ellipse(-11, 1 + stride * 3, 3.2, 6.5, -stride * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(11, 1 - stride * 3, 3.2, 6.5, stride * 0.15, 0, Math.PI * 2);
    ctx.fill();

    this._drawOutfitDetail(outfit, accent, hair);

    // head
    const skin = '#f0c9a0';
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -15, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(skin, -0.12);
    ctx.beginPath();
    ctx.arc(4, -12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(-1, -15, 8.5, 0, Math.PI * 2);
    ctx.fill();

    this._drawHairOrHelmet(outfit, hair);

    const dir = { left: [-1, 0], right: [1, 0], up: [0, -0.6], down: [0, 0.6] }[facing] || [0, 0.6];
    ctx.fillStyle = '#2b2320';
    ctx.beginPath();
    ctx.arc(dir[0] * 3.5 - 3, -15 + dir[1] * 2, 1.5, 0, Math.PI * 2);
    ctx.arc(dir[0] * 3.5 + 3, -15 + dir[1] * 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (label) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + bob - 34 * scale);
    }
  }

  _drawOutfitDetail(outfit, accent, hair) {
    const { ctx } = this;
    switch (outfit) {
      case 'apron': // Mira: cream bib apron over the tunic
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(6, -4);
        ctx.lineTo(5, 15);
        ctx.lineTo(-5, 15);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(-9, -8);
        ctx.moveTo(6, -4);
        ctx.lineTo(9, -8);
        ctx.stroke();
        break;
      case 'barmaid': // Tansy: darker underskirt hem + a white collar
        ctx.fillStyle = shade(accent, -0.1);
        ctx.beginPath();
        ctx.moveTo(-11, 4);
        ctx.quadraticCurveTo(0, 10, 12, 4);
        ctx.quadraticCurveTo(13, 10, 12, 15);
        ctx.quadraticCurveTo(0, 19, -12, 15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fbf6e3';
        ctx.beginPath();
        ctx.ellipse(0, -6, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'vest': // Bramble: buttoned vest panel
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(-5, -6);
        ctx.lineTo(5, -6);
        ctx.lineTo(4, 13);
        ctx.lineTo(-4, 13);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (const by of [-1, 4, 9]) {
          ctx.beginPath();
          ctx.arc(0, by, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'armor': // Reginald: pauldrons + a chest strap
        ctx.fillStyle = shade(accent, -0.1);
        ctx.beginPath();
        ctx.arc(-11, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,60,30,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -6);
        ctx.lineTo(8, 12);
        ctx.stroke();
        break;
      case 'cloak': // Old Cobb: heavy hood/cloak overlapping the shoulders
        ctx.fillStyle = shade(accent, -0.15);
        ctx.beginPath();
        ctx.moveTo(-10, -9);
        ctx.quadraticCurveTo(-15, 2, -12, 15);
        ctx.lineTo(-6, 12);
        ctx.quadraticCurveTo(-9, 0, -4, -9);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, -9);
        ctx.quadraticCurveTo(15, 2, 12, 15);
        ctx.lineTo(6, 12);
        ctx.quadraticCurveTo(9, 0, 4, -9);
        ctx.closePath();
        ctx.fill();
        break;
      case 'child': // Wren: small pinafore triangle
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(5, -5);
        ctx.lineTo(3, 8);
        ctx.lineTo(-3, 8);
        ctx.closePath();
        ctx.fill();
        break;
      case 'traveler': // player: a satchel strap and small bag
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(9, 12);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.ellipse(9, 13, 5, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        break;
    }
  }

  _drawHairOrHelmet(outfit, hair) {
    const { ctx } = this;
    if (outfit === 'armor') {
      ctx.fillStyle = '#8f96a0';
      ctx.beginPath();
      ctx.arc(0, -18, 9.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-9.5, -18, 19, 4);
      ctx.fillStyle = shade('#8f96a0', -0.2);
      ctx.fillRect(-9.5, -14, 19, 2.5);
      return;
    }
    if (outfit === 'cloak') {
      ctx.fillStyle = shade(hair, -0.3);
      ctx.beginPath();
      ctx.arc(0, -19, 11, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
      // small beard
      ctx.fillStyle = shade(hair, -0.1);
      ctx.beginPath();
      ctx.moveTo(-4, -9);
      ctx.lineTo(4, -9);
      ctx.lineTo(0, -3);
      ctx.closePath();
      ctx.fill();
      return;
    }
    ctx.fillStyle = hair;
    if (outfit === 'child') {
      ctx.beginPath();
      ctx.arc(-9, -16, 3.5, 0, Math.PI * 2);
      ctx.arc(9, -16, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -22, 8, Math.PI, Math.PI * 2);
      ctx.fill();
    } else if (outfit === 'barmaid') {
      ctx.beginPath();
      ctx.arc(0, -22, 8.5, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(8, -14, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, -21, 9, Math.PI, Math.PI * 2);
      ctx.fill();
    }
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
