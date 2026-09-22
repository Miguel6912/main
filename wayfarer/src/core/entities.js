import { choice } from './rng.js';
import { instantiateWeapon, instantiateArmor } from './items.js';

// Scaled up ~1.45x from the original 26x44 so characters read clearly
// against the level — see sprites.js drawPlayer, which scales its
// (fixed-offset) body art by player.h against this same reference height.
export const PLAYER_WIDTH = 38;
export const PLAYER_HEIGHT = 64;
export const PLAYER_REFERENCE_HEIGHT = 44;

export function createPlayer(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT,
    onGround: false,
    facing: 1,
    hp: 40,
    maxHp: 40,
    gold: 0,
    scrap: 0,
    weapon: instantiateWeapon('dagger', 1),
    armor: instantiateArmor('garb', 1),
    attackCooldown: 0,
    swingFlash: 0,
    invuln: 0,
    hitFlash: 0,
    jumpsUsed: 0,
    lastSafeX: x,
    lastSafeY: y,
    // Combo: which of the 4 melee swings was just thrown (0-3), and how
    // long since then before it resets to the first swing again -- see
    // performPlayerAttack. Starts at -1, not 0, so the very first swing of
    // a fresh combo lands on index 0 (comboStep + 1) % 4 rather than
    // skipping straight to index 1. airTime is purely cosmetic (drives the
    // jump animation's frame in render.js), not read by physics.
    comboStep: -1,
    comboTimer: 0,
    airTime: 0,
    // Dodge/roll (ROADMAP.md Phase 1.1): dodging is true only while the dash
    // itself is playing out; dodgeTimer counts that window down and drives
    // the dodge animation's frame in render.js. dodgeCooldown is separate
    // and always ticking, so it keeps counting down even between dashes.
    // dodgeDir is locked in at the moment the dash starts (not re-read from
    // held input each frame), so releasing/changing direction mid-dash can't
    // redirect it.
    dodging: false,
    dodgeTimer: 0,
    dodgeCooldown: 0,
    dodgeDir: 1,
    // Weapon identity (ROADMAP.md Phase 1.3/1.4). postDodgeWindow counts
    // down after a dodge ends -- only the dagger's ability currently reads
    // it, but it's tracked generically (not dagger-specific state) in case
    // something else wants to know "did the player just dodge" later.
    // chargeTime is the bow's hold-to-charge progress; unused by any melee
    // weapon.
    postDodgeWindow: 0,
    chargeTime: 0,
  };
}

// Enemies now telegraph before they hit (see game.js windup handling), so
// they can afford to hit harder and notice you from further off than before
// without feeling cheap -- the counterplay is dodging the tell, not just
// trading blows.
// defense (ROADMAP.md Phase 1.2) subtracts straight off incoming damage in
// resolveDamage, same as the player's own armor already does against enemy
// hits -- so it's the thing an axe's future "bonus vs. defense" hook (1.3)
// will actually have something to bite into. Kept light (0-3) rather than
// rebalancing the whole roster around it: unarmored beasts (wolf,
// frostwolf, bogling) and brittle skeletons stay at 0, armored/thick-hided
// types (guard, gargoyle, revenant, zombie, drowned) get enough to feel
// tougher per hit without turning them into early-game damage sponges.
const ENEMY_TYPES = {
  wolf: { w: 49, h: 38, hpBase: 8, hpPerTier: 2, dmgBase: 4, dmgPerTier: 1, speed: 160, aggro: 260, range: 40, cooldown: 0.5, defense: 0 },
  bandit: { w: 38, h: 61, hpBase: 14, hpPerTier: 3, dmgBase: 6, dmgPerTier: 1, speed: 105, aggro: 230, range: 42, cooldown: 0.75, defense: 1 },
  skeleton: { w: 35, h: 61, hpBase: 12, hpPerTier: 3, dmgBase: 6, dmgPerTier: 1, speed: 100, aggro: 240, range: 42, cooldown: 0.65, defense: 0 },
  zombie: { w: 41, h: 61, hpBase: 22, hpPerTier: 4, dmgBase: 8, dmgPerTier: 1, speed: 65, aggro: 190, range: 42, cooldown: 0.95, defense: 1 },
  guard: { w: 41, h: 64, hpBase: 20, hpPerTier: 4, dmgBase: 7, dmgPerTier: 1, speed: 100, aggro: 250, range: 44, cooldown: 0.65, defense: 2 },
  gargoyle: { w: 46, h: 55, hpBase: 30, hpPerTier: 5, dmgBase: 10, dmgPerTier: 1, speed: 80, aggro: 230, range: 44, cooldown: 0.85, defense: 3 },
  // frostmarch/swamp -- roughly wolf/bandit-tier and zombie/guard-tier
  // respectively, scaled up slightly (harsher terrain, later in the
  // rotation) rather than introducing a whole new difficulty curve.
  frostwolf: { w: 49, h: 38, hpBase: 10, hpPerTier: 2, dmgBase: 5, dmgPerTier: 1, speed: 150, aggro: 260, range: 40, cooldown: 0.5, defense: 0 },
  revenant: { w: 41, h: 64, hpBase: 24, hpPerTier: 4, dmgBase: 8, dmgPerTier: 1, speed: 75, aggro: 220, range: 44, cooldown: 0.85, defense: 2 },
  bogling: { w: 34, h: 30, hpBase: 6, hpPerTier: 2, dmgBase: 3, dmgPerTier: 1, speed: 140, aggro: 220, range: 36, cooldown: 0.45, defense: 0 },
  drowned: { w: 42, h: 62, hpBase: 26, hpPerTier: 4, dmgBase: 9, dmgPerTier: 1, speed: 70, aggro: 200, range: 44, cooldown: 0.9, defense: 1 },
};

export const BIOME_ENEMIES = {
  forest: ['wolf', 'bandit'],
  graveyard: ['skeleton', 'zombie'],
  castle: ['guard', 'gargoyle'],
  frostmarch: ['frostwolf', 'revenant'],
  swamp: ['bogling', 'drowned'],
};

let nextEnemyId = 1;

export function createEnemy(type, x, groundY, patrolMin, patrolMax, tier, rng) {
  const def = ENEMY_TYPES[type];
  const hp = def.hpBase + def.hpPerTier * (tier - 1);
  return {
    id: nextEnemyId++,
    type,
    x,
    y: groundY - def.h,
    w: def.w,
    h: def.h,
    hp,
    maxHp: hp,
    damage: def.dmgBase + def.dmgPerTier * (tier - 1),
    defense: def.defense,
    speed: def.speed,
    aggroRange: def.aggro,
    attackRange: def.range,
    cooldown: def.cooldown,
    cooldownRemaining: 0,
    patrolMin,
    patrolMax,
    dir: rng() < 0.5 ? -1 : 1,
    state: 'patrol',
    hitFlash: 0,
    windup: 0,
    hitstun: 0,
  };
}

export function pickEnemyType(biome, rng) {
  return choice(rng, BIOME_ENEMIES[biome]);
}
