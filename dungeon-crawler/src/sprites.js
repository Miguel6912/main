// All sprites are drawn in a normalized 0..1 unit square. Callers translate
// and scale the canvas context to a tile's on-screen box before invoking
// these, so every shape below is written in tile-relative coordinates.

function hashTile(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

function poly(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

function circle(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
}

// ---------------------------------------------------------------- terrain --

export function drawFloor(ctx, tx, ty) {
  const h = hashTile(tx, ty);
  ctx.fillStyle = '#3c3630';
  ctx.fillRect(0, 0, 1, 1);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.03;
  ctx.strokeRect(0.02, 0.02, 0.96, 0.96);

  // A couple of hash-seeded hairline cracks so floor tiles aren't identical.
  const crackCount = h % 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 0.025;
  for (let i = 0; i < crackCount; i++) {
    const seed = (h >> (i * 5)) & 0xff;
    const sx = 0.15 + ((seed % 7) / 7) * 0.7;
    const sy = 0.15 + (((seed >> 3) % 7) / 7) * 0.7;
    const dx = ((seed % 2) - 0.5) * 0.3;
    const dy = (((seed >> 4) % 2) - 0.5) * 0.3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + dx, sy + dy);
    ctx.stroke();
  }

  // A few lighter speckles for texture.
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 4; i++) {
    const seed = (h >> (i * 3 + 2)) & 0xff;
    const px = ((seed % 10) + 0.5) / 10;
    const py = (((seed >> 4) % 10) + 0.5) / 10;
    ctx.fillRect(px, py, 0.03, 0.03);
  }
}

export function drawWall(ctx, tx, ty) {
  const h = hashTile(tx, ty);
  ctx.fillStyle = '#232232';
  ctx.fillRect(0, 0, 1, 1);

  // Brick courses.
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 0.035;
  ctx.beginPath();
  ctx.moveTo(0, 0.5);
  ctx.lineTo(1, 0.5);
  ctx.moveTo(((h % 5) / 10), 0);
  ctx.lineTo(((h % 5) / 10), 0.5);
  ctx.moveTo(0.5 + (((h >> 4) % 5) / 10), 0.5);
  ctx.lineTo(0.5 + (((h >> 4) % 5) / 10), 1);
  ctx.stroke();

  // Soft top-left bevel highlight for a little depth.
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, 0, 1, 0.06);
  ctx.fillRect(0, 0, 0.06, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0.94, 1, 0.06);
  ctx.fillRect(0.94, 0, 0.06, 1);

  // Roughly 1 in 9 wall tiles gets a wall-mounted torch for atmosphere.
  if (h % 9 === 0) {
    ctx.fillStyle = '#1a1a24';
    ctx.fillRect(0.44, 0.55, 0.12, 0.25);
    const flicker = 0.85 + ((h >> 8) % 10) / 40;
    const glow = ctx.createRadialGradient(0.5, 0.45, 0.02, 0.5, 0.45, 0.55 * flicker);
    glow.addColorStop(0, 'rgba(255,190,90,0.55)');
    glow.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-0.5, -0.5, 2, 2);
    poly(ctx, [[0.5, 0.2], [0.62, 0.42], [0.5, 0.58], [0.38, 0.42]]);
    ctx.fillStyle = '#ffb347';
    ctx.fill();
    poly(ctx, [[0.5, 0.3], [0.57, 0.44], [0.5, 0.54], [0.43, 0.44]]);
    ctx.fillStyle = '#fff1b8';
    ctx.fill();
  }
}

export function drawStairs(ctx) {
  ctx.fillStyle = '#0e0d12';
  ctx.fillRect(0, 0, 1, 1);

  // Steps recede toward a dark opening at the back, each tread a little
  // smaller, higher, and darker than the one in front of it.
  const steps = 4;
  for (let i = steps - 1; i >= 0; i--) {
    const treadW = 0.86 - i * 0.16;
    const treadX = 0.5 - treadW / 2;
    const treadY = 0.82 - i * 0.15;
    const shade = 78 - i * 14;
    ctx.fillStyle = `rgb(${shade + 30},${shade + 18},${shade})`;
    ctx.fillRect(treadX, treadY, treadW, 0.09);
    ctx.fillStyle = `rgba(0,0,0,${0.35 + i * 0.08})`;
    ctx.fillRect(treadX, treadY + 0.09, treadW, 0.06);
  }

  const glow = ctx.createRadialGradient(0.5, 0.34, 0.02, 0.5, 0.34, 0.42);
  glow.addColorStop(0, 'rgba(255,220,120,0.4)');
  glow.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1, 1);
}

// ---------------------------------------------------------------- actors ---

export function drawPlayer(ctx) {
  ctx.fillStyle = '#1c1c26';
  circle(ctx, 0.5, 0.86, 0.14);
  ctx.fill();

  // Cloak.
  poly(ctx, [[0.28, 0.95], [0.3, 0.5], [0.5, 0.4], [0.7, 0.5], [0.72, 0.95]]);
  ctx.fillStyle = '#2f6f8f';
  ctx.fill();
  ctx.strokeStyle = '#193c4d';
  ctx.lineWidth = 0.03;
  ctx.stroke();

  // Sword.
  ctx.save();
  ctx.translate(0.78, 0.55);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#c9cbd6';
  ctx.fillRect(-0.03, -0.32, 0.06, 0.34);
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(-0.06, 0.0, 0.12, 0.06);
  ctx.restore();

  // Head.
  circle(ctx, 0.5, 0.38, 0.2);
  ctx.fillStyle = '#e8b98a';
  ctx.fill();
  poly(ctx, [[0.3, 0.3], [0.5, 0.16], [0.7, 0.3], [0.7, 0.36], [0.3, 0.36]]);
  ctx.fillStyle = '#5a3a24';
  ctx.fill();

  ctx.fillStyle = '#20202a';
  circle(ctx, 0.42, 0.4, 0.028);
  ctx.fill();
  circle(ctx, 0.58, 0.4, 0.028);
  ctx.fill();
}

function creatureBase(ctx, { bodyColor, outline }) {
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.03;
  ctx.fillStyle = bodyColor;
}

export function drawRat(ctx) {
  creatureBase(ctx, { bodyColor: '#8a6a4a', outline: '#4a3220' });
  ctx.save();
  ctx.translate(0.5, 0.62);
  ctx.scale(1, 0.7);
  circle(ctx, 0, 0, 0.32);
  ctx.restore();
  ctx.fill();
  ctx.stroke();

  circle(ctx, 0.72, 0.58, 0.16);
  ctx.fill();
  ctx.stroke();

  poly(ctx, [[0.62, 0.42], [0.68, 0.28], [0.74, 0.42]]);
  ctx.fillStyle = '#8a6a4a';
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#4a3220';
  ctx.lineWidth = 0.025;
  ctx.beginPath();
  ctx.moveTo(0.2, 0.6);
  ctx.quadraticCurveTo(0.02, 0.7, 0.08, 0.9);
  ctx.stroke();

  ctx.fillStyle = '#d24040';
  circle(ctx, 0.78, 0.56, 0.025);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 0.012;
  ctx.beginPath();
  ctx.moveTo(0.82, 0.58);
  ctx.lineTo(0.94, 0.55);
  ctx.moveTo(0.82, 0.62);
  ctx.lineTo(0.94, 0.64);
  ctx.stroke();
}

export function drawGoblin(ctx) {
  creatureBase(ctx, { bodyColor: '#4f8f4f', outline: '#22421f' });
  poly(ctx, [[0.32, 0.92], [0.3, 0.55], [0.7, 0.55], [0.68, 0.92]]);
  ctx.fill();
  ctx.stroke();

  circle(ctx, 0.5, 0.42, 0.24);
  ctx.fillStyle = '#5aa25a';
  ctx.fill();
  ctx.stroke();

  poly(ctx, [[0.28, 0.4], [0.14, 0.28], [0.3, 0.5]]);
  ctx.fillStyle = '#4f8f4f';
  ctx.fill();
  ctx.stroke();
  poly(ctx, [[0.72, 0.4], [0.86, 0.28], [0.7, 0.5]]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f4e04d';
  circle(ctx, 0.42, 0.42, 0.035);
  ctx.fill();
  circle(ctx, 0.58, 0.42, 0.035);
  ctx.fill();

  poly(ctx, [[0.44, 0.54], [0.5, 0.6], [0.56, 0.54]]);
  ctx.fillStyle = '#22421f';
  ctx.fill();

  ctx.save();
  ctx.translate(0.78, 0.65);
  ctx.rotate(-0.6);
  ctx.fillStyle = '#9a9aa6';
  ctx.fillRect(-0.02, -0.22, 0.05, 0.24);
  ctx.fillStyle = '#5a4324';
  ctx.fillRect(-0.045, 0, 0.09, 0.05);
  ctx.restore();
}

export function drawOrc(ctx) {
  creatureBase(ctx, { bodyColor: '#7a3b2e', outline: '#3a1a12' });
  poly(ctx, [[0.22, 0.94], [0.2, 0.5], [0.5, 0.4], [0.8, 0.5], [0.78, 0.94]]);
  ctx.fill();
  ctx.stroke();

  circle(ctx, 0.5, 0.34, 0.22);
  ctx.fillStyle = '#8a4b3a';
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#3a1a12';
  ctx.fillRect(0.32, 0.26, 0.36, 0.07);

  ctx.fillStyle = '#d24040';
  circle(ctx, 0.42, 0.36, 0.03);
  ctx.fill();
  circle(ctx, 0.58, 0.36, 0.03);
  ctx.fill();

  poly(ctx, [[0.4, 0.46], [0.36, 0.56], [0.44, 0.5]]);
  ctx.fillStyle = '#f0ead0';
  ctx.fill();
  poly(ctx, [[0.6, 0.46], [0.64, 0.56], [0.56, 0.5]]);
  ctx.fill();

  ctx.save();
  ctx.translate(0.85, 0.7);
  ctx.rotate(-0.3);
  ctx.fillStyle = '#5a4324';
  ctx.fillRect(-0.03, -0.3, 0.07, 0.32);
  ctx.fillStyle = '#6a5238';
  circle(ctx, 0, -0.34, 0.09);
  ctx.fill();
  ctx.restore();
}

export function drawTroll(ctx) {
  creatureBase(ctx, { bodyColor: '#6a5a78', outline: '#332a3c' });
  poly(ctx, [
    [0.16, 0.94], [0.14, 0.6], [0.24, 0.4], [0.4, 0.3], [0.6, 0.3],
    [0.76, 0.4], [0.86, 0.6], [0.84, 0.94],
  ]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  circle(ctx, 0.34, 0.6, 0.06);
  ctx.fill();
  circle(ctx, 0.62, 0.72, 0.07);
  ctx.fill();
  circle(ctx, 0.5, 0.5, 0.05);
  ctx.fill();

  circle(ctx, 0.5, 0.28, 0.14);
  ctx.fillStyle = '#7a6a88';
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#20202a';
  circle(ctx, 0.44, 0.27, 0.02);
  ctx.fill();
  circle(ctx, 0.56, 0.27, 0.02);
  ctx.fill();

  ctx.fillStyle = '#4a3f56';
  circle(ctx, 0.16, 0.9, 0.09);
  ctx.fill();
  ctx.stroke();
  circle(ctx, 0.84, 0.9, 0.09);
  ctx.fill();
  ctx.stroke();
}

export function drawMonster(ctx, type) {
  if (type === 'rat') return drawRat(ctx);
  if (type === 'goblin') return drawGoblin(ctx);
  if (type === 'orc') return drawOrc(ctx);
  return drawTroll(ctx);
}

// ----------------------------------------------------------------- items ---

export function drawGold(ctx) {
  const coins = [
    [0.38, 0.66, 0.16],
    [0.6, 0.62, 0.15],
    [0.5, 0.42, 0.16],
  ];
  for (const [cx, cy, r] of coins) {
    circle(ctx, cx, cy, r);
    ctx.fillStyle = '#c8981f';
    ctx.fill();
    circle(ctx, cx, cy, r * 0.72);
    ctx.fillStyle = '#f4d35e';
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 0.02;
  ctx.beginPath();
  ctx.moveTo(0.42, 0.32);
  ctx.lineTo(0.42, 0.4);
  ctx.moveTo(0.38, 0.36);
  ctx.lineTo(0.46, 0.36);
  ctx.stroke();
}

export function drawPotion(ctx) {
  ctx.fillStyle = '#5a4324';
  ctx.fillRect(0.44, 0.16, 0.12, 0.12);

  poly(ctx, [
    [0.42, 0.3], [0.58, 0.3], [0.68, 0.5], [0.68, 0.82],
    [0.6, 0.92], [0.4, 0.92], [0.32, 0.82], [0.32, 0.5],
  ]);
  ctx.fillStyle = 'rgba(230,180,210,0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(230,180,210,0.7)';
  ctx.lineWidth = 0.025;
  ctx.stroke();

  poly(ctx, [
    [0.34, 0.55], [0.66, 0.55], [0.66, 0.82], [0.6, 0.9], [0.4, 0.9], [0.34, 0.82],
  ]);
  ctx.fillStyle = '#ef6f9e';
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  circle(ctx, 0.44, 0.68, 0.03);
  ctx.fill();
  circle(ctx, 0.5, 0.6, 0.02);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(0.36, 0.36, 0.05, 0.4);
}
