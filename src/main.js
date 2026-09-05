import { EventBus } from './core/EventBus.js';
import { GameLoop } from './core/GameLoop.js';
import { RNG } from './core/RNG.js';
import { SaveManager } from './core/SaveManager.js';
import { Input } from './core/Input.js';

import { TimeSystem } from './world/TimeSystem.js';
import { PLAYER_SPAWN, HOTSPOTS, FORAGE_SPOTS } from './world/MapData.js';

import { Player } from './entities/Player.js';
import { NPC } from './entities/NPC.js';
import { NPCS, getNpcData } from './data/npcs.js';
import { ITEMS } from './data/shopItems.js';

import { MemorySystem } from './systems/MemorySystem.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { PropertySystem } from './systems/PropertySystem.js';
import { EventSystem } from './systems/EventSystem.js';
import { DialogueSystem } from './systems/DialogueSystem.js';

import { AudioManager } from './audio/AudioManager.js';
import { ParticleSystem } from './render/Particles.js';
import { Renderer } from './render/Renderer.js';
import { UIManager } from './ui/UIManager.js';

const WISHES = [
  'You wish for a warm loaf of bread. The well remains unmoved by bread-based requests.',
  'You wish for good fortune. Somewhere, a coin is probably found by someone. Possibly you.',
  'You wish to see something magical. The forest, ever so slightly, seems to lean closer.',
  'You wish Sir Reginald would catch that goat. The universe declines to comment.',
];

// ---------- Canvas setup ----------
const canvas = document.getElementById('game-canvas');
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ---------- Core systems ----------
const bus = new EventBus();
const rng = new RNG();
const time = new TimeSystem(bus);
const player = new Player(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
const npcs = NPCS.map((d) => new NPC(d));
const memory = new MemorySystem(NPCS.map((n) => n.id));
const economy = new EconomySystem(bus);
const property = new PropertySystem(bus);
const worldFlags = {};
const eventSystem = new EventSystem({ bus, rng, economy, memory, worldFlags, npcs });
const dialogue = new DialogueSystem({ memory, time, economy, eventSystem, worldFlags, bus, playerName: player.name });
const audio = new AudioManager();
const particles = new ParticleSystem(rng);
const renderer = new Renderer(canvas);
const input = new Input();

economy.rollDailyJob(rng);

let interactTarget = null;
let rareFlourish = null;
let clockT = 0;
let journalTab = 'witnessed';

// ---------- Save / Load ----------
function gatherState() {
  return {
    time: time.serialize(),
    player: player.serialize(),
    memory: memory.serialize(),
    economy: economy.serialize(),
    property: property.serialize(),
    eventSystem: eventSystem.serialize(),
    worldFlags: { ...worldFlags },
    audio: audio.serialize(),
    rngSeed: rng.seed,
  };
}

function applyState(data) {
  if (!data) return;
  time.deserialize(data.time);
  player.deserialize(data.player);
  memory.deserialize(data.memory);
  economy.deserialize(data.economy);
  property.deserialize(data.property);
  eventSystem.deserialize(data.eventSystem);
  Object.keys(worldFlags).forEach((k) => delete worldFlags[k]);
  Object.assign(worldFlags, data.worldFlags || {});
  audio.deserialize(data.audio);
  if (data.rngSeed) rng.seed = data.rngSeed;
}

// ---------- UI wiring ----------
function openShopPanel() {
  ui.openShop({ coins: economy.coins, inventory: economy.inventory, forageUpgradeOwned: economy.forageUpgrade });
}

function openPropertyPanel() {
  const pending = property.pendingEarnings(time.dayCount);
  ui.openProperty({ tier: property.tier, nextTier: property.nextTier, pending, level: property.level });
}

function refreshJournal() {
  ui.openJournal({
    witnessed: eventSystem.witnessed,
    rumors: eventSystem.missedGossip.filter((g) => g.shared).map((g) => ({ name: g.name, day: g.day, text: g.textMissed })),
    tab: journalTab,
  });
}

function showJobBoard() {
  const job = economy.dailyJob;
  if (!job) {
    ui.showToast('The notice board is empty today.', 'info');
    return;
  }
  const turnInName = getNpcData(job.turnIn).name;
  const giverName = getNpcData(job.giver).name;
  let status = '';
  if (job.completed) status = ' (already completed today -- thank you!)';
  else if (job.accepted) status = ` (in progress -- deliver to ${turnInName})`;
  else status = ` Talk to ${giverName} to take it on.`;
  ui.showToast(`${job.boardDesc}${status}`, 'info');
}

function doForage(id) {
  const result = economy.forage(id, time.dayCount);
  if (result) {
    audio.playCoin();
    const def = ITEMS[result.item];
    ui.showToast(`Gathered ${result.qty}x ${def.icon} ${def.name}.`, 'coin');
  } else {
    ui.showToast('Nothing here right now -- check back tomorrow.', 'info');
  }
}

const ui = new UIManager({
  onTogglePause: () => time.togglePause(),
  onSetSpeed: (n) => time.setSpeed(n),
  onSkip: () => time.skipToNextPhase(),
  onOpenJournal: () => { journalTab = 'witnessed'; refreshJournal(); },
  onJournalTab: (tab) => { journalTab = tab; refreshJournal(); },
  onCloseJournal: () => ui.closeJournal(),
  onOpenBag: () => ui.openBag(economy.inventory),
  onCloseBag: () => ui.closeBag(),
  onSave: () => {
    const ok = SaveManager.save(gatherState());
    ui.showToast(ok ? 'Game saved.' : 'Save failed.', ok ? 'coin' : 'info');
  },
  onLoad: () => {
    const data = SaveManager.load();
    if (!data) { ui.showToast('No save found.', 'info'); return; }
    applyState(data);
    ui.showToast('Game loaded.', 'coin');
  },
  onToggleSound: () => {
    const muted = audio.toggleMuted();
    document.getElementById('btn-sound').textContent = muted ? '\u{1F507}' : '\u{1F508}';
  },
  onCloseShop: () => ui.closeShop(),
  onBuy: (id) => {
    const res = economy.buyItem(id);
    if (res.ok) { audio.playCoin(); ui.showToast('Purchased!', 'coin'); }
    else ui.showToast(res.reason === 'cant-afford' ? "You can't afford that yet." : 'Already owned.', 'info');
    openShopPanel();
  },
  onSell: (id) => {
    const res = economy.sellItem(id, 1);
    if (res.ok) { audio.playCoin(); ui.showToast(`Sold for ${res.coins} coins.`, 'coin'); }
    openShopPanel();
  },
  onCloseProperty: () => ui.closeProperty(),
  onCollectProperty: () => {
    const amt = property.collect(economy, time.dayCount);
    if (amt > 0) { audio.playCoin(); ui.showToast(`Collected ${amt} coins.`, 'coin'); }
    openPropertyPanel();
  },
  onUpgradeProperty: () => {
    const res = property.buyOrUpgrade(economy, time.dayCount);
    if (res.ok) { audio.playCoin(); ui.showToast(`You now own: ${property.tier.name}!`, 'coin'); }
    else ui.showToast(res.reason === 'cant-afford' ? "You can't afford that yet." : 'Fully upgraded already.', 'info');
    openPropertyPanel();
  },
  onCloseEventPopup: () => ui.hideEventPopup(),
  onDialogueChoose: (idx) => {
    audio.playUiBlip();
    const render = dialogue.choose(idx);
    if (render) ui.showDialogue(render);
    else ui.closeDialogue();
  },
  onNewGame: () => { ui.hideStartOverlay(); audio.resume(); },
  onContinueGame: () => {
    const data = SaveManager.load();
    applyState(data);
    ui.hideStartOverlay();
    audio.resume();
  },
});

bus.on('ui:openShop', openShopPanel);
bus.on('time:newDay', () => economy.rollDailyJob(rng));
bus.on('time:newSeason', ({ season }) => ui.showToast(`${season[0].toUpperCase()}${season.slice(1)} has arrived.`, 'info'));
bus.on('event:witnessed', ({ event, location }) => {
  ui.showEventPopup(event.name, event.textWitnessed, !!event.rareVisual);
  if (event.rareVisual) {
    audio.playMagicalChime();
    const loc = location || { x: player.x, y: player.y };
    particles.burst(loc.x, loc.y, { color: '#fff4c8', count: 40, speed: 90 });
    rareFlourish = { x: loc.x, y: loc.y, timer: 3 };
  } else {
    audio.playUiBlip();
  }
});

// ---------- Input ----------
function getInteractTarget() {
  let best = null;
  let bestDist = Infinity;
  for (const npc of npcs) {
    const d = Math.hypot(player.x - npc.x, player.y - npc.y);
    if (d < 60 && d < bestDist) { best = { type: 'npc', id: npc.id, prompt: `Talk to ${npc.data.name}` }; bestDist = d; }
  }
  for (const h of HOTSPOTS) {
    const d = Math.hypot(player.x - h.x, player.y - h.y);
    if (d < h.radius && d < bestDist) { best = { type: 'hotspot', id: h.id, prompt: h.prompt }; bestDist = d; }
  }
  for (const f of FORAGE_SPOTS) {
    const d = Math.hypot(player.x - f.x, player.y - f.y);
    if (d < f.radius && d < bestDist) { best = { type: 'forage', id: f.id, prompt: `Forage: ${f.label}` }; bestDist = d; }
  }
  return best;
}

function doInteract() {
  if (ui.anyModalOpen()) return;
  const target = getInteractTarget();
  if (!target) return;
  audio.resume();
  if (target.type === 'npc') {
    const render = dialogue.open(target.id);
    ui.showDialogue(render);
  } else if (target.type === 'hotspot') {
    if (target.id === 'property') openPropertyPanel();
    else if (target.id === 'jobboard') showJobBoard();
    else if (target.id === 'well') ui.showToast(rng.pick(WISHES), 'friend');
  } else if (target.type === 'forage') {
    doForage(target.id);
  }
}

input.onInteract(doInteract);
input.onClose(() => {
  if (ui.isDialogueOpen()) dialogue.close();
  if (ui.anyModalOpen()) ui.closeAllModals();
});
input.onAnyKey(() => audio.resume());
canvas.addEventListener('click', () => audio.resume());

// ---------- Game loop ----------
function update(dt) {
  clockT += dt;
  time.update(dt);

  const blocked = ui.anyModalOpen();
  player.update(dt, blocked ? { isDown: () => false } : input);
  for (const npc of npcs) npc.update(dt, time);

  if (!blocked) eventSystem.update(dt, { player, time });

  particles.updateAmbient(dt, { x: player.x - canvas.width / 2, y: player.y - canvas.height / 2, w: canvas.width, h: canvas.height }, time.season, time.phase);
  particles.update(dt);
  audio.updateAmbience(dt, time.phase, time.season);

  if (rareFlourish) {
    rareFlourish.timer -= dt;
    if (rareFlourish.timer <= 0) rareFlourish = null;
  }

  if (!blocked) {
    interactTarget = getInteractTarget();
    ui.setInteractPrompt(interactTarget ? interactTarget.prompt : null);
  } else {
    interactTarget = null;
    ui.setInteractPrompt(null);
  }

  ui.updateHUD({
    dayLabel: `Day ${time.dayCount + 1}`,
    season: time.season,
    phase: time.phase,
    timeStr: time.formattedTime(),
    coins: economy.coins,
    speed: time.speed,
  });
}

function render() {
  renderer.render({
    player,
    npcs,
    time,
    economy,
    propertyLevel: property.level,
    particles,
    interactTarget,
    clockT,
    rareFlourish,
  });
}

const loop = new GameLoop({ update, render });
loop.start();

ui.showStartOverlay(SaveManager.hasSave());
