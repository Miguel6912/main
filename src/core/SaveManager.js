// Save/load via localStorage. State shape is owned by main.js (it gathers
// serialize() output from each system); this module only knows about the
// envelope (version + timestamp) so we can add migrations later without
// touching every system.
const SAVE_KEY = 'cosyVillage.save.v1';
const SAVE_VERSION = 1;

export const SaveManager = {
  hasSave() {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  },

  save(state) {
    try {
      const payload = { version: SAVE_VERSION, savedAt: Date.now(), state };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.error('[SaveManager] save failed', err);
      return false;
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (payload.version !== SAVE_VERSION) {
        console.warn('[SaveManager] save version mismatch, loading best-effort');
      }
      return payload.state;
    } catch (err) {
      console.error('[SaveManager] load failed', err);
      return null;
    }
  },

  clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  },
};
