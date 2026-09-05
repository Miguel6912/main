import { EVENTS } from '../data/events.js';

const CHECK_INTERVAL_SECONDS = 15; // real seconds between roll attempts
const BASE_FIRE_CHANCE = 0.18; // chance an eligible event fires on a given check
const DEFAULT_WITNESS_RADIUS = 350;

// The random-event framework. Periodically rolls against whichever events
// in data/events.js are currently eligible (season/phase/cooldown), applies
// their effects unconditionally, then records the moment as either
// "witnessed" (player was close enough) or "missed" (assigned to an NPC as
// gossip the player can ask about later). Adding a new event of either kind
// requires zero changes here -- only a new entry in data/events.js.
export class EventSystem {
  constructor({ bus, rng, economy, memory, worldFlags, npcs }) {
    this.bus = bus;
    this.rng = rng;
    this.economy = economy;
    this.memory = memory;
    this.worldFlags = worldFlags;
    this.npcs = npcs;
    this.cooldowns = {}; // eventId -> day last fired
    this.witnessed = []; // journal of experienced events
    this.missedGossip = []; // { id, name, textMissed, npcId, day, shared }
    this._checkAccum = 0;
  }

  update(dt, { player, time }) {
    if (time.speed === 0) return;
    this._checkAccum += dt;
    if (this._checkAccum < CHECK_INTERVAL_SECONDS) return;
    this._checkAccum = 0;
    this._tryRoll(player, time);
  }

  _eligible(time) {
    return EVENTS.filter((e) => {
      if (e.seasons && !e.seasons.includes(time.season)) return false;
      if (e.phases && !e.phases.includes(time.phase)) return false;
      const lastFired = this.cooldowns[e.id];
      if (lastFired !== undefined && time.dayCount - lastFired < e.cooldownDays) return false;
      return true;
    });
  }

  _tryRoll(player, time) {
    const eligible = this._eligible(time);
    if (eligible.length === 0) return;
    if (!this.rng.chance(BASE_FIRE_CHANCE)) return;
    const event = this.rng.weightedPick(eligible);
    this._fire(event, player, time);
  }

  _fire(event, player, time) {
    this.cooldowns[event.id] = time.dayCount;

    let witnessed = true;
    if (event.location) {
      const dist = Math.hypot(player.x - event.location.x, player.y - event.location.y);
      witnessed = dist <= (event.witnessRadius || DEFAULT_WITNESS_RADIUS);
    }

    const effects = event.effects || {};
    if (effects.coins) this.economy.addCoins(effects.coins);
    if (effects.item) this.economy.addItem(effects.item.id, effects.item.qty);
    if (effects.worldFlag) this.worldFlags[effects.worldFlag] = true;
    if (effects.friendship) this.memory.addFriendship(effects.friendship.npc, effects.friendship.amount);

    if (witnessed) {
      const record = { id: event.id, name: event.name, day: time.dayCount, category: event.category, rareVisual: !!event.rareVisual, text: event.textWitnessed };
      this.witnessed.push(record);
      this.bus.emit('event:witnessed', { event, record, location: event.location });
    } else {
      const carrier = this.npcs.find((n) => n.id === 'tansy') || this.rng.pick(this.npcs);
      this.missedGossip.push({
        id: event.id,
        name: event.name,
        textMissed: event.textMissed,
        npcId: carrier ? carrier.id : null,
        day: time.dayCount,
        shared: false,
      });
      this.bus.emit('event:missed', { event });
    }
  }

  claimGossipFor(npcId) {
    const entry = this.missedGossip.find((g) => g.npcId === npcId && !g.shared);
    if (entry) entry.shared = true;
    return entry || null;
  }

  serialize() {
    return {
      cooldowns: { ...this.cooldowns },
      witnessed: [...this.witnessed],
      missedGossip: [...this.missedGossip],
    };
  }

  deserialize(data) {
    if (!data) return;
    this.cooldowns = { ...(data.cooldowns || {}) };
    this.witnessed = [...(data.witnessed || [])];
    this.missedGossip = [...(data.missedGossip || [])];
  }
}
