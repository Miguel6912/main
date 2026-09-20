import { makeRng, randInt, chance } from './rng.js';
import { generateDungeon, computeFOV, isWalkable, TILE } from './dungeon.js';
import { createPlayer, createMonster, resolveAttack, levelUpIfReady } from './entities.js';

export const DUNGEON_WIDTH = 42;
export const DUNGEON_HEIGHT = 22;
export const FOV_RADIUS = 7;
const MAX_MESSAGES = 200;

function addMessage(state, text) {
  state.messages.push(text);
  if (state.messages.length > MAX_MESSAGES) state.messages.shift();
}

function randomTileInRoom(rng, room) {
  return {
    x: randInt(rng, room.x, room.x + room.w - 1),
    y: randInt(rng, room.y, room.y + room.h - 1),
  };
}

function isOccupied(state, x, y, exclude) {
  if (state.player.x === x && state.player.y === y) return true;
  return state.monsters.some((m) => m !== exclude && m.x === x && m.y === y);
}

function spawnMonsters(dungeon, depth, rng) {
  const monsters = [];
  const spawnRooms = dungeon.rooms.slice(1); // never spawn in the start room
  if (spawnRooms.length === 0) return monsters;
  const target = Math.min(3 + depth, 14);
  let attempts = 0;
  while (monsters.length < target && attempts < target * 20) {
    attempts++;
    const room = spawnRooms[randInt(rng, 0, spawnRooms.length - 1)];
    const { x, y } = randomTileInRoom(rng, room);
    if (dungeon.grid[y][x] !== TILE.FLOOR) continue;
    if (monsters.some((m) => m.x === x && m.y === y)) continue;
    monsters.push(createMonster(depth, rng, x, y));
  }
  return monsters;
}

function spawnItems(dungeon, depth, rng) {
  const items = [];
  const count = randInt(rng, 3, 5);
  let attempts = 0;
  while (items.length < count && attempts < count * 20) {
    attempts++;
    const room = dungeon.rooms[randInt(rng, 0, dungeon.rooms.length - 1)];
    const { x, y } = randomTileInRoom(rng, room);
    if (dungeon.grid[y][x] !== TILE.FLOOR) continue;
    if (x === dungeon.start.x && y === dungeon.start.y) continue;
    if (items.some((i) => i.x === x && i.y === y)) continue;
    if (chance(rng, 0.35)) {
      items.push({ x, y, kind: 'potion' });
    } else {
      items.push({ x, y, kind: 'gold', amount: randInt(rng, 3 + depth, 10 + depth * 2) });
    }
  }
  return items;
}

function recomputeVisibility(state) {
  const { grid, width, height } = state.dungeon;
  const vis = computeFOV(grid, width, height, state.player.x, state.player.y, FOV_RADIUS);
  state.visible = vis;
  for (const key of vis) state.discovered.add(key);
}

function generateFloor(state, depth) {
  state.depth = depth;
  const dungeon = generateDungeon({
    width: DUNGEON_WIDTH,
    height: DUNGEON_HEIGHT,
    rng: state.rng,
  });
  state.dungeon = dungeon;
  state.discovered = new Set();

  if (!state.player) {
    state.player = createPlayer(dungeon.start.x, dungeon.start.y);
  } else {
    state.player.x = dungeon.start.x;
    state.player.y = dungeon.start.y;
  }

  state.monsters = spawnMonsters(dungeon, depth, state.rng);
  state.items = spawnItems(dungeon, depth, state.rng);
  recomputeVisibility(state);
  addMessage(state, depth === 1 ? 'You enter the dungeon.' : `You descend to depth ${depth}.`);
}

export function createGame(seed) {
  const state = {
    rng: makeRng(seed >>> 0),
    depth: 0,
    dungeon: null,
    player: null,
    monsters: [],
    items: [],
    visible: new Set(),
    discovered: new Set(),
    messages: [],
    turn: 0,
    gameOver: false,
  };
  generateFloor(state, 1);
  return state;
}

function pickupCheck(state) {
  const { player, items } = state;
  const idx = items.findIndex((i) => i.x === player.x && i.y === player.y);
  if (idx === -1) return;
  const item = items[idx];
  if (item.kind === 'gold') {
    player.gold += item.amount;
    addMessage(state, `You pick up ${item.amount} gold.`);
  } else if (item.kind === 'potion') {
    player.potions += 1;
    addMessage(state, 'You pick up a potion.');
  }
  items.splice(idx, 1);
}

function monsterStep(state, monster) {
  const { player } = state;
  const dx = player.x - monster.x;
  const dy = player.y - monster.y;
  if (Math.abs(dx) + Math.abs(dy) === 1) return { type: 'attack' };

  const options = [];
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx !== 0) options.push([Math.sign(dx), 0]);
    if (dy !== 0) options.push([0, Math.sign(dy)]);
  } else {
    if (dy !== 0) options.push([0, Math.sign(dy)]);
    if (dx !== 0) options.push([Math.sign(dx), 0]);
  }
  for (const [sx, sy] of options) {
    const nx = monster.x + sx;
    const ny = monster.y + sy;
    if (isWalkable(state.dungeon.grid, nx, ny) && !isOccupied(state, nx, ny, monster)) {
      return { type: 'move', x: nx, y: ny };
    }
  }
  return { type: 'idle' };
}

function monsterTurn(state) {
  for (const monster of state.monsters) {
    if (state.gameOver) return;
    if (!monster.awake) {
      if (state.visible.has(`${monster.x},${monster.y}`)) monster.awake = true;
      else continue;
    }
    const action = monsterStep(state, monster);
    if (action.type === 'attack') {
      const { damage, killed } = resolveAttack(monster, state.player, state.rng);
      addMessage(state, `The ${monster.name} hits you for ${damage}.`);
      if (killed) {
        state.gameOver = true;
        addMessage(state, `You die on depth ${state.depth}.`);
        return;
      }
    } else if (action.type === 'move') {
      monster.x = action.x;
      monster.y = action.y;
    }
  }
}

function descend(state) {
  generateFloor(state, state.depth + 1);
  const heal = Math.floor(state.player.maxHp * 0.2);
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
}

function finishPlayerTurn(state) {
  recomputeVisibility(state);
  const { grid } = state.dungeon;
  if (grid[state.player.y][state.player.x] === TILE.STAIRS) {
    descend(state);
    return;
  }
  monsterTurn(state);
  state.turn += 1;
}

export function attemptPlayerMove(state, dx, dy) {
  if (state.gameOver) return state;
  const { player, dungeon, monsters } = state;
  const nx = player.x + dx;
  const ny = player.y + dy;

  const target = monsters.find((m) => m.x === nx && m.y === ny);
  if (target) {
    const { damage, killed } = resolveAttack(player, target, state.rng);
    addMessage(state, `You hit the ${target.name} for ${damage}.`);
    if (killed) {
      addMessage(state, `The ${target.name} dies!`);
      player.xp += target.xp;
      state.monsters = state.monsters.filter((m) => m !== target);
      const gains = levelUpIfReady(player);
      for (const lvl of gains) addMessage(state, `You reached level ${lvl}!`);
    }
    finishPlayerTurn(state);
  } else if (isWalkable(dungeon.grid, nx, ny)) {
    player.x = nx;
    player.y = ny;
    pickupCheck(state);
    finishPlayerTurn(state);
  } else {
    addMessage(state, 'You bump into a wall.');
  }
  return state;
}

export function waitTurn(state) {
  if (state.gameOver) return state;
  addMessage(state, 'You wait.');
  finishPlayerTurn(state);
  return state;
}

export function drinkPotion(state) {
  if (state.gameOver) return state;
  if (state.player.potions <= 0) {
    addMessage(state, 'No potions to drink.');
    return state;
  }
  state.player.potions -= 1;
  const heal = Math.max(1, Math.floor(state.player.maxHp * 0.5));
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
  addMessage(state, `You drink a potion and recover ${heal} HP.`);
  finishPlayerTurn(state);
  return state;
}
