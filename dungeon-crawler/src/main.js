import { createGame, attemptPlayerMove, waitTurn, drinkPotion } from './core/game.js';
import { renderGame } from './render.js';

const BEST_DEPTH_KEY = 'dungeon-crawler-best-depth';

let state = null;

function getBestDepth() {
  return Number(localStorage.getItem(BEST_DEPTH_KEY) || 0);
}

function setBestDepthIfBetter(depth) {
  if (depth > getBestDepth()) localStorage.setItem(BEST_DEPTH_KEY, String(depth));
}

function startNewGame() {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  state = createGame(seed);
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('header-best-depth').textContent = getBestDepth();
  render();
}

function updateHUD() {
  const { player, depth } = state;
  document.getElementById('hp-text').textContent = `${Math.max(0, player.hp)}/${player.maxHp}`;
  document.getElementById('hp-fill').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  document.getElementById('stat-depth').textContent = depth;
  document.getElementById('stat-gold').textContent = player.gold;
  document.getElementById('stat-potions').textContent = player.potions;
  document.getElementById('stat-level').textContent = player.level;
  document.getElementById('stat-xp').textContent = `${player.xp}/${player.xpToNext}`;
}

function updateMessages() {
  const list = document.getElementById('message-log');
  const recent = state.messages.slice(-6);
  list.innerHTML = '';
  for (const msg of recent) {
    const li = document.createElement('li');
    li.textContent = msg;
    list.appendChild(li);
  }
  list.scrollTop = list.scrollHeight;
}

function showGameOver() {
  setBestDepthIfBetter(state.depth);
  document.getElementById('final-depth').textContent = state.depth;
  document.getElementById('final-gold').textContent = state.player.gold;
  document.getElementById('final-level').textContent = state.player.level;
  document.getElementById('best-depth').textContent = getBestDepth();
  document.getElementById('header-best-depth').textContent = getBestDepth();
  document.getElementById('game-over').classList.remove('hidden');
}

function render() {
  const canvas = document.getElementById('game-canvas');
  renderGame(canvas, state);
  updateHUD();
  updateMessages();
  if (state.gameOver) showGameOver();
}

const KEY_MOVES = {
  ArrowUp: [0, -1],
  w: [0, -1],
  W: [0, -1],
  ArrowDown: [0, 1],
  s: [0, 1],
  S: [0, 1],
  ArrowLeft: [-1, 0],
  a: [-1, 0],
  A: [-1, 0],
  ArrowRight: [1, 0],
  d: [1, 0],
  D: [1, 0],
};

window.addEventListener('keydown', (e) => {
  if (!state) return;
  if (state.gameOver) {
    if (e.key === 'r' || e.key === 'R') startNewGame();
    return;
  }
  if (KEY_MOVES[e.key]) {
    e.preventDefault();
    const [dx, dy] = KEY_MOVES[e.key];
    attemptPlayerMove(state, dx, dy);
    render();
  } else if (e.key === '.' || e.key === 'z' || e.key === 'Z') {
    e.preventDefault();
    waitTurn(state);
    render();
  } else if (e.key === 'p' || e.key === 'P' || e.key === 'q' || e.key === 'Q') {
    e.preventDefault();
    drinkPotion(state);
    render();
  }
});

document.getElementById('restart-btn').addEventListener('click', startNewGame);
document.getElementById('new-run-btn').addEventListener('click', startNewGame);

startNewGame();
