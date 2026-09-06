import { ITEMS, SHOP_BUY_LIST, SHOP_SELL_LIST } from '../data/shopItems.js';

const SEASON_ICON = { spring: '\u{1F338}', summer: '\u{2600}\u{FE0F}', autumn: '\u{1F342}', winter: '\u{2744}\u{FE0F}' };
const PHASE_ICON = { dawn: '\u{1F305}', day: '\u{2600}\u{FE0F}', dusk: '\u{1F307}', night: '\u{1F319}' };

function el(id) {
  return document.getElementById(id);
}

// All DOM/HUD glue in one place. This module owns no game state -- it just
// renders whatever main.js hands it and forwards clicks back through the
// `handlers` callbacks, so the game logic never touches the DOM directly.
export class UIManager {
  constructor(handlers) {
    this.handlers = handlers;
    this._cacheDom();
    this._bindStaticEvents();
  }

  _cacheDom() {
    this.dom = {
      hudDate: el('hud-date'),
      coinsValue: el('coins-value'),
      btnPause: el('btn-pause'),
      btnSpeed1: el('btn-speed1'),
      btnSpeed2: el('btn-speed2'),
      btnSpeed4: el('btn-speed4'),
      interactPrompt: el('interact-prompt'),
      toastContainer: el('toast-container'),
      dialogueBox: el('dialogue-box'),
      dialogueSpeaker: el('dialogue-speaker'),
      dialogueText: el('dialogue-text'),
      dialogueOptions: el('dialogue-options'),
      shopPanel: el('shop-panel'),
      shopTitle: el('shop-title'),
      shopCoins: el('shop-coins'),
      shopBuyList: el('shop-buy-list'),
      shopSellList: el('shop-sell-list'),
      propertyPanel: el('property-panel'),
      propertyTitle: el('property-title'),
      propertyDesc: el('property-desc'),
      propertyIncome: el('property-income'),
      propertyActions: el('property-actions'),
      ciderPanel: el('cider-panel'),
      ciderDesc: el('cider-desc'),
      ciderStatus: el('cider-status'),
      ciderActions: el('cider-actions'),
      journalPanel: el('journal-panel'),
      journalList: el('journal-list'),
      journalTabWitnessed: el('journal-tab-witnessed'),
      journalTabRumors: el('journal-tab-rumors'),
      bagPanel: el('bag-panel'),
      bagList: el('bag-list'),
      eventPopup: el('event-popup'),
      eventPopupTitle: el('event-popup-title'),
      eventPopupText: el('event-popup-text'),
      startOverlay: el('start-overlay'),
      btnContinueGame: el('btn-continue-game'),
    };
  }

  _bindStaticEvents() {
    const h = this.handlers;
    el('btn-pause').addEventListener('click', () => h.onTogglePause());
    el('btn-speed1').addEventListener('click', () => h.onSetSpeed(1));
    el('btn-speed2').addEventListener('click', () => h.onSetSpeed(2));
    el('btn-speed4').addEventListener('click', () => h.onSetSpeed(4));
    el('btn-skip').addEventListener('click', () => h.onSkip());
    el('btn-journal').addEventListener('click', () => h.onOpenJournal());
    el('btn-bag').addEventListener('click', () => h.onOpenBag());
    el('btn-save').addEventListener('click', () => h.onSave());
    el('btn-load').addEventListener('click', () => h.onLoad());
    el('btn-sound').addEventListener('click', () => h.onToggleSound());
    el('shop-close').addEventListener('click', () => h.onCloseShop());
    el('property-close').addEventListener('click', () => h.onCloseProperty());
    el('cider-close').addEventListener('click', () => h.onCloseCider());
    el('journal-close').addEventListener('click', () => h.onCloseJournal());
    el('bag-close').addEventListener('click', () => h.onCloseBag());
    el('event-popup-close').addEventListener('click', () => h.onCloseEventPopup());
    el('btn-new-game').addEventListener('click', () => h.onNewGame());
    el('btn-continue-game').addEventListener('click', () => h.onContinueGame());
    el('journal-tab-witnessed').addEventListener('click', () => h.onJournalTab('witnessed'));
    el('journal-tab-rumors').addEventListener('click', () => h.onJournalTab('rumors'));
  }

  // --- HUD ---
  updateHUD({ dayLabel, season, phase, timeStr, coins, speed }) {
    this.dom.hudDate.textContent = `${PHASE_ICON[phase] || ''} ${timeStr} · ${SEASON_ICON[season] || ''} ${season[0].toUpperCase()}${season.slice(1)} · ${dayLabel}`;
    this.dom.coinsValue.textContent = coins;
    this.dom.btnPause.textContent = speed === 0 ? '▶' : '⏸';
    for (const [n, id] of [[1, 'btnSpeed1'], [2, 'btnSpeed2'], [4, 'btnSpeed4']]) {
      this.dom[id].classList.toggle('active', speed === n);
    }
  }

  setInteractPrompt(text) {
    if (!text) {
      this.dom.interactPrompt.classList.add('hidden');
      return;
    }
    this.dom.interactPrompt.textContent = `[E] ${text}`;
    this.dom.interactPrompt.classList.remove('hidden');
  }

  showToast(text, kind = 'info') {
    const div = document.createElement('div');
    div.className = `toast toast-${kind}`;
    div.textContent = text;
    this.dom.toastContainer.appendChild(div);
    requestAnimationFrame(() => div.classList.add('show'));
    setTimeout(() => {
      div.classList.remove('show');
      setTimeout(() => div.remove(), 400);
    }, 4200);
  }

  // --- Dialogue ---
  showDialogue(render) {
    this.dom.dialogueBox.classList.remove('hidden');
    this.dom.dialogueSpeaker.textContent = render.npcName;
    this.dom.dialogueText.textContent = render.text;
    this.dom.dialogueOptions.innerHTML = '';
    render.options.forEach((text, idx) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-option';
      btn.textContent = text;
      btn.addEventListener('click', () => this.handlers.onDialogueChoose(idx));
      this.dom.dialogueOptions.appendChild(btn);
    });
  }

  closeDialogue() {
    this.dom.dialogueBox.classList.add('hidden');
  }

  isDialogueOpen() {
    return !this.dom.dialogueBox.classList.contains('hidden');
  }

  // --- Shop ---
  openShop({ coins, inventory, forageUpgradeOwned }) {
    this.dom.shopPanel.classList.remove('hidden');
    this.dom.shopTitle.textContent = "Bramble's General Store";
    this.dom.shopCoins.textContent = `\u{1FA99} ${coins} coins`;
    this.dom.shopBuyList.innerHTML = '';
    for (const id of SHOP_BUY_LIST) {
      const def = ITEMS[id];
      if (def.oneTime && forageUpgradeOwned) continue;
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `<span>${def.icon} ${def.name}</span><span>${def.buyPrice}c</span>`;
      const btn = document.createElement('button');
      btn.textContent = 'Buy';
      btn.disabled = coins < def.buyPrice;
      btn.addEventListener('click', () => this.handlers.onBuy(id));
      row.appendChild(btn);
      this.dom.shopBuyList.appendChild(row);
    }
    this.dom.shopSellList.innerHTML = '';
    for (const id of SHOP_SELL_LIST) {
      const qty = inventory[id] || 0;
      if (qty <= 0) continue;
      const def = ITEMS[id];
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `<span>${def.icon} ${def.name} x${qty}</span><span>${def.sellPrice}c ea</span>`;
      const btn = document.createElement('button');
      btn.textContent = 'Sell 1';
      btn.addEventListener('click', () => this.handlers.onSell(id));
      row.appendChild(btn);
      this.dom.shopSellList.appendChild(row);
    }
    if (!this.dom.shopSellList.children.length) {
      this.dom.shopSellList.innerHTML = '<p class="empty-hint">Nothing to sell yet -- try foraging in the forest.</p>';
    }
  }

  closeShop() {
    this.dom.shopPanel.classList.add('hidden');
  }

  // --- Property ---
  openProperty({ tier, nextTier, pending, level }) {
    this.dom.propertyPanel.classList.remove('hidden');
    this.dom.propertyTitle.textContent = tier.name;
    this.dom.propertyDesc.textContent = tier.desc;
    this.dom.propertyIncome.textContent = level > 0
      ? `Earning ${tier.incomePerDay} coins/day. ${pending} coins waiting to be collected.`
      : 'Not yet owned.';
    this.dom.propertyActions.innerHTML = '';
    if (pending > 0) {
      const collectBtn = document.createElement('button');
      collectBtn.textContent = `Collect ${pending} coins`;
      collectBtn.addEventListener('click', () => this.handlers.onCollectProperty());
      this.dom.propertyActions.appendChild(collectBtn);
    }
    if (nextTier) {
      const buyBtn = document.createElement('button');
      buyBtn.textContent = level === 0 ? `Buy for ${nextTier.cost} coins` : `Upgrade to ${nextTier.name} (${nextTier.cost} coins)`;
      buyBtn.addEventListener('click', () => this.handlers.onUpgradeProperty());
      this.dom.propertyActions.appendChild(buyBtn);
    } else {
      const maxed = document.createElement('p');
      maxed.className = 'empty-hint';
      maxed.textContent = 'Fully upgraded -- the pride of the village high street.';
      this.dom.propertyActions.appendChild(maxed);
    }
  }

  closeProperty() {
    this.dom.propertyPanel.classList.add('hidden');
  }

  // --- Cider press ---
  openCider({ stage, daysRemaining, requiredApples, appleCount }) {
    this.dom.ciderPanel.classList.remove('hidden');
    this.dom.ciderActions.innerHTML = '';
    if (stage === 'empty') {
      this.dom.ciderDesc.textContent = 'A sturdy apple press, empty and waiting. Bring apples to start a batch of cider.';
      this.dom.ciderStatus.textContent = `You have ${appleCount} apple${appleCount === 1 ? '' : 's'} (need ${requiredApples}).`;
      const startBtn = document.createElement('button');
      startBtn.textContent = `Press ${requiredApples} Apples`;
      startBtn.disabled = appleCount < requiredApples;
      startBtn.addEventListener('click', () => this.handlers.onStartCider());
      this.dom.ciderActions.appendChild(startBtn);
    } else if (stage === 'fermenting') {
      this.dom.ciderDesc.textContent = 'The pressed juice is settling into the barrel, working its way toward cider.';
      this.dom.ciderStatus.textContent = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left to ferment.`;
    } else {
      this.dom.ciderDesc.textContent = 'The cider is ready to bottle.';
      this.dom.ciderStatus.textContent = 'Sweet and a little sharp -- smells about right.';
      const collectBtn = document.createElement('button');
      collectBtn.textContent = 'Bottle the Cider';
      collectBtn.addEventListener('click', () => this.handlers.onCollectCider());
      this.dom.ciderActions.appendChild(collectBtn);
    }
  }

  closeCider() {
    this.dom.ciderPanel.classList.add('hidden');
  }

  // --- Journal ---
  openJournal({ witnessed, rumors, tab }) {
    this.dom.journalPanel.classList.remove('hidden');
    this.dom.journalTabWitnessed.classList.toggle('active', tab === 'witnessed');
    this.dom.journalTabRumors.classList.toggle('active', tab === 'rumors');
    const list = tab === 'witnessed' ? witnessed : rumors;
    this.dom.journalList.innerHTML = '';
    if (list.length === 0) {
      this.dom.journalList.innerHTML = `<p class="empty-hint">${tab === 'witnessed' ? "Nothing witnessed yet -- get out and explore the village." : 'No rumours heard yet -- ask villagers for news.'}</p>`;
      return;
    }
    for (const entry of [...list].reverse()) {
      const div = document.createElement('div');
      div.className = 'journal-entry';
      div.innerHTML = `<strong>${entry.name}</strong><span class="journal-day">Day ${entry.day + 1}</span><p>${entry.text}</p>`;
      this.dom.journalList.appendChild(div);
    }
  }

  closeJournal() {
    this.dom.journalPanel.classList.add('hidden');
  }

  // --- Bag ---
  openBag(inventory) {
    this.dom.bagPanel.classList.remove('hidden');
    this.dom.bagList.innerHTML = '';
    const entries = Object.entries(inventory).filter(([, qty]) => qty > 0);
    if (entries.length === 0) {
      this.dom.bagList.innerHTML = '<p class="empty-hint">Your bag is empty.</p>';
      return;
    }
    for (const [id, qty] of entries) {
      const def = ITEMS[id] || { name: id, icon: '❓' };
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `<span>${def.icon} ${def.name}</span><span>x${qty}</span>`;
      this.dom.bagList.appendChild(row);
    }
  }

  closeBag() {
    this.dom.bagPanel.classList.add('hidden');
  }

  // --- Event popup ---
  showEventPopup(name, text, rare) {
    this.dom.eventPopup.classList.remove('hidden');
    this.dom.eventPopup.classList.toggle('rare', !!rare);
    this.dom.eventPopupTitle.textContent = name;
    this.dom.eventPopupText.textContent = text;
  }

  hideEventPopup() {
    this.dom.eventPopup.classList.add('hidden');
  }

  // --- Start overlay ---
  showStartOverlay(hasSave) {
    this.dom.startOverlay.classList.remove('hidden');
    this.dom.btnContinueGame.style.display = hasSave ? 'inline-block' : 'none';
  }

  hideStartOverlay() {
    this.dom.startOverlay.classList.add('hidden');
  }

  anyModalOpen() {
    return !this.dom.shopPanel.classList.contains('hidden')
      || !this.dom.propertyPanel.classList.contains('hidden')
      || !this.dom.ciderPanel.classList.contains('hidden')
      || !this.dom.journalPanel.classList.contains('hidden')
      || !this.dom.bagPanel.classList.contains('hidden')
      || !this.dom.eventPopup.classList.contains('hidden')
      || !this.dom.dialogueBox.classList.contains('hidden')
      || !this.dom.startOverlay.classList.contains('hidden');
  }

  closeAllModals() {
    this.closeShop();
    this.closeProperty();
    this.closeCider();
    this.closeJournal();
    this.closeBag();
    this.hideEventPopup();
    this.closeDialogue();
  }
}
