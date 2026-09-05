// Lightweight ambient + burst particle system. Ambient particles (falling
// leaves, snow, fireflies, blossom petals) are chosen purely from season +
// time-of-day, so a new season variant is a config entry away. Burst
// particles are used for one-off flourishes like the rare magical events.

const AMBIENT_CONFIG = {
  spring: { day: { type: 'petal', rate: 4, colors: ['#f6c6db', '#fbe1ec'] } },
  summer: { night: { type: 'firefly', rate: 3, colors: ['#f6e58d', '#ffe6a0'] } },
  autumn: { day: { type: 'leaf', rate: 5, colors: ['#d97b2e', '#b5451f', '#e0a13a'] }, dusk: { type: 'leaf', rate: 3, colors: ['#d97b2e', '#b5451f'] } },
  winter: { day: { type: 'snow', rate: 6, colors: ['#ffffff'] }, dawn: { type: 'snow', rate: 6, colors: ['#ffffff'] }, dusk: { type: 'snow', rate: 6, colors: ['#ffffff'] }, night: { type: 'snow', rate: 4, colors: ['#e8eef2'] } },
};

export class ParticleSystem {
  constructor(rng) {
    this.rng = rng;
    this.particles = [];
  }

  _ambientConfigFor(season, phase) {
    return AMBIENT_CONFIG[season]?.[phase] || null;
  }

  updateAmbient(dt, view, season, phase) {
    const cfg = this._ambientConfigFor(season, phase);
    if (cfg && this.rng.chance(cfg.rate * dt)) {
      this._spawnAmbient(cfg, view);
    }
  }

  _spawnAmbient(cfg, view) {
    const color = this.rng.pick(cfg.colors);
    const x = view.x + this.rng.range(-40, view.w + 40);
    if (cfg.type === 'firefly') {
      this.particles.push({
        type: 'firefly', x, y: view.y + this.rng.range(0, view.h),
        vx: this.rng.range(-8, 8), vy: this.rng.range(-8, 8),
        life: 0, maxLife: this.rng.range(4, 8), size: this.rng.range(2, 3.5), color, blink: this.rng.range(0, Math.PI * 2),
      });
      return;
    }
    // falling types spawn above the view and drift down through it
    this.particles.push({
      type: cfg.type, x, y: view.y - 30,
      vx: this.rng.range(-15, 15), vy: this.rng.range(20, 45),
      life: 0, maxLife: this.rng.range(4, 7), size: this.rng.range(3, 6), color,
      spin: this.rng.range(-2, 2), angle: this.rng.range(0, Math.PI * 2),
    });
  }

  burst(x, y, { color = '#fff2c0', count = 24, speed = 60 } = {}) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + this.rng.range(-0.2, 0.2);
      const spd = this.rng.range(speed * 0.4, speed);
      this.particles.push({
        type: 'sparkle', x, y,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
        life: 0, maxLife: this.rng.range(0.8, 1.6), size: this.rng.range(2, 4), color,
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.life += dt;
      if (p.type === 'firefly') {
        p.blink += dt * 3;
        p.vx += this.rng.range(-6, 6) * dt;
        p.vy += this.rng.range(-6, 6) * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.angle !== undefined) p.angle += (p.spin || 0) * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
  }

  draw(ctx) {
    for (const p of this.particles) {
      const lifeFrac = p.life / p.maxLife;
      let alpha = 1;
      if (p.type === 'sparkle') alpha = 1 - lifeFrac;
      else if (p.type === 'firefly') alpha = 0.4 + 0.6 * Math.abs(Math.sin(p.blink));
      else alpha = lifeFrac < 0.1 ? lifeFrac / 0.1 : lifeFrac > 0.85 ? (1 - lifeFrac) / 0.15 : 1;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;
      if (p.type === 'firefly' || p.type === 'sparkle') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.type === 'sparkle' ? 8 : 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
