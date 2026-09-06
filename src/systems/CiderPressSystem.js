const REQUIRED_APPLES = 4;
const FERMENT_DAYS = 3;

// Quality is a weighted roll made at collection time -- a small bit of
// "did this batch turn out well" variance, expressed as bottle count
// rather than price, so it stays simple to reason about from the shop.
const QUALITY_TABLE = [
  { label: 'exceptional', chance: 0.15, qty: 4 },
  { label: 'fine', chance: 0.55, qty: 3 },
  { label: 'modest', chance: 0.3, qty: 2 },
];

// A multi-stage activity the player starts, then checks in on over real
// in-game days, rather than a menu-instant conversion: press apples now,
// come back after the cider has had time to ferment, then bottle it.
// Modeled on PropertySystem's day-based accrual, but with discrete named
// stages instead of a continuous income number.
export class CiderPressSystem {
  constructor(bus) {
    this.bus = bus;
    this.stage = 'empty'; // 'empty' | 'fermenting' | 'ready'
    this.startDay = null;
  }

  daysElapsed(currentDay) {
    return this.startDay === null ? 0 : currentDay - this.startDay;
  }

  daysRemaining(currentDay) {
    return Math.max(0, FERMENT_DAYS - this.daysElapsed(currentDay));
  }

  get requiredApples() {
    return REQUIRED_APPLES;
  }

  // Call once per day-change; flips 'fermenting' to 'ready' once enough
  // time has passed. Idempotent -- safe to call every time the player
  // interacts with the press, not just on the day boundary.
  checkProgress(currentDay) {
    if (this.stage === 'fermenting' && this.daysElapsed(currentDay) >= FERMENT_DAYS) {
      this.stage = 'ready';
      this.bus.emit('cider:ready');
    }
  }

  canStart(economy) {
    return this.stage === 'empty' && economy.hasItem('apple', REQUIRED_APPLES);
  }

  start(economy, currentDay) {
    if (!this.canStart(economy)) return false;
    economy.removeItem('apple', REQUIRED_APPLES);
    this.stage = 'fermenting';
    this.startDay = currentDay;
    this.bus.emit('cider:started');
    return true;
  }

  collect(economy, rng) {
    if (this.stage !== 'ready') return null;
    const roll = rng.next();
    let acc = 0;
    let picked = QUALITY_TABLE[QUALITY_TABLE.length - 1];
    for (const q of QUALITY_TABLE) {
      acc += q.chance;
      if (roll <= acc) {
        picked = q;
        break;
      }
    }
    economy.addItem('cider', picked.qty);
    this.stage = 'empty';
    this.startDay = null;
    this.bus.emit('cider:collected', picked);
    return picked;
  }

  serialize() {
    return { stage: this.stage, startDay: this.startDay };
  }

  deserialize(data) {
    if (!data) return;
    this.stage = data.stage ?? 'empty';
    this.startDay = data.startDay ?? null;
  }
}
