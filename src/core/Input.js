const KEYMAP = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
};

// Keyboard-only for Phase 1 (touch/gamepad are natural additions later --
// see DEVELOPMENT.md). Movement is polled via isDown(); interact/close are
// edge-triggered callbacks since they're one-shot actions.
export class Input {
  constructor() {
    this.pressed = new Set();
    this._interactHandler = null;
    this._closeHandler = null;
    this._anyKeyHandler = null;
    window.addEventListener('keydown', (e) => {
      this.pressed.add(e.code);
      if (e.code === 'KeyE') this._interactHandler?.();
      if (e.code === 'Escape') this._closeHandler?.();
      this._anyKeyHandler?.();
    });
    window.addEventListener('keyup', (e) => this.pressed.delete(e.code));
  }

  isDown(action) {
    return (KEYMAP[action] || []).some((code) => this.pressed.has(code));
  }

  onInteract(fn) {
    this._interactHandler = fn;
  }

  onClose(fn) {
    this._closeHandler = fn;
  }

  onAnyKey(fn) {
    this._anyKeyHandler = fn;
  }
}
