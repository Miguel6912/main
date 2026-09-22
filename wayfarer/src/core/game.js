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
import { FORGE_INTRO_LINES, BIOME_FIRST_ENTRY_LINES } from './story.js';

export const GRAVITY = 1800;
export const JUMP_VELOCITY = -620;
export const MOVE_SPEED = 220;
export const MAX_JUMPS = 2;
// Dodge/roll (ROADMAP.md Phase 1.1). DODGE_SPEED is above MOVE_SPEED so the
// dash still reads as a distinct burst, not just a speed boost; DODGE_DURATION
// is how long that burst (and its invulnerability) lasts; DODGE_COOLDOWN is
// separate and always counting down, so spamming the button doesn't chain
// dashes back to back. Ground-only for this first pass -- double jump
// already covers air mobility, and keeping dodge off the ground avoids
// stacking it with mid-air physics for now.
// Was 480/0.22 (~106px covered) -- fast enough that the whole dash read as
// an instant teleport/slide rather than a roll you could actually see
// happen, even after slowing the animation down on its own (reported: "it
// happens fast, the character slides on the ground"). Traded speed for
// duration instead of just adding more of both: ~120px covered is close to
// before, but stretched over nearly double the time so there's room to
// actually perceive the motion.
const DODGE_SPEED = 300;
const DODGE_DURATION = 0.4;
const DODGE_COOLDOWN = 0.75;
// Kept short so falling into a gap reads as a quick, punchy mistake rather
// than a long empty drop before the recovery kicks in.
export const PIT_Y = GROUND_Y + 130;
const FALL_DAMAGE = 4;
const HAZARD_DAMAGE = 6;
const INVULN_DURATION = 0.75;
const HIT_KNOCKBACK = 30;
// Was 0.15 -- long enough now to play out the 4-frame melee swing clip
// (render.js) at a readable pace instead of just flashing a static pose.
const SWING_VISUAL = 0.28;
const INTERACT_RANGE = 90;
const MAX_MESSAGES = 50;

// Combo: each melee hit advances comboStep (0-3, wrapping), landing on a
// different one of the 4 swings in the delivered melee sheet -- the first
// hit of a fresh combo is swing 0, the second swing 1, and so on. Land
// another hit within COMBO_WINDOW and it continues; wait longer and it
// resets, so the next swing after a gap is swing 0 again, not wherever the
// count happened to stop. Swing 3 -- the 4th hit of an unbroken combo -- is
// the finisher: on top of its normal melee hit, it also sends a short
// forward wave that can catch a second target just past your blade's own
// reach ("a little slice wave forward a step or 2").
const COMBO_WINDOW = 0.7;
const WAVE_SPEED = 480;
const WAVE_RANGE = 90;
const WAVE_DAMAGE_MULT = 1.4;

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
// Crit system (ROADMAP.md Phase 1.2). A flat baseline for now -- every
// player attack (melee or ranged) has the same chance and multiplier,
// regardless of weapon. This is deliberately the whole system for this
// step; Phase 1.3's weapon-identity hooks are what will make specific
// weapons push these numbers around (e.g. a dagger raising its own chance
// right after a dodge) rather than this file growing per-weapon branches.
const PLAYER_CRIT_CHANCE = 0.12;
const PLAYER_CRIT_MULT = 1.75;
// How long the dagger's postDodgeCritBonus (items.js) stays available after
// a dodge ends. A tuning constant, not weapon data -- it's "how generous is
// the window," which is the same question regardless of which weapon (if
// any) someday cares about it.
const POST_DODGE_WINDOW = 0.5;
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
  const firstEntryLine = BIOME_FIRST_ENTRY_LINES[level.biome];
  // No portrait -- these read as an ambient aside, not a specific person
  // talking at you (Elara isn't literally there watching you cross a
  // frostmarch).
  if (firstEntryLine && level.tier === 1) startDialogue(state, null, null, [firstEntryLine]);
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
    seenForgeBiomes: new Set(),
    totalDistance: 0,
    floatingTexts: [],
    shake: 0,
    activeDialogue: null,
  };
  loadLevel(state, 0);
  return state;
}

// How long each line of an on-screen dialogue box sits before advancing to
// the next (or clearing, on the last one) -- long enough to read a couple
// of sentences without feeling like it's rushing off. Lines also still go
// through addMessage below, same as before, so the scrolling log keeps a
// full history even after the box itself has moved on.
const DIALOGUE_LINE_DURATION = 4.5;

// onComplete (optional) fires once, after the last line clears -- used to
// hold off opening the forge modal until Doran's intro finishes, so the two
// never show on screen stacked on top of each other.
function startDialogue(state, speaker, portrait, lines, onComplete) {
  for (const line of lines) addMessage(state, line);
  if (lines.length === 0) {
    if (onComplete) onComplete(state);
    return;
  }
  state.activeDialogue = { speaker, portrait, lines, lineIndex: 0, timer: DIALOGUE_LINE_DURATION, onComplete };
}

// Ticked unconditionally (see update() below) even while game-over has
// otherwise paused everything else, so a line in progress keeps advancing
// (and can still clear to onComplete) rather than freezing mid-sentence.
function tickDialogue(state, dt) {
  const d = state.activeDialogue;
  d.timer -= dt;
  if (d.timer <= 0) {
    d.lineIndex += 1;
    if (d.lineIndex >= d.lines.length) {
      state.activeDialogue = null;
      if (d.onComplete) d.onComplete(state);
    } else {
      d.timer = DIALOGUE_LINE_DURATION;
    }
  }
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

// The single funnel every point of damage to an enemy passes through --
// a melee swing, the combo-finisher wave, or an arrow -- so a weapon's
// ability (items.js) applies consistently no matter which of those actually
// delivered the hit, keyed off whatever's currently equipped rather than
// whatever fired the projectile (see the comment on WEAPON_CATALOG for why
// that's a deliberate simplification, not an oversight).
function applyDamageToEnemy(state, enemy, rawDamage, knockbackDir) {
  const player = state.player;
  const ability = player.weapon.ability || {};
  let attackDamage = rawDamage;

  // Sword: riposte. Landing a hit while the enemy is still mid-windup
  // already pauses that windup via hitstun below (it isn't ticked down
  // while stunned, see updateEnemies) -- this adds a real payoff on top for
  // doing it with a sword specifically, punishing a telegraph rather than
  // just trading blows.
  const isRiposte = Boolean(ability.riposteWindupBonus && enemy.windup > 0);
  if (isRiposte) attackDamage = Math.round(attackDamage * ability.riposteWindupBonus);

  // Axe: armour-breaking (ignores a fraction of the target's defense) and
  // execute (bonus damage finishing off something already below a quarter
  // health).
  let effectiveDefense = enemy.defense;
  if (ability.defenseIgnore) effectiveDefense = Math.round(effectiveDefense * (1 - ability.defenseIgnore));
  const isExecute = Boolean(ability.executeThreshold && enemy.maxHp > 0 && enemy.hp / enemy.maxHp <= ability.executeThreshold);
  if (isExecute) attackDamage = Math.round(attackDamage * (ability.executeBonus || 1));

  // Dagger: bonus crit chance for a short window after a dodge (see
  // POST_DODGE_WINDOW). Crit is rolled last and multiplies whatever the
  // riposte/execute bonuses above already produced, so a well-timed axe
  // execute or sword riposte can still crit on top -- the big, memorable
  // numbers this game wants (DESIGN.md's "addictive" mandate) should be
  // able to stack, not fight each other for which one "wins."
  const critChance = PLAYER_CRIT_CHANCE + (player.postDodgeWindow > 0 ? (ability.postDodgeCritBonus || 0) : 0);
  const isCrit = chance(state.rng, critChance);
  if (isCrit) attackDamage = Math.round(attackDamage * PLAYER_CRIT_MULT);

  const dmg = resolveDamage(attackDamage, effectiveDefense, state.rng);
  enemy.hp -= dmg;
  enemy.hitFlash = 0.2;
  enemy.hitstun = ENEMY_HITSTUN * (ability.hitstunMult || 1);

  if (isRiposte && ability.riposteInvuln) player.invuln = Math.max(player.invuln, ability.riposteInvuln);

  const knockback = ENEMY_KNOCKBACK * (ability.knockbackMult || 1);
  const pushed = enemy.x + knockbackDir * knockback;
  enemy.x = Math.max(enemy.patrolMin - 60, Math.min(enemy.patrolMax - enemy.w + 60, pushed));

  const label = isCrit ? `${dmg}!` : `${dmg}`;
  const color = isCrit ? '#ff6a3d' : (isExecute ? '#ff3d3d' : '#ffffff');
  spawnFloatingText(state, enemy.x + enemy.w / 2, enemy.y, label, color);
  addShake(state, isCrit || isExecute ? SHAKE_ON_HIT * 1.6 : SHAKE_ON_HIT);
}

// chargeTime (seconds held, ignored by anything without ability.chargeable
// -- currently only the bow) drives how much bonus the shot gets. A quick
// tap passes ~0 and still fires near base damage, so charging is purely an
// upside on top of always being able to just shoot.
function performPlayerAttack(state, chargeTime = 0) {
  const { player } = state;
  const weapon = player.weapon;
  if (weapon.type === 'ranged') {
    // Ranged weapons don't combo -- each shot is its own thing, so the next
    // melee hit (if you switch weapons) always starts a fresh combo rather
    // than continuing wherever a bow volley left off. -1, not 0: see
    // entities.js createPlayer for why.
    player.comboStep = -1;
    const ability = weapon.ability || {};
    const chargeFraction = ability.chargeable ? Math.min(1, chargeTime / (ability.maxChargeTime || 1)) : 0;
    const dmg = Math.round(weapon.damage * (1 + chargeFraction * (ability.maxChargeBonus || 0)));
    state.projectiles.push({
      x: player.facing > 0 ? player.x + player.w : player.x,
      y: player.y + player.h / 2,
      vx: weapon.projectileSpeed * player.facing,
      damage: dmg,
      traveled: 0,
      maxRange: weapon.range,
      kind: 'arrow',
      // Near-enough-to-full-draw gets its own bigger/brighter sprite in
      // render.js -- a charged shot should visibly read as one, not just
      // hit harder.
      charged: chargeFraction > 0.85,
    });
    return;
  }
  player.comboStep = (player.comboStep + 1) % 4;
  player.comboTimer = COMBO_WINDOW;
  const reachX0 = player.facing > 0 ? player.x + player.w : player.x - weapon.range;
  const reachX1 = player.facing > 0 ? player.x + player.w + weapon.range : player.x;
  const hitbox = { x: reachX0, y: player.y, w: reachX1 - reachX0, h: player.h };
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    if (rectsOverlap(hitbox, enemy)) applyDamageToEnemy(state, enemy, weapon.damage, player.facing);
  }
  if (player.comboStep === 3) {
    const waveMult = WAVE_DAMAGE_MULT * (weapon.ability?.waveDamageMult || 1);
    state.projectiles.push({
      x: player.facing > 0 ? player.x + player.w : player.x,
      y: player.y + player.h / 2,
      vx: WAVE_SPEED * player.facing,
      damage: Math.round(weapon.damage * waveMult),
      traveled: 0,
      maxRange: WAVE_RANGE,
      kind: 'wave',
    });
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
  if (state.activeDialogue) {
    const wasActive = state.activeDialogue;
    tickDialogue(state, dt);
    // Pressing interact again while a line is still up skips straight to
    // its completion (e.g. opening the forge once Doran's intro finishes)
    // rather than silently eating the press -- but only if tickDialogue
    // didn't already clear it this same frame, or its onComplete would fire
    // twice.
    if (input.interactPressed && state.activeDialogue === wasActive) {
      state.activeDialogue = null;
      if (wasActive.onComplete) wasActive.onComplete(state);
    }
    // Stand still and pause the world for as long as a line is up -- no
    // enemy movement/attacks, no player movement or attack input either, so
    // you can neither get hit nor swing mid-conversation. Also covers the
    // frame a line clears on (whether by timer or the skip above): returning
    // here instead of falling through means this frame's already-spent
    // interactPressed can't ALSO trigger the forgeOpen check below and
    // instantly close whatever onComplete (e.g. opening the forge) just
    // opened -- that takes effect starting next frame's fresh input instead.
    return state;
  }
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
  player.comboTimer = Math.max(0, player.comboTimer - dt);
  if (player.comboTimer <= 0) player.comboStep = -1;
  player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
  player.postDodgeWindow = Math.max(0, player.postDodgeWindow - dt);
  if (player.dodging) {
    player.dodgeTimer -= dt;
    if (player.dodgeTimer <= 0) {
      player.dodging = false;
      player.postDodgeWindow = POST_DODGE_WINDOW;
    }
  }
  state.shake = Math.max(0, state.shake - SHAKE_DECAY * dt);
  updateFloatingTexts(state, dt);

  let dir = 0;
  if (input.left) dir -= 1;
  if (input.right) dir += 1;

  if (input.dodgePressed && !player.dodging && player.dodgeCooldown <= 0 && player.onGround) {
    player.dodging = true;
    player.dodgeTimer = DODGE_DURATION;
    player.dodgeCooldown = DODGE_COOLDOWN;
    // Dashes toward whatever direction is currently held, defaulting to
    // facing -- lets you dodge backward away from a telegraph without first
    // having to turn around, same as most action games.
    player.dodgeDir = dir !== 0 ? dir : player.facing;
    // Reuses the same invuln field hurtPlayer checks -- a fresh hit landing
    // right as a dash ends simply overwrites it with its own (longer,
    // post-hit) window, which is exactly the behavior wanted either way.
    player.invuln = DODGE_DURATION;
  }

  if (player.dodging) {
    player.vx = player.dodgeDir * DODGE_SPEED;
    player.facing = player.dodgeDir;
  } else {
    player.vx = dir * MOVE_SPEED;
    if (dir !== 0) player.facing = dir;
  }

  if (input.jumpPressed && player.jumpsUsed < MAX_JUMPS) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
    player.jumpsUsed += 1;
  }

  // Chargeable weapons (currently just the bow) read attackHeld instead of
  // the one-shot attackPressed: holding builds chargeTime, and releasing is
  // what actually fires. Everything else keeps the plain tap-to-attack path
  // unchanged.
  const chargeable = player.weapon.type === 'ranged' && player.weapon.ability?.chargeable;
  if (chargeable) {
    if (input.attackHeld && player.attackCooldown <= 0) {
      const maxCharge = player.weapon.ability.maxChargeTime || 1;
      player.chargeTime = Math.min(maxCharge, player.chargeTime + dt);
    } else if ((player.chargeTime > 0 || input.attackPressed) && player.attackCooldown <= 0) {
      // Fires on release after however long attackHeld was true (the normal
      // case), but also covers a press-and-release that both landed inside
      // one frame and so never registered as "held" at all -- attackPressed
      // alone still catches that and fires a near-zero-charge shot instead
      // of silently swallowing the tap. Caught by testing headlessly with a
      // single simulated frame, which reproduces exactly that gap.
      performPlayerAttack(state, player.chargeTime);
      player.attackCooldown = player.weapon.cooldown;
      player.swingFlash = SWING_VISUAL;
      player.chargeTime = 0;
    } else {
      player.chargeTime = 0;
    }
  } else if (input.attackPressed && player.attackCooldown <= 0) {
    performPlayerAttack(state, 0);
    player.attackCooldown = player.weapon.cooldown;
    player.swingFlash = SWING_VISUAL;
  }

  updatePhysics(state, dt);
  player.airTime = player.onGround ? 0 : player.airTime + dt;
  updateProjectiles(state, dt);
  updateEnemies(state, dt);
  updatePickups(state);

  if (input.interactPressed && isNearForge(state)) {
    // Doran gets one round of dialogue the first time you reach his forge
    // in a given biome per run -- not every single forge, since there's one
    // in every level and he'd never stop talking otherwise. The forge modal
    // itself waits until his lines finish (see onComplete below) instead of
    // opening underneath them -- the two were overlapping on screen when
    // both showed at once.
    if (!state.seenForgeBiomes.has(state.level.biome)) {
      state.seenForgeBiomes.add(state.level.biome);
      const lines = FORGE_INTRO_LINES[state.level.biome] || [];
      if (lines.length === 0) state.forgeOpen = true;
      else startDialogue(state, 'Doran Emberfist', 'doran', lines, (s) => { s.forgeOpen = true; });
    } else {
      state.forgeOpen = true;
    }
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
