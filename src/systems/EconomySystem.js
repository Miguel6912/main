import { ITEMS } from '../data/shopItems.js';
import { pickJobForDay } from '../data/jobs.js';
import { FORAGE_SPOTS } from '../world/MapData.js';

const FORAGE_COOLDOWN_DAYS = 1;

// Coins, inventory, foraging, buy/sell, and the daily odd-job board. This is
// the "two meaningful ways to earn money" system: forage-and-sell, and the
// rotating job board. Both are pure data lookups against shopItems.js /
// jobs.js so new goods or job types don't require touching this file's logic.
export class EconomySystem {
  constructor(bus) {
    this.bus = bus;
    this.coins = 25;
    this.inventory = {};
    this.forageLastHarvestDay = {}; // spotId -> day
    this.forageUpgrade = false;
    this.dailyJob = null; // { ...template, accepted, completed }
    this.activeJob = null; // { ...template, acceptedDay }
  }

  addCoins(amount) {
    this.coins = Math.max(0, this.coins + amount);
    this.bus.emit('economy:coinsChanged', this.coins);
  }

  spendCoins(amount) {
    if (this.coins < amount) return false;
    this.addCoins(-amount);
    return true;
  }

  addItem(id, qty = 1) {
    this.inventory[id] = (this.inventory[id] || 0) + qty;
    this.bus.emit('economy:inventoryChanged', this.inventory);
  }

  hasItem(id, qty = 1) {
    return (this.inventory[id] || 0) >= qty;
  }

  removeItem(id, qty = 1) {
    if (!this.hasItem(id, qty)) return false;
    this.inventory[id] -= qty;
    if (this.inventory[id] <= 0) delete this.inventory[id];
    this.bus.emit('economy:inventoryChanged', this.inventory);
    return true;
  }

  // --- Foraging ---
  canForage(spotId, currentDay) {
    const last = this.forageLastHarvestDay[spotId];
    return last === undefined || currentDay - last >= FORAGE_COOLDOWN_DAYS;
  }

  forage(spotId, currentDay) {
    const spot = FORAGE_SPOTS.find((s) => s.id === spotId);
    if (!spot || !this.canForage(spotId, currentDay)) return null;
    this.forageLastHarvestDay[spotId] = currentDay;
    const qty = this.forageUpgrade ? 2 : 1;
    this.addItem(spot.item, qty);
    return { item: spot.item, qty };
  }

  // --- Shop ---
  buyItem(itemId) {
    const def = ITEMS[itemId];
    if (!def || !def.buyPrice) return { ok: false, reason: 'not-for-sale' };
    if (def.oneTime && itemId === 'forage_basket_upgrade' && this.forageUpgrade) {
      return { ok: false, reason: 'already-owned' };
    }
    if (!this.spendCoins(def.buyPrice)) return { ok: false, reason: 'cant-afford' };
    if (itemId === 'forage_basket_upgrade') {
      this.forageUpgrade = true;
    } else {
      this.addItem(itemId, 1);
    }
    return { ok: true };
  }

  sellItem(itemId, qty = 1) {
    const def = ITEMS[itemId];
    if (!def || !def.sellPrice) return { ok: false, reason: 'not-sellable' };
    if (!this.removeItem(itemId, qty)) return { ok: false, reason: 'not-enough' };
    this.addCoins(def.sellPrice * qty);
    return { ok: true, coins: def.sellPrice * qty };
  }

  // --- Daily job board ---
  rollDailyJob(rng) {
    // A job not turned in simply expires; any quest item stays in the
    // player's bag as a slightly odd souvenir (acceptable for Phase 1).
    this.activeJob = null;
    const template = pickJobForDay(rng);
    this.dailyJob = { ...template, accepted: false, completed: false };
    this.bus.emit('economy:newJob', this.dailyJob);
  }

  hasJobToOffer(npcId) {
    return !!this.dailyJob && this.dailyJob.giver === npcId && !this.dailyJob.accepted && !this.dailyJob.completed;
  }

  acceptJob() {
    if (!this.dailyJob || this.dailyJob.accepted) return null;
    this.dailyJob.accepted = true;
    this.activeJob = { ...this.dailyJob };
    if (this.activeJob.grantsItem) this.addItem(this.activeJob.grantsItem, 1);
    this.bus.emit('economy:jobAccepted', this.activeJob);
    return this.activeJob;
  }

  canTurnInJob(npcId) {
    if (!this.activeJob || this.activeJob.turnIn !== npcId) return false;
    if (this.activeJob.requiresItem) {
      return this.hasItem(this.activeJob.requiresItem, this.activeJob.requiresQty || 1);
    }
    return true;
  }

  turnInJob(npcId) {
    if (!this.canTurnInJob(npcId)) return null;
    const job = this.activeJob;
    if (job.requiresItem) this.removeItem(job.requiresItem, job.requiresQty || 1);
    if (job.grantsItem) this.removeItem(job.grantsItem, 1);
    this.addCoins(job.coinReward);
    if (this.dailyJob && this.dailyJob.id === job.id) this.dailyJob.completed = true;
    this.activeJob = null;
    this.bus.emit('economy:jobCompleted', job);
    return job;
  }

  serialize() {
    return {
      coins: this.coins,
      inventory: { ...this.inventory },
      forageLastHarvestDay: { ...this.forageLastHarvestDay },
      forageUpgrade: this.forageUpgrade,
      dailyJob: this.dailyJob,
      activeJob: this.activeJob,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.coins = data.coins ?? this.coins;
    this.inventory = { ...(data.inventory || {}) };
    this.forageLastHarvestDay = { ...(data.forageLastHarvestDay || {}) };
    this.forageUpgrade = !!data.forageUpgrade;
    this.dailyJob = data.dailyJob ?? null;
    this.activeJob = data.activeJob ?? null;
  }
}
