// Small deterministic PRNG (Lehmer/Park-Miller). Used for gameplay rolls
// (events, forage yields) so behaviour is reproducible from a stored seed,
// and separately for purely decorative/visual randomness.
export class RNG {
  constructor(seed = Math.floor(Math.random() * 2147483646) + 1) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  chance(p) {
    return this.next() < p;
  }

  pick(arr) {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(this.next() * arr.length)];
  }

  weightedPick(items, weightFn = (i) => i.weight ?? 1) {
    const total = items.reduce((sum, item) => sum + weightFn(item), 0);
    if (total <= 0) return this.pick(items);
    let roll = this.next() * total;
    for (const item of items) {
      roll -= weightFn(item);
      if (roll <= 0) return item;
    }
    return items[items.length - 1];
  }
}
