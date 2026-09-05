// Minimal pub/sub used to decouple systems (time, events, economy, UI, audio)
// so new systems can listen in without the emitter knowing they exist.
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, handler) {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName).add(handler);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    this.listeners.get(eventName)?.delete(handler);
  }

  emit(eventName, payload) {
    this.listeners.get(eventName)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] listener for "${eventName}" threw`, err);
      }
    });
  }
}
