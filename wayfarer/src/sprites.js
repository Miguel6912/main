// All draw* functions here assume the canvas context is already translated
// to the entity/prop's world position; shapes are written in local pixel
// coordinates relative to that origin (top-left, unless noted).

export const PALETTES = {
  forest: {
    skyTop: '#bfe8ff', skyBottom: '#eaf9d8',
    farHill: '#9fc98a', ground: '#3f5f2e', groundTop: '#5fa23f',
    accent: '#2a3f1f',
  },
  graveyard: {
    skyTop: '#3c3a56', skyBottom: '#7a6a86',
    farHill: '#4a4258', ground: '#463f38', groundTop: '#5b5248',
    accent: '#241f1c',
  },
  castle: {
    skyTop: '#232338', skyBottom: '#5c5a72',
    farHill: '#3a3a4c', ground: '#54545f', groundTop: '#75757f',
    accent: '#28282f',
  },
};

function poly(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

function circle(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
}

// --------------------------------------------------------------- terrain --

export function drawSky(ctx, biome, width, height) {
  const pal = PALETTES[biome];
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, pal.skyTop);
  grad.addColorStop(1, pal.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

export function drawFarHill(ctx, biome, screenX, groundScreenY, width) {
  const pal = PALETTES[biome];
  ctx.fillStyle = pal.farHill;
  ctx.globalAlpha = 0.55;
  poly(ctx, [
    [screenX - 40, groundScreenY],
    [screenX + width * 0.3, groundScreenY - 70],
    [screenX + width * 0.7, groundScreenY - 40],
    [screenX + width + 40, groundScreenY],
  ]);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawGround(ctx, biome, screenX0, screenX1, groundY, bottomY) {
  const pal = PALETTES[biome];
  ctx.fillStyle = pal.ground;
  ctx.fillRect(screenX0, groundY, screenX1 - screenX0, bottomY - groundY);
  ctx.fillStyle = pal.groundTop;
  ctx.fillRect(screenX0, groundY, screenX1 - screenX0, 10);
  ctx.fillStyle = pal.accent;
  ctx.globalAlpha = 0.5;
  for (let x = screenX0 + 12; x < screenX1 - 6; x += 34) {
    ctx.fillRect(x, groundY + 16, 3, 3);
    ctx.fillRect(x + 14, groundY + 30, 3, 3);
  }
  ctx.globalAlpha = 1;
}

export function drawPlatform(ctx, biome, screenX0, screenX1, y) {
  const pal = PALETTES[biome];
  ctx.fillStyle = pal.accent;
  ctx.fillRect(screenX0, y, screenX1 - screenX0, 16);
  ctx.fillStyle = pal.groundTop;
  ctx.fillRect(screenX0, y, screenX1 - screenX0, 5);
}

export function drawHazard(ctx, screenX0, screenX1, groundY) {
  const w = screenX1 - screenX0;
  const spikeW = 12;
  ctx.fillStyle = '#c9c9d4';
  for (let x = screenX0; x < screenX1; x += spikeW) {
    poly(ctx, [[x, groundY], [x + spikeW / 2, groundY - 18], [Math.min(x + spikeW, screenX1), groundY]]);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillRect(screenX0 - 2, groundY - 2, w + 4, 4);
  ctx.fillStyle = '#6a6a76';
  ctx.fillRect(screenX0 - 2, groundY - 2, w + 4, 4);
}

const DECOR_COLORS = {
  tree: '#2d5a24', bush: '#3f7a34', rock: '#7a7a72',
  gravestone: '#9a9aa2', deadtree: '#3a332c', crypt: '#6a6a72',
  pillar: '#82828c', banner: '#8a2f38', rubble: '#5a5a62',
};

export function drawDecoration(ctx, type, flip, scale) {
  ctx.save();
  ctx.scale(flip ? -scale : scale, scale);
  ctx.fillStyle = DECOR_COLORS[type] || '#555';

  if (type === 'tree') {
    ctx.fillStyle = '#5a3a24';
    ctx.fillRect(-4, -60, 8, 60);
    ctx.fillStyle = '#2d5a24';
    circle(ctx, 0, -78, 30);
    ctx.fill();
    circle(ctx, -16, -60, 20);
    ctx.fill();
    circle(ctx, 16, -60, 20);
    ctx.fill();
  } else if (type === 'bush') {
    ctx.fillStyle = '#3f7a34';
    circle(ctx, -10, -14, 14);
    ctx.fill();
    circle(ctx, 10, -14, 14);
    ctx.fill();
    circle(ctx, 0, -20, 16);
    ctx.fill();
  } else if (type === 'rock') {
    poly(ctx, [[-18, 0], [-14, -18], [10, -22], [20, -6], [14, 0]]);
    ctx.fill();
  } else if (type === 'gravestone') {
    ctx.fillStyle = '#9a9aa2';
    ctx.fillRect(-14, -40, 28, 40);
    circle(ctx, 0, -40, 14);
    ctx.fill();
    ctx.strokeStyle = '#6a6a72';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(0, -12);
    ctx.moveTo(-8, -20);
    ctx.lineTo(8, -20);
    ctx.stroke();
  } else if (type === 'deadtree') {
    ctx.strokeStyle = '#3a332c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -50);
    ctx.moveTo(0, -30);
    ctx.lineTo(-20, -55);
    ctx.moveTo(0, -40);
    ctx.lineTo(18, -62);
    ctx.moveTo(0, -50);
    ctx.lineTo(-14, -70);
    ctx.stroke();
  } else if (type === 'crypt') {
    ctx.fillStyle = '#6a6a72';
    ctx.fillRect(-26, -34, 52, 34);
    poly(ctx, [[-30, -34], [0, -54], [30, -34]]);
    ctx.fill();
    ctx.fillStyle = '#2c2820';
    ctx.fillRect(-8, -22, 16, 22);
  } else if (type === 'pillar') {
    ctx.fillStyle = '#82828c';
    ctx.fillRect(-14, -90, 28, 90);
    ctx.fillStyle = '#9a9aa4';
    ctx.fillRect(-18, -96, 36, 10);
    ctx.fillRect(-18, -4, 36, 10);
  } else if (type === 'banner') {
    ctx.fillStyle = '#3a3a44';
    ctx.fillRect(-2, -90, 4, 90);
    ctx.fillStyle = '#8a2f38';
    poly(ctx, [[2, -86], [26, -86], [26, -30], [14, -40], [2, -30]]);
    ctx.fill();
  } else if (type === 'rubble') {
    ctx.fillStyle = '#5a5a62';
    poly(ctx, [[-20, 0], [-10, -16], [6, -10], [18, 0]]);
    ctx.fill();
    poly(ctx, [[4, 0], [12, -20], [24, -6], [22, 0]]);
    ctx.fill();
  }
  ctx.restore();
}

export function drawForge(ctx, glow) {
  // A small blacksmith's house behind the anvil, so the forge reads as a
  // place rather than just a floating prop.
  ctx.save();
  ctx.translate(-22, 0);
  ctx.fillStyle = '#4a3a2c';
  ctx.fillRect(-38, -58, 76, 58);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(-38, -58, 76, 8);
  ctx.fillStyle = '#6a3a2c';
  poly(ctx, [[-46, -58], [0, -92], [46, -58]]);
  ctx.fill();
  ctx.strokeStyle = '#2a1c14';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#2a1c14';
  ctx.fillRect(-11, -34, 20, 34);
  const winFlicker = 0.75 + Math.sin(glow * 5) * 0.2;
  ctx.fillStyle = `rgba(255,180,80,${0.55 * winFlicker})`;
  ctx.fillRect(14, -44, 13, 13);
  ctx.strokeStyle = '#2a1c14';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, -44, 13, 13);
  ctx.fillStyle = '#5a4a3c';
  ctx.fillRect(25, -86, 10, 22);
  ctx.fillStyle = 'rgba(200,200,200,0.3)';
  circle(ctx, 30, -92 - Math.sin(glow * 2) * 4, 6);
  ctx.fill();
  circle(ctx, 34, -102 - Math.sin(glow * 2 + 1) * 4, 5);
  ctx.fill();
  ctx.restore();

  // Anvil, out front where the player interacts.
  ctx.save();
  ctx.translate(30, 0);
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(-15, -20, 30, 20);
  ctx.fillStyle = '#44444e';
  poly(ctx, [[-20, -20], [20, -20], [15, -31], [-15, -31]]);
  ctx.fill();
  ctx.fillStyle = '#54545e';
  ctx.fillRect(-19, -33, 38, 4);
  const flicker = 0.7 + Math.sin(glow * 6) * 0.15;
  const grad = ctx.createRadialGradient(0, -35, 2, 0, -35, 26 * flicker);
  grad.addColorStop(0, 'rgba(255,140,50,0.75)');
  grad.addColorStop(1, 'rgba(255,140,50,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(-40, -70, 80, 70);
  ctx.fillStyle = '#ff9c4a';
  circle(ctx, 0, -33, 5 * flicker);
  ctx.fill();
  ctx.restore();

  // The dwarf blacksmith, standing beside his anvil.
  ctx.save();
  ctx.translate(-3, 0);
  ctx.fillStyle = '#3a2c20';
  ctx.fillRect(-10, -13, 8, 13);
  ctx.fillRect(2, -13, 8, 13);
  ctx.fillStyle = '#7a4a2c';
  ctx.beginPath();
  ctx.roundRect(-14, -38, 28, 26, 4);
  ctx.fill();
  ctx.strokeStyle = '#4a2c18';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(-11, -30, 22, 16);
  ctx.fillStyle = '#7a4a2c';
  ctx.fillRect(-18, -35, 6, 18);
  ctx.fillRect(12, -35, 6, 18);
  circle(ctx, 0, -45, 11);
  ctx.fillStyle = '#e8b98a';
  ctx.fill();
  ctx.fillStyle = '#c9c9c9';
  poly(ctx, [[-9, -43], [9, -43], [7, -26], [0, -22], [-7, -26]]);
  ctx.fill();
  ctx.fillStyle = '#5a5a62';
  poly(ctx, [[-12, -51], [12, -51], [10, -55], [-10, -55]]);
  ctx.fill();
  ctx.fillRect(-13, -53, 26, 4);
  ctx.fillStyle = '#20202a';
  circle(ctx, -4, -46, 1.4);
  ctx.fill();
  circle(ctx, 4, -46, 1.4);
  ctx.fill();
  ctx.save();
  ctx.translate(17, -24);
  ctx.rotate(0.35);
  ctx.fillStyle = '#5a4324';
  ctx.fillRect(-2, -4, 4, 24);
  ctx.fillStyle = '#7a7a82';
  ctx.fillRect(-8, -13, 16, 10);
  ctx.restore();
  ctx.restore();
}

export function drawGate(ctx, height) {
  const grad = ctx.createLinearGradient(0, -height, 0, 0);
  grad.addColorStop(0, 'rgba(160,210,255,0.05)');
  grad.addColorStop(1, 'rgba(160,210,255,0.55)');
  ctx.fillStyle = grad;
  poly(ctx, [[-26, 0], [-26, -height + 30], [0, -height], [26, -height + 30], [26, 0]]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,230,255,0.85)';
  ctx.lineWidth = 4;
  ctx.stroke();
}

// ----------------------------------------------------------------- items --

export function drawGold(ctx) {
  ctx.fillStyle = '#c8981f';
  circle(ctx, 0, -8, 8);
  ctx.fill();
  ctx.fillStyle = '#f4d35e';
  circle(ctx, 0, -8, 5.5);
  ctx.fill();
}

export function drawScrap(ctx) {
  ctx.fillStyle = '#8a8a94';
  poly(ctx, [[-8, -2], [-4, -14], [6, -12], [9, -2], [2, 2]]);
  ctx.fill();
  ctx.strokeStyle = '#5a5a62';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawPotionPickup(ctx) {
  ctx.fillStyle = '#ef6f9e';
  ctx.beginPath();
  ctx.roundRect(-6, -18, 12, 16, 3);
  ctx.fill();
  ctx.fillStyle = '#5a4324';
  ctx.fillRect(-3, -22, 6, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(-3, -14, 2, 8);
}

export function drawGearPickup(ctx, kind) {
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 1.5;
  circle(ctx, 0, -12, 13);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,215,106,0.15)';
  ctx.fill();
  if (kind === 'weapon') {
    ctx.strokeStyle = '#e8e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(6, -20);
    ctx.stroke();
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(-9, -6, 6, 3);
  } else {
    ctx.fillStyle = '#8fb8e8';
    poly(ctx, [[-6, -20], [6, -20], [6, -6], [0, -2], [-6, -6]]);
    ctx.fill();
  }
}

export function drawProjectile(ctx, facing) {
  ctx.save();
  ctx.scale(facing, 1);
  ctx.strokeStyle = '#5a4324';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(8, 0);
  ctx.stroke();
  ctx.fillStyle = '#c9c9d4';
  poly(ctx, [[8, 0], [2, -4], [2, 4]]);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- actors --

// Reference height the fixed pixel offsets below were authored against —
// keep in sync with entities.js PLAYER_REFERENCE_HEIGHT.
const PLAYER_ART_REFERENCE_HEIGHT = 44;

export function drawPlayer(ctx, player, walkPhase) {
  const facing = player.facing;
  const bodyScale = player.h / PLAYER_ART_REFERENCE_HEIGHT;
  ctx.save();
  ctx.translate(player.x + player.w / 2, player.y + player.h);
  ctx.scale(facing * bodyScale, bodyScale);
  if (player.hitFlash > 0) ctx.globalAlpha = 0.6;
  if (player.invuln > 0) ctx.globalAlpha = Math.max(0.4, ctx.globalAlpha - 0.25 * (Math.sin(player.invuln * 30) * 0.5 + 0.5));

  const legSwing = player.onGround && Math.abs(player.vx) > 5 ? Math.sin(walkPhase * 10) * 6 : 0;
  ctx.strokeStyle = '#1c1c26';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-4, -18);
  ctx.lineTo(-4 - legSwing * 0.3, 0);
  ctx.moveTo(4, -18);
  ctx.lineTo(4 + legSwing * 0.3, 0);
  ctx.stroke();

  ctx.fillStyle = '#2f6f8f';
  ctx.beginPath();
  ctx.moveTo(-10, -18);
  ctx.lineTo(-11, -38);
  ctx.quadraticCurveTo(0, -46, 11, -38);
  ctx.lineTo(10, -18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#193c4d';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (player.swingFlash > 0) {
    ctx.strokeStyle = 'rgba(230,230,255,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(10, -26, player.weapon.range * 0.85, -0.9, 0.9);
    ctx.stroke();
  } else {
    ctx.save();
    ctx.translate(12, -30);
    ctx.rotate(-0.4);
    ctx.fillStyle = '#c9cbd6';
    ctx.fillRect(-2, -16, 4, 18);
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(-4, 0, 8, 4);
    ctx.restore();
  }

  circle(ctx, 0, -42, 10);
  ctx.fillStyle = '#e8b98a';
  ctx.fill();
  ctx.fillStyle = '#5a3a24';
  poly(ctx, [[-8, -46], [0, -54], [8, -46], [8, -42], [-8, -42]]);
  ctx.fill();
  ctx.fillStyle = '#20202a';
  circle(ctx, 4, -42, 1.6);
  ctx.fill();

  ctx.restore();
}

function drawBipedBase(ctx, w, h, bodyColor, outline, legColor) {
  const legSwing = 0;
  ctx.strokeStyle = legColor;
  ctx.lineWidth = Math.max(3, w * 0.18);
  ctx.beginPath();
  ctx.moveTo(-w * 0.15, -h * 0.25);
  ctx.lineTo(-w * 0.15 + legSwing, 0);
  ctx.moveTo(w * 0.15, -h * 0.25);
  ctx.lineTo(w * 0.15 - legSwing, 0);
  ctx.stroke();

  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.4, -h * 0.85, w * 0.8, h * 0.62, w * 0.2);
  ctx.fill();
  ctx.stroke();
}

// Windup duration enemies telegraph an attack for -- kept in sync with
// ENEMY_WINDUP in core/game.js so the warning ring's pulse timing reads
// as "about to land," not just decorative.
const ENEMY_WINDUP_REFERENCE = 0.35;

export function drawEnemy(ctx, enemy, walkPhase) {
  ctx.save();
  ctx.translate(enemy.x + enemy.w / 2, enemy.y + enemy.h);
  ctx.scale(enemy.dir >= 0 ? 1 : -1, 1);
  if (enemy.hitFlash > 0) ctx.globalAlpha = 0.55;

  const w = enemy.w;
  const h = enemy.h;
  const bob = enemy.state === 'chase' ? Math.sin(walkPhase * 9) * 2 : 0;
  ctx.translate(0, bob);

  if (enemy.windup > 0) {
    const urgency = 1 - enemy.windup / ENEMY_WINDUP_REFERENCE;
    const pulse = 0.5 + 0.5 * Math.sin(walkPhase * 26);
    ctx.save();
    ctx.scale(enemy.dir >= 0 ? 1 : -1, 1);
    ctx.strokeStyle = `rgba(255,70,60,${0.35 + 0.4 * urgency})`;
    ctx.lineWidth = 2.5;
    circle(ctx, 0, -h * 0.55, w * 0.55 + pulse * 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,90,70,0.9)';
    ctx.font = `bold ${Math.round(h * 0.36)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -h * 1.08);
    ctx.restore();
  }

  if (enemy.type === 'wolf') {
    ctx.fillStyle = '#6a6a72';
    ctx.strokeStyle = '#33333a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.4, w * 0.5, h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    circle(ctx, w * 0.42, -h * 0.5, h * 0.22);
    ctx.fill();
    ctx.stroke();
    poly(ctx, [[w * 0.3, -h * 0.68], [w * 0.4, -h * 0.85], [w * 0.5, -h * 0.66]]);
    ctx.fill();
    ctx.fillStyle = '#d24040';
    circle(ctx, w * 0.52, -h * 0.52, 2.5);
    ctx.fill();
  } else if (enemy.type === 'zombie') {
    drawBipedBase(ctx, w * 1.1, h, '#5a7a4a', '#2c3a22', '#243318');
    ctx.fillStyle = '#4a6a3e';
    circle(ctx, 0, -h * 0.92, w * 0.32);
    ctx.fill();
    ctx.fillStyle = '#d24040';
    circle(ctx, -w * 0.1, -h * 0.94, 2);
    ctx.fill();
    circle(ctx, w * 0.14, -h * 0.9, 2);
    ctx.fill();
  } else if (enemy.type === 'skeleton') {
    drawBipedBase(ctx, w, h, '#d8d4c4', '#8a8474', '#8a8474');
    ctx.fillStyle = '#e8e4d4';
    circle(ctx, 0, -h * 0.92, w * 0.3);
    ctx.fill();
    ctx.fillStyle = '#2a2620';
    circle(ctx, -w * 0.09, -h * 0.93, 2.4);
    ctx.fill();
    circle(ctx, w * 0.13, -h * 0.9, 2.4);
    ctx.fill();
  } else if (enemy.type === 'bandit') {
    drawBipedBase(ctx, w, h, '#7a4a3a', '#3a2018', '#2c1a12');
    ctx.fillStyle = '#c99b6a';
    circle(ctx, 0, -h * 0.9, w * 0.3);
    ctx.fill();
    ctx.fillStyle = '#3a2018';
    ctx.fillRect(-w * 0.32, -h * 1.02, w * 0.64, h * 0.16);
    ctx.save();
    ctx.translate(w * 0.4, -h * 0.55);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#9a9aa6';
    ctx.fillRect(-2, -14, 4, 16);
    ctx.restore();
  } else if (enemy.type === 'guard') {
    drawBipedBase(ctx, w * 1.05, h, '#8a8a96', '#40404a', '#33333c');
    ctx.fillStyle = '#a4a4b0';
    ctx.beginPath();
    ctx.roundRect(-w * 0.3, -h * 1.05, w * 0.6, h * 0.2, 4);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-w * 0.06, -h * 1.05, w * 0.12, h * 0.32);
    ctx.save();
    ctx.translate(w * 0.42, -h * 0.55);
    ctx.rotate(-0.3);
    ctx.fillStyle = '#5a4324';
    ctx.fillRect(-3, -18, 6, 20);
    ctx.fillStyle = '#7a6a5a';
    circle(ctx, 0, -20, 6);
    ctx.fill();
    ctx.restore();
  } else if (enemy.type === 'gargoyle') {
    ctx.fillStyle = '#6a5a78';
    ctx.strokeStyle = '#332a3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-w * 0.42, -h * 0.85, w * 0.84, h * 0.7, w * 0.22);
    ctx.fill();
    ctx.stroke();
    poly(ctx, [[-w * 0.3, -h * 0.82], [-w * 0.46, -h * 1.05], [-w * 0.14, -h * 0.86]]);
    ctx.fill();
    poly(ctx, [[w * 0.3, -h * 0.82], [w * 0.46, -h * 1.05], [w * 0.14, -h * 0.86]]);
    ctx.fill();
    circle(ctx, 0, -h * 0.85, w * 0.24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d24040';
    circle(ctx, -w * 0.06, -h * 0.86, 2.4);
    ctx.fill();
    circle(ctx, w * 0.1, -h * 0.86, 2.4);
    ctx.fill();
  }

  ctx.restore();
}

// -------------------------------------------------------------------- HUD --

// Compact always-on readout, drawn in fixed screen space (not affected by
// camera or shake) so HP/gold/scrap stay glanceable without looking away to
// the sidebar -- the sidebar keeps the fuller detail (gear names, log).
export function drawHUD(ctx, player) {
  const x = 14;
  const y = 14;
  const w = 156;
  const h = 60;

  ctx.save();
  ctx.fillStyle = 'rgba(10,10,16,0.6)';
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  const barX = x + 14;
  const barY = y + 13;
  const barW = w - 28;
  const barH = 10;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 5);
  ctx.fill();

  const hpFrac = Math.max(0, Math.min(1, player.hp / player.maxHp));
  if (hpFrac > 0) {
    const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    hpGrad.addColorStop(0, '#7a2020');
    hpGrad.addColorStop(1, '#d24040');
    ctx.fillStyle = hpGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * hpFrac, barH, 5);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 5);
  ctx.stroke();

  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.fillStyle = '#f0f0f5';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${Math.max(0, Math.round(player.hp))}/${player.maxHp}`, barX + barW, barY + barH + 11);

  ctx.save();
  ctx.translate(x + 22, y + 51);
  ctx.scale(0.8, 0.8);
  drawGold(ctx);
  ctx.restore();
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillStyle = '#f4d35e';
  ctx.textAlign = 'left';
  ctx.fillText(String(player.gold), x + 34, y + 54);

  ctx.save();
  ctx.translate(x + 98, y + 51);
  ctx.scale(0.8, 0.8);
  drawScrap(ctx);
  ctx.restore();
  ctx.fillStyle = '#c9c9d4';
  ctx.fillText(String(player.scrap), x + 108, y + 54);

  ctx.restore();
}
