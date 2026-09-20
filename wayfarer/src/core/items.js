import { randInt, choice } from './rng.js';

export const WEAPON_CATALOG = [
  { id: 'dagger', name: 'Rusty Dagger', damage: 4, range: 40, cooldown: 0.32, type: 'melee' },
  { id: 'sword', name: 'Iron Sword', damage: 7, range: 46, cooldown: 0.42, type: 'melee' },
  { id: 'axe', name: 'War Axe', damage: 10, range: 42, cooldown: 0.58, type: 'melee' },
  { id: 'greatsword', name: 'Greatsword', damage: 15, range: 52, cooldown: 0.75, type: 'melee' },
  { id: 'bow', name: "Hunter's Bow", damage: 6, range: 640, cooldown: 0.5, type: 'ranged', projectileSpeed: 560 },
];

export const ARMOR_CATALOG = [
  { id: 'garb', name: "Traveler's Garb", defense: 2 },
  { id: 'leather', name: 'Leather Vest', defense: 3 },
  { id: 'chain', name: 'Chainmail', defense: 6 },
  { id: 'plate', name: "Knight's Plate", defense: 10 },
];

const MAX_TIER = 6;

export function instantiateWeapon(id, tier = 1) {
  const base = WEAPON_CATALOG.find((w) => w.id === id);
  const t = Math.max(1, Math.min(MAX_TIER, tier));
  return {
    ...base,
    tier: t,
    damage: Math.round(base.damage * (1 + 0.35 * (t - 1))),
    range: base.range + (t - 1) * 4,
    cooldown: Math.max(0.15, base.cooldown - (t - 1) * 0.03),
  };
}

export function instantiateArmor(id, tier = 1) {
  const base = ARMOR_CATALOG.find((a) => a.id === id);
  const t = Math.max(1, Math.min(MAX_TIER, tier));
  return {
    ...base,
    tier: t,
    defense: Math.round(base.defense * (1 + 0.4 * (t - 1))),
  };
}

export function weaponScore(weapon) {
  return weapon.damage / weapon.cooldown;
}

export function armorScore(armor) {
  return armor.defense;
}

export function randomWeaponDrop(rng, tierHint) {
  const base = choice(rng, WEAPON_CATALOG);
  const tier = Math.max(1, Math.min(MAX_TIER, tierHint + randInt(rng, -1, 1)));
  return instantiateWeapon(base.id, tier);
}

export function randomArmorDrop(rng, tierHint) {
  const base = choice(rng, ARMOR_CATALOG);
  const tier = Math.max(1, Math.min(MAX_TIER, tierHint + randInt(rng, -1, 1)));
  return instantiateArmor(base.id, tier);
}

export function forgeCost(tier) {
  return { scrap: 8 + tier * 6, gold: 15 + tier * 10 };
}

export function canAffordUpgrade(player, tier) {
  const cost = forgeCost(tier);
  return player.scrap >= cost.scrap && player.gold >= cost.gold && tier < MAX_TIER;
}

export function resolveDamage(attackDamage, defense, rng) {
  const variance = randInt(rng, -1, 2);
  return Math.max(1, attackDamage - defense + variance);
}

export { MAX_TIER };
