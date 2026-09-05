// Fixed-ish real-time loop. Game-time speed (pause/1x/2x/4x) is handled by
// TimeSystem, not here -- this loop always advances in real seconds so
// movement and animation never feel "sped up" by time controls.
export class GameLoop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this._raf = null;
    this._last = null;
    this.running = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    const tick = (now) => {
      if (!this.running) return;
      let dt = (now - this._last) / 1000;
      this._last = now;
      dt = Math.min(dt, 0.1); // clamp to avoid huge jumps after tab-switch
      this.update(dt);
      this.render();
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }
}
