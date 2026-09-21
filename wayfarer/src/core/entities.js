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
  };
}

// Enemies now telegraph before they hit (see game.js windup handling), so
// they can afford to hit harder and notice you from further off than before
// without feeling cheap -- the counterplay is dodging the tell, not just
// trading blows.
const ENEMY_TYPES = {
  wolf: { w: 49, h: 38, hpBase: 8, hpPerTier: 2, dmgBase: 4, dmgPerTier: 1, speed: 160, aggro: 260, range: 40, cooldown: 0.5 },
  bandit: { w: 38, h: 61, hpBase: 14, hpPerTier: 3, dmgBase: 6, dmgPerTier: 1, speed: 105, aggro: 230, range: 42, cooldown: 0.75 },
  skeleton: { w: 35, h: 61, hpBase: 12, hpPerTier: 3, dmgBase: 6, dmgPerTier: 1, speed: 100, aggro: 240, range: 42, cooldown: 0.65 },
  zombie: { w: 41, h: 61, hpBase: 22, hpPerTier: 4, dmgBase: 8, dmgPerTier: 1, speed: 65, aggro: 190, range: 42, cooldown: 0.95 },
  guard: { w: 41, h: 64, hpBase: 20, hpPerTier: 4, dmgBase: 7, dmgPerTier: 1, speed: 100, aggro: 250, range: 44, cooldown: 0.65 },
  gargoyle: { w: 46, h: 55, hpBase: 30, hpPerTier: 5, dmgBase: 10, dmgPerTier: 1, speed: 80, aggro: 230, range: 44, cooldown: 0.85 },
};

export const BIOME_ENEMIES = {
  forest: ['wolf', 'bandit'],
  graveyard: ['skeleton', 'zombie'],
  castle: ['guard', 'gargoyle'],
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
