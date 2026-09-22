import { randInt, choice } from './rng.js';

// `ability` (ROADMAP.md Phase 1.3/1.4) is each weapon's mechanical identity
// -- not just different damage/range/cooldown numbers, but something that
// changes how you actually fight with it. Kept as data consulted generically
// by applyDamageToEnemy/performPlayerAttack in game.js (keyed by field
// presence, e.g. `ability.riposteWindupBonus`), not "if weapon.id === ..."
// branches -- a new weapon just needs new ability fields, not new code
// paths. Fields absent from a given weapon's ability object simply don't
// apply (read as falsy), so weapons only pay for what they use.
export const WEAPON_CATALOG = [
  {
    id: 'dagger', name: 'Rusty Dagger', damage: 4, range: 60, cooldown: 0.32, type: 'melee',
    // Predator's window: a hit landed shortly after a dodge ends gets a big
    // bonus crit chance on top of the flat baseline (see POST_DODGE_WINDOW
    // in game.js) -- rewards the fast in-and-out playstyle a dagger is
    // built for, and gives the dodge itself an offensive payoff, not just
    // a defensive one.
    ability: { postDodgeCritBonus: 0.4 },
  },
  {
    id: 'sword', name: 'Iron Sword', damage: 7, range: 70, cooldown: 0.42, type: 'melee',
    // Riposte: hitting an enemy while it's still mid-windup (about to
    // swing) deals bonus damage and grants a brief invulnerability --
    // landing a hit already pauses that windup via hitstun (see
    // applyDamageToEnemy/updateEnemies), this rewards doing it with a
    // sword specifically, punishing a telegraph rather than just trading.
    ability: { riposteWindupBonus: 1.5, riposteInvuln: 0.3 },
  },
  {
    id: 'axe', name: 'War Axe', damage: 10, range: 66, cooldown: 0.58, type: 'melee',
    // Armour-breaking: ignores a chunk of the target's defense outright.
    // Execute: a big bonus against anything already below a quarter
    // health -- a finishing blow should feel like one.
    ability: { defenseIgnore: 0.6, executeThreshold: 0.25, executeBonus: 1.8 },
  },
  {
    id: 'greatsword', name: 'Greatsword', damage: 15, range: 84, cooldown: 0.75, type: 'melee',
    // Impact: noticeably harder knockback and a longer hitstun window per
    // hit, and its own combo finisher wave hits harder on top of the
    // baseline WAVE_DAMAGE_MULT every weapon already gets.
    ability: { knockbackMult: 1.8, hitstunMult: 1.6, waveDamageMult: 1.3 },
  },
  {
    id: 'bow', name: "Hunter's Bow", damage: 6, range: 640, cooldown: 0.5, type: 'ranged', projectileSpeed: 560,
    // Charge: hold the attack input (instead of tapping it) to charge a
    // shot over maxChargeTime seconds, up to +100% damage at full draw. A
    // quick tap still fires near base damage rather than doing nothing, so
    // charging is an upside, never a new requirement to land a hit at all.
    ability: { chargeable: true, maxChargeTime: 0.9, maxChargeBonus: 1.0 },
  },
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
