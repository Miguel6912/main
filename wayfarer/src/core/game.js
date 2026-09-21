import { makeRng, randInt, chance } from './rng.js';
import { generateLevel, groundSurfaceAt, GROUND_Y } from './levelgen.js';
import { createPlayer } from './entities.js';
import {
  resolveDamage,
  randomWeaponDrop,
  randomArmorDrop,
  weaponScore,
  armorScore,
  instantiateWeapon,
  instantiateArmor,
  forgeCost,
  canAffordUpgrade,
} from './items.js';

export const GRAVITY = 1800;
export const JUMP_VELOCITY = -620;
export const MOVE_SPEED = 220;
export const MAX_JUMPS = 2;
// Kept short so falling into a gap reads as a quick, punchy mistake rather
// than a long empty drop before the recovery kicks in.
export const PIT_Y = GROUND_Y + 130;
const FALL_DAMAGE = 4;
const HAZARD_DAMAGE = 6;
const INVULN_DURATION = 0.75;
const HIT_KNOCKBACK = 30;
const SWING_VISUAL = 0.15;
const INTERACT_RANGE = 90;
const MAX_MESSAGES = 50;

// Enemies telegraph before they swing: cooldown ready + in range starts a
// windup (visible in sprites.js as a warning flash) instead of dealing
// damage immediately, so getting hit is about failing to react to a tell,
// not just standing next to something.
const ENEMY_WINDUP = 0.35;
const ENEMY_KNOCKBACK = 44;
const ENEMY_HITSTUN = 0.18;
// Small nudges, not a jolt: this is a bump you register, not a freeze-frame
// that makes it look like something broke. No hit-stop -- it read as the
// game hanging rather than as weight.
const SHAKE_DECAY = 7;
const SHAKE_ON_HIT = 0.16;
const SHAKE_ON_KILL = 0.32;
const SHAKE_ON_HURT = 0.28;
const FLOATING_TEXT_LIFE = 0.7;

function addMessage(state, text) {
  state.messages.push(text);
  if (state.messages.length > MAX_MESSAGES) state.messages.shift();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnFloatingText(state, x, y, text, color) {
  state.floatingTexts.push({ x, y, text, color, life: FLOATING_TEXT_LIFE, vy: -46 });
}

function addShake(state, amount) {
  state.shake = Math.min(1, state.shake + amount);
}

function loadLevel(state, levelIndex) {
  const level = generateLevel(levelIndex, state.rng);
  state.level = level;
  state.levelIndex = levelIndex;
  state.enemies = level.enemies;
  state.pickups = level.pickups;
  state.projectiles = [];
  state.floatingTexts = [];
  state.forgeOpen = false;
  const player = state.player;
  player.x = level.start.x;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.jumpsUsed = 0;
  player.lastSafeX = player.x;
  player.lastSafeY = player.y;
  addMessage(state, `Entered the ${level.biome} — tier ${level.tier}.`);
}

export function createGame(seed) {
  const state = {
    rng: makeRng(seed >>> 0),
    player: createPlayer(60, GROUND_Y - 44),
    level: null,
    levelIndex: 0,
    enemies: [],
    pickups: [],
    projectiles: [],
    forgeOpen: false,
    gameOver: false,
    messages: [],
    totalDistance: 0,
    floatingTexts: [],
    shake: 0,
  };
  loadLevel(state, 0);
  return state;
}

function hurtPlayer(state, amount) {
  const player = state.player;
  if (player.invuln > 0 || state.gameOver) return;
  player.hp = Math.max(0, player.hp - amount);
  player.hitFlash = 0.25;
  player.invuln = INVULN_DURATION;
  spawnFloatingText(state, player.x + player.w / 2, player.y, `-${amount}`, '#ff6b6b');
  addShake(state, SHAKE_ON_HURT);
  if (player.hp <= 0) {
    state.gameOver = true;
    addMessage(state, `You fall in the ${state.level.biome}.`);
  }
}

function maybeEquip(state, item, isWeapon) {
  const player = state.player;
  if (isWeapon) {
    if (weaponScore(item) > weaponScore(player.weapon)) {
      player.weapon = item;
      addMessage(state, `Equipped ${item.name} (tier ${item.tier}).`);
      return;
    }
  } else if (armorScore(item) > armorScore(player.armor)) {
    player.armor = item;
    addMessage(state, `Equipped ${item.name} (tier ${item.tier}).`);
    return;
  }
  player.scrap += 3 + item.tier;
}

function killEnemy(state, enemy) {
  const player = state.player;
  const tier = state.level.tier;
  const gold = randInt(state.rng, 3 + tier, 10 + tier * 2);
  player.gold += gold;
  spawnFloatingText(state, enemy.x + enemy.w / 2, enemy.y - 10, `+${gold}g`, '#f4d35e');
  addShake(state, SHAKE_ON_KILL);
  if (chance(state.rng, 0.35)) player.scrap += randInt(state.rng, 2, 5);
  if (chance(state.rng, 0.1)) {
    const isWeapon = chance(state.rng, 0.5);
    const item = isWeapon ? randomWeaponDrop(state.rng, tier) : randomArmorDrop(state.rng, tier);
    maybeEquip(state, item, isWeapon);
  }
  if (chance(state.rng, 0.05)) player.hp = Math.min(player.maxHp, player.hp + 15);
}

function applyDamageToEnemy(state, enemy, rawDamage, knockbackDir) {
  const dmg = resolveDamage(rawDamage, 0, state.rng);
  enemy.hp -= dmg;
  enemy.hitFlash = 0.2;
  // Hitstun pauses an in-progress windup (it isn't ticked down while
  // stunned, further down in updateEnemies) rather than cancelling the
  // attack outright -- landing hits buys you time and space, it doesn't
  // let you spam an enemy's swing away for free.
  enemy.hitstun = ENEMY_HITSTUN;
  const pushed = enemy.x + knockbackDir * ENEMY_KNOCKBACK;
  enemy.x = Math.max(enemy.patrolMin - 60, Math.min(enemy.patrolMax - enemy.w + 60, pushed));
  spawnFloatingText(state, enemy.x + enemy.w / 2, enemy.y, `${dmg}`, '#ffffff');
  addShake(state, SHAKE_ON_HIT);
}

function performPlayerAttack(state) {
  const { player } = state;
  const weapon = player.weapon;
  if (weapon.type === 'ranged') {
    state.projectiles.push({
      x: player.facing > 0 ? player.x + player.w : player.x,
      y: player.y + player.h / 2,
      vx: weapon.projectileSpeed * player.facing,
      damage: weapon.damage,
      traveled: 0,
      maxRange: weapon.range,
    });
    return;
  }
  const reachX0 = player.facing > 0 ? player.x + player.w : player.x - weapon.range;
  const reachX1 = player.facing > 0 ? player.x + player.w + weapon.range : player.x;
  const hitbox = { x: reachX0, y: player.y, w: reachX1 - reachX0, h: player.h };
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    if (rectsOverlap(hitbox, enemy)) applyDamageToEnemy(state, enemy, weapon.damage, player.facing);
  }
}

function updatePhysics(state, dt) {
  const player = state.player;
  const { level } = state;

  player.x += player.vx * dt;
  player.x = Math.max(0, Math.min(level.width - player.w, player.x));

  const prevBottom = player.y + player.h;
  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;
  const newBottom = player.y + player.h;

  player.onGround = false;
  if (player.vy >= 0) {
    let landingY = null;
    const groundSurface = groundSurfaceAt(level.segments, player.x + player.w / 2);
    // Ground has nothing beneath it but a pit, so any overlap while falling
    // counts as a landing — unlike platforms, it doesn't need a same-frame
    // crossing check (that would miss landings when re-entering solid
    // ground horizontally after already falling below its surface height).
    if (groundSurface !== null && newBottom >= groundSurface) {
      landingY = groundSurface;
    }
    for (const plat of level.platforms) {
      if (player.x + player.w <= plat.x0 || player.x >= plat.x1) continue;
      if (prevBottom <= plat.y + 1 && newBottom >= plat.y) {
        if (landingY === null || plat.y < landingY) landingY = plat.y;
      }
    }
    if (landingY !== null) {
      player.y = landingY - player.h;
      player.vy = 0;
      player.onGround = true;
      player.jumpsUsed = 0;
      player.lastSafeX = player.x;
      player.lastSafeY = player.y;
    }
  }

  if (!player.onGround && player.y + player.h > PIT_Y) {
    hurtPlayer(state, FALL_DAMAGE);
    player.x = player.lastSafeX;
    player.y = player.lastSafeY;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    player.jumpsUsed = 0;
  }

  for (const hazard of level.hazards) {
    // Kept a little shorter than the drawn spike height (27px in
    // sprites.js) so the very tip is forgiving, but close enough that the
    // hitbox roughly matches what's visible -- getting hurt should track
    // what you can see, not a much shorter invisible collision box.
    const hbox = { x: hazard.x0, y: hazard.y - 20, w: hazard.x1 - hazard.x0, h: 20 };
    if (rectsOverlap(player, hbox)) hurtPlayer(state, HAZARD_DAMAGE);
  }
}

function updateProjectiles(state, dt) {
  const kept = [];
  for (const p of state.projectiles) {
    p.x += p.vx * dt;
    p.traveled += Math.abs(p.vx * dt);
    const pbox = { x: p.x - 4, y: p.y - 4, w: 8, h: 8 };
    let hit = false;
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;
      if (rectsOverlap(pbox, enemy)) {
        applyDamageToEnemy(state, enemy, p.damage, Math.sign(p.vx) || 1);
        hit = true;
        break;
      }
    }
    if (!hit && p.traveled < p.maxRange && p.x > -20 && p.x < state.level.width + 20) kept.push(p);
  }
  state.projectiles = kept;
}

function updateEnemies(state, dt) {
  const player = state.player;
  for (const enemy of state.enemies) {
    enemy.cooldownRemaining = Math.max(0, enemy.cooldownRemaining - dt);
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    if (enemy.hp <= 0) continue;

    const dx = player.x - enemy.x;
    const dist = Math.abs(dx);
    const sameLevel = Math.abs((player.y + player.h) - (enemy.y + enemy.h)) < 80;

    if (enemy.hitstun > 0) {
      enemy.hitstun -= dt;
      continue;
    }

    if (enemy.windup > 0) {
      // Telegraphed: hold position (sprites.js shows the warning flash)
      // and resolve the hit only if the player is still in range when it
      // lands — stepping back during the tell is real counterplay.
      enemy.windup -= dt;
      if (enemy.windup <= 0) {
        enemy.cooldownRemaining = enemy.cooldown;
        if (dist <= enemy.attackRange * 1.2 && sameLevel) {
          const dmg = resolveDamage(enemy.damage, player.armor.defense, state.rng);
          const wasAlive = player.invuln <= 0;
          hurtPlayer(state, dmg);
          if (wasAlive) {
            const push = (dx >= 0 ? -1 : 1) * HIT_KNOCKBACK;
            player.x = Math.max(0, Math.min(state.level.width - player.w, player.x + push));
          }
        }
      }
      continue;
    }

    if (enemy.state === 'patrol') {
      if (dist < enemy.aggroRange && sameLevel) {
        enemy.state = 'chase';
      } else {
        enemy.x += enemy.dir * enemy.speed * 0.5 * dt;
        if (enemy.x < enemy.patrolMin) {
          enemy.x = enemy.patrolMin;
          enemy.dir = 1;
        } else if (enemy.x + enemy.w > enemy.patrolMax) {
          enemy.x = enemy.patrolMax - enemy.w;
          enemy.dir = -1;
        }
      }
    } else if (enemy.state === 'chase') {
      if (dist > enemy.aggroRange * 1.4 || !sameLevel) {
        enemy.state = 'patrol';
      } else if (dist > enemy.attackRange) {
        const dir = dx >= 0 ? 1 : -1;
        enemy.dir = dir;
        const nx = enemy.x + dir * enemy.speed * dt;
        enemy.x = Math.max(enemy.patrolMin - 40, Math.min(enemy.patrolMax - enemy.w + 40, nx));
      } else if (enemy.cooldownRemaining <= 0) {
        enemy.dir = dx >= 0 ? 1 : -1;
        enemy.windup = ENEMY_WINDUP;
      }
    }
  }
  state.enemies = state.enemies.filter((e) => {
    if (e.hp > 0) return true;
    killEnemy(state, e);
    return false;
  });
}

function updateFloatingTexts(state, dt) {
  const kept = [];
  for (const f of state.floatingTexts) {
    f.life -= dt;
    f.y += f.vy * dt;
    f.vy += 60 * dt;
    if (f.life > 0) kept.push(f);
  }
  state.floatingTexts = kept;
}

function updatePickups(state) {
  const player = state.player;
  const kept = [];
  for (const pickup of state.pickups) {
    const box = { x: pickup.x - 12, y: pickup.y - 24, w: 24, h: 24 };
    if (rectsOverlap(player, box)) {
      if (pickup.kind === 'gold') {
        player.gold += pickup.amount;
        spawnFloatingText(state, pickup.x, pickup.y - 20, `+${pickup.amount}g`, '#f4d35e');
      } else if (pickup.kind === 'scrap') {
        player.scrap += pickup.amount;
        spawnFloatingText(state, pickup.x, pickup.y - 20, `+${pickup.amount} scrap`, '#c9c9d4');
      } else if (pickup.kind === 'potion') {
        player.hp = Math.min(player.maxHp, player.hp + pickup.amount);
        spawnFloatingText(state, pickup.x, pickup.y - 20, `+${pickup.amount} hp`, '#7fdc7f');
      } else if (pickup.kind === 'weapon') maybeEquip(state, pickup.item, true);
      else if (pickup.kind === 'armor') maybeEquip(state, pickup.item, false);
      continue;
    }
    kept.push(pickup);
  }
  state.pickups = kept;
}

export function isNearForge(state) {
  const forge = state.level.forge;
  if (!forge) return false;
  const cx = state.player.x + state.player.w / 2;
  return Math.abs(cx - forge.x) < INTERACT_RANGE;
}

export function update(state, input, dt) {
  if (state.gameOver) return state;

  if (state.forgeOpen) {
    if (input.interactPressed) state.forgeOpen = false;
    return state;
  }

  const player = state.player;
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.swingFlash = Math.max(0, player.swingFlash - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);
  state.shake = Math.max(0, state.shake - SHAKE_DECAY * dt);
  updateFloatingTexts(state, dt);

  let dir = 0;
  if (input.left) dir -= 1;
  if (input.right) dir += 1;
  player.vx = dir * MOVE_SPEED;
  if (dir !== 0) player.facing = dir;

  if (input.jumpPressed && player.jumpsUsed < MAX_JUMPS) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
    player.jumpsUsed += 1;
  }

  if (input.attackPressed && player.attackCooldown <= 0) {
    performPlayerAttack(state);
    player.attackCooldown = player.weapon.cooldown;
    player.swingFlash = SWING_VISUAL;
  }

  updatePhysics(state, dt);
  updateProjectiles(state, dt);
  updateEnemies(state, dt);
  updatePickups(state);

  if (input.interactPressed && isNearForge(state)) {
    state.forgeOpen = true;
  }

  const cx = player.x + player.w / 2;
  if (cx >= state.level.gateX) {
    state.totalDistance += state.level.width;
    loadLevel(state, state.levelIndex + 1);
    player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.2));
  }

  return state;
}

export function upgradeWeapon(state) {
  const player = state.player;
  if (!canAffordUpgrade(player, player.weapon.tier)) return false;
  const cost = forgeCost(player.weapon.tier);
  player.scrap -= cost.scrap;
  player.gold -= cost.gold;
  player.weapon = instantiateWeapon(player.weapon.id, player.weapon.tier + 1);
  addMessage(state, `Forged ${player.weapon.name} to tier ${player.weapon.tier}.`);
  return true;
}

export function upgradeArmor(state) {
  const player = state.player;
  if (!canAffordUpgrade(player, player.armor.tier)) return false;
  const cost = forgeCost(player.armor.tier);
  player.scrap -= cost.scrap;
  player.gold -= cost.gold;
  player.armor = instantiateArmor(player.armor.id, player.armor.tier + 1);
  addMessage(state, `Forged ${player.armor.name} to tier ${player.armor.tier}.`);
  return true;
}
