import { createGame, update, upgradeWeapon, upgradeArmor, isNearForge } from './core/game.js';
import { forgeCost, canAffordUpgrade } from './core/items.js';
import { INTRO_LINES } from './core/story.js';
import { renderGame } from './render.js';
import { preloadAssets } from './assets.js';

preloadAssets();

const BEST_DISTANCE_KEY = 'wayfarer-best-distance';

let state = null;
let lastTime = 0;
let held = new Set();
let justPressed = new Set();
// Shown once per page load, not per run -- gates the physics/AI update loop
// (rendering still runs, so the opening scene sits frozen behind the text
// instead of a blank canvas) until "Begin the journey" is clicked. Restarts
// via New Run/Try Again skip straight back into play.
let introShown = true;

function getBestDistance() {
  return Number(localStorage.getItem(BEST_DISTANCE_KEY) || 0);
}

function setBestDistanceIfBetter(dist) {
  if (dist > getBestDistance()) localStorage.setItem(BEST_DISTANCE_KEY, String(Math.round(dist)));
}

function currentDistance() {
  return state.totalDistance + state.player.x;
}

const KEY_MAP = {
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
  ArrowUp: 'jump', w: 'jump', W: 'jump', ' ': 'jump',
  j: 'attack', J: 'attack', f: 'attack', F: 'attack',
  e: 'interact', E: 'interact',
};

window.addEventListener('keydown', (e) => {
  const action = KEY_MAP[e.key];
  if (!action) return;
  e.preventDefault();
  if (!held.has(action)) justPressed.add(action);
  held.add(action);
});

window.addEventListener('keyup', (e) => {
  const action = KEY_MAP[e.key];
  if (!action) return;
  held.delete(action);
});

function bindTouchButton(id, action) {
  const el = document.getElementById(id);
  if (!el) return;
  // Belt-and-braces against the iOS long-press "Copy" callout: CSS
  // -webkit-touch-callout handles it in most cases, but some WebViews still
  // fire a contextmenu event for a held press on a text-bearing button.
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!held.has(action)) justPressed.add(action);
    held.add(action);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture isn't available/valid in every environment; the
      // button still works via pointerup below, just without the drag-off
      // safety net.
    }
  });
  const release = (e) => {
    e.preventDefault();
    held.delete(action);
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
}

[
  ['touch-left', 'left'],
  ['touch-right', 'right'],
  ['touch-jump', 'jump'],
  ['touch-attack', 'attack'],
  ['touch-forge', 'interact'],
].forEach(([id, action]) => bindTouchButton(id, action));

function startNewGame() {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  state = createGame(seed);
  held = new Set();
  justPressed = new Set();
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('header-best').textContent = Math.round(getBestDistance());
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function updateHUD() {
  const p = state.player;
  document.getElementById('hp-fill').style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
  document.getElementById('hp-text').textContent = `${Math.max(0, Math.round(p.hp))}/${p.maxHp}`;
  document.getElementById('stat-gold').textContent = p.gold;
  document.getElementById('stat-scrap').textContent = p.scrap;
  document.getElementById('stat-weapon').textContent = `${p.weapon.name} T${p.weapon.tier}`;
  document.getElementById('stat-armor').textContent = `${p.armor.name} T${p.armor.tier}`;
  document.getElementById('stat-biome').textContent = `${state.level.biome[0].toUpperCase()}${state.level.biome.slice(1)}`;
  document.getElementById('stat-distance').textContent = Math.round(currentDistance());
  const showForgePrompt = isNearForge(state) && !state.forgeOpen;
  document.getElementById('prompt-forge').classList.toggle('hidden', !showForgePrompt);
  document.getElementById('touch-forge').classList.toggle('hidden', !showForgePrompt);
}

const PORTRAIT_PATHS = {
  doran: 'assets/npcs/doran_portrait.png',
};

function updateDialogue() {
  const box = document.getElementById('dialogue-box');
  const d = state.activeDialogue;
  box.classList.toggle('hidden', !d);
  if (!d) return;

  const portraitEl = document.getElementById('dialogue-portrait');
  const portraitSrc = d.portrait && PORTRAIT_PATHS[d.portrait];
  portraitEl.classList.toggle('hidden', !portraitSrc);
  if (portraitSrc) portraitEl.src = portraitSrc;

  const speakerEl = document.getElementById('dialogue-speaker');
  speakerEl.classList.toggle('hidden', !d.speaker);
  speakerEl.textContent = d.speaker || '';

  document.getElementById('dialogue-text').textContent = d.lines[d.lineIndex];
}

function updateMessages() {
  const list = document.getElementById('message-log');
  const recent = state.messages.slice(-4);
  list.innerHTML = '';
  for (const msg of recent) {
    const li = document.createElement('li');
    li.textContent = msg;
    list.appendChild(li);
  }
}

function renderForgeUI() {
  const modal = document.getElementById('forge-modal');
  modal.classList.toggle('hidden', !state.forgeOpen);
  if (!state.forgeOpen) return;

  const p = state.player;
  const wCost = forgeCost(p.weapon.tier);
  const aCost = forgeCost(p.armor.tier);

  document.getElementById('forge-weapon-name').textContent = `${p.weapon.name} — T${p.weapon.tier}`;
  document.getElementById('forge-weapon-stats').textContent = `${p.weapon.damage} dmg, ${p.weapon.cooldown.toFixed(2)}s cooldown`;
  const wBtn = document.getElementById('forge-weapon-btn');
  const wCanAfford = canAffordUpgrade(p, p.weapon.tier);
  wBtn.textContent = p.weapon.tier >= 6 ? 'Max tier' : `Upgrade (${wCost.scrap} scrap, ${wCost.gold} gold)`;
  wBtn.disabled = !wCanAfford;

  document.getElementById('forge-armor-name').textContent = `${p.armor.name} — T${p.armor.tier}`;
  document.getElementById('forge-armor-stats').textContent = `${p.armor.defense} defense`;
  const aBtn = document.getElementById('forge-armor-btn');
  const aCanAfford = canAffordUpgrade(p, p.armor.tier);
  aBtn.textContent = p.armor.tier >= 6 ? 'Max tier' : `Upgrade (${aCost.scrap} scrap, ${aCost.gold} gold)`;
  aBtn.disabled = !aCanAfford;

  document.getElementById('forge-currency').textContent = `${p.gold} gold, ${p.scrap} scrap`;
}

function showGameOver() {
  const dist = currentDistance();
  setBestDistanceIfBetter(dist);
  document.getElementById('final-distance').textContent = Math.round(dist);
  document.getElementById('final-biome').textContent = state.level.biome;
  document.getElementById('final-weapon').textContent = `${state.player.weapon.name} T${state.player.weapon.tier}`;
  document.getElementById('final-armor').textContent = `${state.player.armor.name} T${state.player.armor.tier}`;
  document.getElementById('best-distance').textContent = Math.round(getBestDistance());
  document.getElementById('header-best').textContent = Math.round(getBestDistance());
  document.getElementById('game-over').classList.remove('hidden');
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (!state.gameOver && !introShown) {
    const input = {
      left: held.has('left'),
      right: held.has('right'),
      jumpPressed: justPressed.has('jump'),
      attackPressed: justPressed.has('attack'),
      interactPressed: justPressed.has('interact'),
    };
    justPressed.clear();
    update(state, input, dt);
  }

  renderGame(document.getElementById('game-canvas'), state, now / 1000);
  updateHUD();
  updateMessages();
  updateDialogue();
  renderForgeUI();

  if (state.gameOver) {
    showGameOver();
    return;
  }
  requestAnimationFrame(loop);
}

document.getElementById('forge-weapon-btn').addEventListener('click', () => {
  upgradeWeapon(state);
});
document.getElementById('forge-armor-btn').addEventListener('click', () => {
  upgradeArmor(state);
});
document.getElementById('forge-close-btn').addEventListener('click', () => {
  state.forgeOpen = false;
});
document.getElementById('restart-btn').addEventListener('click', startNewGame);
document.getElementById('new-run-btn').addEventListener('click', startNewGame);

const storyLines = document.getElementById('story-lines');
for (const line of INTRO_LINES) {
  const p = document.createElement('p');
  p.textContent = line;
  storyLines.appendChild(p);
}
document.getElementById('begin-btn').addEventListener('click', () => {
  introShown = false;
  document.getElementById('story-intro').classList.add('hidden');
});

window.addEventListener('keydown', (e) => {
  if (state && state.gameOver && (e.key === 'r' || e.key === 'R')) startNewGame();
});

startNewGame();
