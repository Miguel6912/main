import { PROPERTY_LEVELS, getPropertyTier } from '../data/properties.js';

const MAX_ACCRUAL_DAYS = 14; // idle income cap so leaving the game open isn't exploitable

// The single property/business progression path. Buying moves level 0->1,
// then each further purchase upgrades in place. Income accrues passively
// per in-game day and is claimed by visiting the plot.
export class PropertySystem {
  constructor(bus) {
    this.bus = bus;
    this.level = 0;
    this.lastCollectDay = 0;
  }

  get tier() {
    return getPropertyTier(this.level);
  }

  get nextTier() {
    return this.level + 1 < PROPERTY_LEVELS.length ? PROPERTY_LEVELS[this.level + 1] : null;
  }

  pendingEarnings(currentDay) {
    if (this.level === 0) return 0;
    const days = Math.max(0, Math.min(MAX_ACCRUAL_DAYS, currentDay - this.lastCollectDay));
    return days * this.tier.incomePerDay;
  }

  buyOrUpgrade(economy, currentDay) {
    const next = this.nextTier;
    if (!next) return { ok: false, reason: 'max-level' };
    if (!economy.spendCoins(next.cost)) return { ok: false, reason: 'cant-afford' };
    this.level = next.level;
    this.lastCollectDay = currentDay;
    this.bus.emit('property:upgraded', { level: this.level });
    return { ok: true, level: this.level };
  }

  collect(economy, currentDay) {
    const amount = this.pendingEarnings(currentDay);
    if (amount > 0) economy.addCoins(amount);
    this.lastCollectDay = currentDay;
    return amount;
  }

  serialize() {
    return { level: this.level, lastCollectDay: this.lastCollectDay };
  }

  deserialize(data) {
    if (!data) return;
    this.level = data.level ?? 0;
    this.lastCollectDay = data.lastCollectDay ?? 0;
  }
}
