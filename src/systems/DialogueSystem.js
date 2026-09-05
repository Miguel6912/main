import { DIALOGUE } from '../data/dialogue.js';
import { getNpcData } from '../data/npcs.js';

// Generic dialogue tree walker. Everything NPC-personality-specific lives in
// data/dialogue.js; this file only knows how to evaluate conditions, apply
// actions, and substitute a couple of dynamic tokens. Adding a new
// condition or action type means adding a case here AND documenting it in
// the dialogue.js header comment -- everything else is pure content.
export class DialogueSystem {
  constructor({ memory, time, economy, eventSystem, worldFlags, bus, playerName }) {
    this.memory = memory;
    this.time = time;
    this.economy = economy;
    this.eventSystem = eventSystem;
    this.worldFlags = worldFlags; // plain object, shared with main.js / EventSystem
    this.bus = bus;
    this.playerName = playerName;
    this.state = null; // { npcId, nodeId }
    this.lastOptions = [];
    this.pendingVirtualText = null; // used for gossip / job confirmation lines
  }

  isOpen() {
    return !!this.state;
  }

  open(npcId) {
    this.state = { npcId, nodeId: DIALOGUE[npcId]?.start || 'greeting' };
    this.pendingVirtualText = null;
    return this.render();
  }

  close() {
    this.state = null;
    this.lastOptions = [];
  }

  evaluateCondition(npcId, cond) {
    const mem = this.memory.get(npcId);
    switch (cond.type) {
      case 'metBefore':
        return !!mem.flags.metBefore;
      case 'notMetBefore':
        return !mem.flags.metBefore;
      case 'minFriendship':
        return mem.friendship >= cond.value;
      case 'maxFriendship':
        return mem.friendship <= cond.value;
      case 'phase':
        return cond.phases.includes(this.time.phase);
      case 'notPhase':
        return !cond.phases.includes(this.time.phase);
      case 'season':
        return cond.seasons.includes(this.time.season);
      case 'worldFlag':
        return !!this.worldFlags[cond.flag];
      case 'notWorldFlag':
        return !this.worldFlags[cond.flag];
      case 'memFlag':
        return !!mem.flags[cond.flag];
      case 'notMemFlag':
        return !mem.flags[cond.flag];
      case 'hasJobToOffer':
        return this.economy.hasJobToOffer(npcId);
      case 'canTurnInJob':
        return this.economy.canTurnInJob(npcId);
      default:
        console.warn('[DialogueSystem] unknown condition type', cond.type);
        return true;
    }
  }

  _allConditionsPass(npcId, conditions) {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every((c) => this.evaluateCondition(npcId, c));
  }

  runAction(npcId, action) {
    switch (action.type) {
      case 'setMemFlag':
        this.memory.setFlag(npcId, action.flag, true);
        break;
      case 'setWorldFlag':
        this.worldFlags[action.flag] = true;
        break;
      case 'addFriendship':
        this.memory.addFriendship(npcId, action.amount);
        break;
      case 'giveItem':
        this.economy.addItem(action.item, action.qty || 1);
        break;
      case 'takeItem':
        this.economy.removeItem(action.item, action.qty || 1);
        break;
      case 'addCoins':
        this.economy.addCoins(action.amount);
        break;
      default:
        console.warn('[DialogueSystem] unknown onEnter action type', action.type);
    }
  }

  substitute(text) {
    if (!text) return text;
    const job = this.economy.dailyJob;
    return text
      .replace('{jobDesc}', job ? job.giverDesc : '')
      .replace('{jobReward}', job ? String(job.coinReward) : '0')
      .replace('{player}', this.playerName || 'friend');
  }

  render() {
    if (this.pendingVirtualText) {
      const { text, next } = this.pendingVirtualText;
      this.pendingVirtualText = null;
      this.state.nodeId = next;
      return this._renderText(this.state.npcId, text, this._optionsFor(this.state.npcId, next));
    }

    const { npcId, nodeId } = this.state;
    const tree = DIALOGUE[npcId];
    const node = tree.nodes[nodeId];
    let text = '';

    if (node.variants) {
      const variant = node.variants.find((v) => this._allConditionsPass(npcId, v.conditions)) || node.variants[node.variants.length - 1];
      text = variant.text;
      if (variant.onEnter) variant.onEnter.forEach((a) => this.runAction(npcId, a));
    } else if (node.text) {
      text = node.text;
    }

    return this._renderText(npcId, text, this._optionsFor(npcId, nodeId));
  }

  _optionsFor(npcId, nodeId) {
    const node = DIALOGUE[npcId].nodes[nodeId];
    let options = (node.options || []).filter((o) => this._allConditionsPass(npcId, o.conditions));
    if (options.length === 0) {
      if (node.next) options = [{ text: 'Continue', action: { type: 'goto', node: node.next } }];
      else options = [{ text: 'Goodbye', action: { type: 'end' } }];
    }
    return options;
  }

  _renderText(npcId, text, options) {
    this.lastOptions = options;
    return {
      npcId,
      npcName: getNpcData(npcId).name,
      text: this.substitute(text),
      options: options.map((o) => o.text),
    };
  }

  choose(index) {
    const option = this.lastOptions[index];
    if (!option) return this.render();
    return this.applyAction(option.action);
  }

  applyAction(action) {
    const npcId = this.state.npcId;
    switch (action.type) {
      case 'goto':
        this.state.nodeId = action.node;
        return this.render();
      case 'end':
        this.close();
        return null;
      case 'gossip':
        return this._doGossip(npcId);
      case 'openShop':
        this.close();
        this.bus.emit('ui:openShop');
        return null;
      case 'acceptJob': {
        const job = this.economy.acceptJob();
        const text = job
          ? `Wonderful! ${job.grantsItem ? 'Here, take this with you. ' : ''}Come find me -- or whoever needs it -- when it's done.`
          : "Never mind, looks like that's already sorted.";
        this.pendingVirtualText = { text, next: 'options_basic' };
        return this.render();
      }
      case 'turnInJob': {
        const job = this.economy.turnInJob(npcId);
        const text = job
          ? `Perfect, thank you! Here's ${job.coinReward} coins for your trouble.`
          : "Hmm, doesn't look like you have what I need just yet.";
        if (job) this.memory.addFriendship(npcId, job.friendshipReward || 0);
        this.pendingVirtualText = { text, next: 'options_basic' };
        return this.render();
      }
      default:
        this.runAction(npcId, action);
        this.state.nodeId = 'options_basic';
        return this.render();
    }
  }

  _doGossip(npcId) {
    const entry = this.eventSystem.claimGossipFor(npcId);
    const text = entry ? entry.textMissed : "No news today, I'm afraid. Quiet as ever around here.";
    this.pendingVirtualText = { text, next: 'options_basic' };
    return this.render();
  }
}
