import { randInt, choice } from './rng.js';

export const MONSTER_TYPES = {
  rat: { glyph: 'r', name: 'rat', hp: 4, attack: 2, defense: 0, xp: 2, color: '#c99b6a' },
  goblin: { glyph: 'g', name: 'goblin', hp: 8, attack: 3, defense: 1, xp: 4, color: '#5fb85f' },
  orc: { glyph: 'o', name: 'orc', hp: 14, attack: 5, defense: 2, xp: 8, color: '#e05555' },
  troll: { glyph: 'T', name: 'troll', hp: 24, attack: 8, defense: 3, xp: 16, color: '#c069e0' },
};

function poolForDepth(depth) {
  if (depth <= 2) return ['rat', 'rat', 'goblin'];
  if (depth <= 4) return ['rat', 'goblin', 'goblin', 'orc'];
  return ['goblin', 'orc', 'orc', 'troll'];
}

export function createPlayer(x, y) {
  return {
    x,
    y,
    hp: 20,
    maxHp: 20,
    attack: 4,
    defense: 1,
    gold: 0,
    potions: 1,
    level: 1,
    xp: 0,
    xpToNext: 12,
  };
}

export function createMonster(depth, rng, x, y) {
  const type = choice(rng, poolForDepth(depth));
  const base = MONSTER_TYPES[type];
  const scale = Math.floor((depth - 1) / 2);
  return {
    type,
    glyph: base.glyph,
    name: base.name,
    color: base.color,
    x,
    y,
    hp: base.hp + scale * 2,
    maxHp: base.hp + scale * 2,
    attack: base.attack + scale,
    defense: base.defense + Math.floor(scale / 2),
    xp: base.xp + scale * 2,
    awake: false,
  };
}

/**
 * Resolves attacker hitting defender. Damage is attack minus defense with a
 * little randomness, always at least 1 so fights can't stalemate forever.
 */
export function resolveAttack(attacker, defender, rng) {
  const variance = randInt(rng, -1, 2);
  const damage = Math.max(1, attacker.attack - defender.defense + variance);
  defender.hp -= damage;
  return { damage, killed: defender.hp <= 0 };
}

export function levelUpIfReady(player) {
  const gains = [];
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.maxHp += 5;
    player.hp = player.maxHp;
    player.attack += 1;
    if (player.level % 2 === 0) player.defense += 1;
    player.xpToNext = Math.floor(player.xpToNext * 1.5);
    gains.push(player.level);
  }
  return gains;
}
