import { resolveCollision } from '../world/MapData.js';

const SPEED = 190; // px/s
const RADIUS = 16;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = RADIUS;
    this.facing = 'down';
    this.moving = false;
    this.animT = 0;
    this.name = 'Traveller';
  }

  update(dt, input) {
    let dx = 0;
    let dy = 0;
    if (input.isDown('left')) dx -= 1;
    if (input.isDown('right')) dx += 1;
    if (input.isDown('up')) dy -= 1;
    if (input.isDown('down')) dy += 1;

    this.moving = dx !== 0 || dy !== 0;

    if (this.moving) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? 'right' : 'left';
      else this.facing = dy > 0 ? 'down' : 'up';

      const nx = this.x + dx * SPEED * dt;
      const ny = this.y + dy * SPEED * dt;
      const resolved = resolveCollision(this.x, this.y, nx, ny, this.radius);
      this.x = resolved.x;
      this.y = resolved.y;
      this.animT += dt;
    } else {
      this.animT = 0;
    }
  }

  serialize() {
    return { x: this.x, y: this.y, facing: this.facing };
  }

  deserialize(data) {
    if (!data) return;
    this.x = data.x ?? this.x;
    this.y = data.y ?? this.y;
    this.facing = data.facing ?? this.facing;
  }
}
