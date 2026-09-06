import { ANIMAL_PROFILES } from '../data/animals.js';

// Wander AI shared by every ambient animal: idle for a bit, pick a random
// point within `radius` of home, walk to it, repeat. Deliberately simpler
// than NPC scheduling (no hours, no dialogue) since these are pure
// atmosphere -- see data/animals.js.
export class Animal {
  constructor(data, rng) {
    this.id = data.id;
    this.type = data.type;
    this.color = data.color;
    this.home = data.home;
    this.radius = data.radius;
    this.x = data.home.x;
    this.y = data.home.y;
    this.rng = rng;
    this.profile = ANIMAL_PROFILES[data.type] || ANIMAL_PROFILES.cat;
    this.state = 'idle';
    this.idleTimer = rng.range(0, 2);
    this.target = null;
    this.facing = 'down';
    this.moving = false;
    this.bobT = rng.range(0, Math.PI * 2);
  }

  _pickTarget() {
    const angle = this.rng.range(0, Math.PI * 2);
    const dist = this.rng.range(this.radius * 0.3, this.radius);
    this.target = { x: this.home.x + Math.cos(angle) * dist, y: this.home.y + Math.sin(angle) * dist };
  }

  update(dt) {
    this.bobT += dt;
    if (this.state === 'idle') {
      this.moving = false;
      this.idleTimer -= dt;
      if (this.idleTimer <= 0) {
        this._pickTarget();
        this.state = 'walking';
      }
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      this.state = 'idle';
      this.idleTimer = this.rng.range(this.profile.idleMin, this.profile.idleMax);
      this.moving = false;
      return;
    }
    const step = Math.min(dist, this.profile.speed * dt);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.moving = true;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  }
}
