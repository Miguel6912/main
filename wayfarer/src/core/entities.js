import { choice } from './rng.js';
import { instantiateWeapon, instantiateArmor } from './items.js';

export const PLAYER_WIDTH = 26;
export const PLAYER_HEIGHT = 44;

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
    lastSafeX: x,
    lastSafeY: y,
  };
}

const ENEMY_TYPES = {
  wolf: { w: 34, h: 26, hpBase: 8, hpPerTier: 2, dmgBase: 3, dmgPerTier: 1, speed: 150, aggro: 230, range: 32, cooldown: 0.55 },
  bandit: { w: 26, h: 42, hpBase: 14, hpPerTier: 3, dmgBase: 5, dmgPerTier: 1, speed: 100, aggro: 200, range: 34, cooldown: 0.8 },
  skeleton: { w: 24, h: 42, hpBase: 12, hpPerTier: 3, dmgBase: 5, dmgPerTier: 1, speed: 95, aggro: 210, range: 34, cooldown: 0.7 },
  zombie: { w: 28, h: 42, hpBase: 22, hpPerTier: 4, dmgBase: 7, dmgPerTier: 1, speed: 60, aggro: 160, range: 34, cooldown: 1.0 },
  guard: { w: 28, h: 44, hpBase: 20, hpPerTier: 4, dmgBase: 6, dmgPerTier: 1, speed: 95, aggro: 220, range: 36, cooldown: 0.7 },
  gargoyle: { w: 32, h: 38, hpBase: 30, hpPerTier: 5, dmgBase: 9, dmgPerTier: 1, speed: 75, aggro: 200, range: 36, cooldown: 0.9 },
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
  };
}

export function pickEnemyType(biome, rng) {
  return choice(rng, BIOME_ENEMIES[biome]);
}
