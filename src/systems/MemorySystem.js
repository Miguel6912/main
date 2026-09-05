// Per-NPC memory: friendship level and small conversation flags (has this
// NPC met the player, have they already shared a particular story, etc).
// This is deliberately separate from world-level flags (saw_unicorn, etc)
// which live on the shared game state -- an NPC's memory of *you* is
// personal, the world's memory of *events* is global.

export class MemorySystem {
  constructor(npcIds) {
    this.records = new Map();
    for (const id of npcIds) {
      this.records.set(id, { friendship: 0, flags: {} });
    }
  }

  get(npcId) {
    if (!this.records.has(npcId)) this.records.set(npcId, { friendship: 0, flags: {} });
    return this.records.get(npcId);
  }

  addFriendship(npcId, amount) {
    const rec = this.get(npcId);
    rec.friendship = Math.max(0, Math.min(100, rec.friendship + amount));
    return rec.friendship;
  }

  setFlag(npcId, flag, value = true) {
    this.get(npcId).flags[flag] = value;
  }

  hasFlag(npcId, flag) {
    return !!this.get(npcId).flags[flag];
  }

  serialize() {
    const out = {};
    for (const [id, rec] of this.records.entries()) {
      out[id] = { friendship: rec.friendship, flags: { ...rec.flags } };
    }
    return out;
  }

  deserialize(data) {
    if (!data) return;
    for (const [id, rec] of Object.entries(data)) {
      this.records.set(id, { friendship: rec.friendship ?? 0, flags: { ...(rec.flags || {}) } });
    }
  }
}
