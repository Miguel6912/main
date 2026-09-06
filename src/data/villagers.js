// The generated background population of Cottage Row. Six leads (npcs.js +
// dialogue.js) are hand-authored in full; everyone here is assembled from
// the pools in villagerPools.js -- but assembled once, deterministically,
// into a real per-villager record: a name, a home, a daily schedule, and a
// DialogueSystem-compatible dialogue tree with a genuine greeting, an
// "about yourself" line, and a one-time branching decision with its own
// friendship consequence. See DialogueSystem.js / dialogue.js for the node
// shape this generates into.
//
// A fixed seed means the population (who lives where, what they're named,
// what they do) is stable across reloads and across every player's game --
// exactly like NEIGHBORHOOD_HOUSES itself.

import { RNG } from '../core/RNG.js';
import { NEIGHBORHOOD_HOUSES } from '../world/MapData.js';
import { FIRST_NAMES, SURNAMES, PROFESSIONS, QUIRKS } from './villagerPools.js';

const BODY_COLORS = [
  '#8a9e5c', '#5c8a9e', '#b06a4a', '#9e7a5c', '#6a7a9e', '#a85c7a',
  '#7a9e6a', '#9e8a4a', '#5c6a4a', '#b08a5c', '#6a5c8a', '#4a7a6a',
  '#9e5c5c', '#5c9e8a', '#8a6a9e', '#7a8a4a',
];
const ACCENT_COLORS = [
  '#fbf6e3', '#dfe7f2', '#efe2c8', '#f0e2d0', '#e2f0df', '#f2dfe7',
  '#e8e0f2', '#f2ece0',
];
const HAIR_COLORS = [
  '#4a3520', '#2b2320', '#7a4a2e', '#8a8a86', '#b8622e', '#d9c48a', '#5a3d2a', '#6b6b66',
];

// Where a villager spends their working hours, by profession zone. There's
// no obstacle-avoidance pathfinding (see DEVELOPMENT.md) so these are just
// open-field target points, same simplification the six leads already use.
function workSpotFor(zone, house, rng) {
  switch (zone) {
    case 'fields':
      return { x: rng.range(500, 950), y: rng.range(1150, 1550) };
    case 'lake':
      return { x: rng.range(1320, 1680), y: rng.range(1320, 1580) };
    case 'forest':
      return { x: rng.range(1520, 1700), y: rng.range(150, 900) };
    case 'home':
    default:
      return { x: house.doorX + rng.range(-40, 40), y: house.doorY + rng.range(-35, 5) };
  }
}

function buildVillagerDialogueTree(v) {
  const p = v.profession;
  return {
    start: 'greeting',
    nodes: {
      greeting: {
        variants: [
          {
            conditions: [{ type: 'notMetBefore' }],
            text: `Oh, hello! I don't think we've met -- I'm ${v.name}, ${p.title.toLowerCase()} here in Cottage Row. Truth be told, ${v.name.split(' ')[0]} ${v.quirk}, or so everyone tells me.`,
            onEnter: [{ type: 'setMemFlag', flag: 'metBefore' }, { type: 'addFriendship', amount: 1 }],
          },
          { conditions: [{ type: 'minFriendship', value: 15 }], text: `${v.name.split(' ')[0]}! Good to see a friendly face. Always got a moment for you.` },
          { conditions: [{ type: 'phase', phases: ['night'] }], text: `Bit late to be about, isn't it? Still -- good to see you.` },
          { conditions: [], text: `Oh, hello again! Off ${p.workType} shortly, but it's good to see you.` },
        ],
        next: 'options_basic',
      },
      options_basic: {
        options: [
          { text: 'Tell me about yourself', action: { type: 'goto', node: 'about' } },
          { text: 'Is there anything you need help with?', conditions: [{ type: 'notMemFlag', flag: 'decisionDone' }], action: { type: 'goto', node: 'decision' } },
          { text: 'Any news around the village?', action: { type: 'gossip' } },
          { text: 'Goodbye', action: { type: 'end' } },
        ],
      },
      about: {
        variants: [{ conditions: [], text: p.aboutLine(v.name) }],
        next: 'options_basic',
      },
      decision: {
        variants: [{ conditions: [], text: p.decisionAsk(v.name) }],
        options: [
          { text: 'Of course, happy to help', action: { type: 'goto', node: 'decision_yes' } },
          { text: 'Not right now, sorry', action: { type: 'goto', node: 'decision_no' } },
        ],
      },
      decision_yes: {
        variants: [{
          conditions: [],
          text: p.decisionYes(v.name),
          onEnter: [{ type: 'setMemFlag', flag: 'decisionDone' }, { type: 'addFriendship', amount: 5 }],
        }],
        next: 'options_basic',
      },
      decision_no: {
        variants: [{ conditions: [], text: p.decisionNo(v.name), onEnter: [{ type: 'setMemFlag', flag: 'decisionDone' }] }],
        next: 'options_basic',
      },
    },
  };
}

function generateVillagers() {
  const rng = new RNG(9001);
  const villagers = [];
  const dialogue = {};

  for (const house of NEIGHBORHOOD_HOUSES) {
    const firstName = rng.pick(FIRST_NAMES);
    const surname = rng.pick(SURNAMES);
    const profession = rng.pick(PROFESSIONS);
    const quirk = rng.pick(QUIRKS);
    const name = `${firstName} ${surname}`;
    const id = `v_${house.id}`;
    const home = { x: house.doorX, y: house.doorY + 6 };
    const work = workSpotFor(profession.zone, house, rng);

    const villager = {
      id,
      name,
      color: rng.pick(BODY_COLORS),
      accent: rng.pick(ACCENT_COLORS),
      outfit: profession.outfit,
      hair: rng.pick(HAIR_COLORS),
      title: profession.title,
      blurb: `${profession.title} who ${quirk}.`,
      profession,
      quirk,
      schedule: [
        { hour: 0, x: home.x, y: home.y, activity: 'asleep' },
        { hour: 7, x: work.x, y: work.y, activity: profession.workType },
        { hour: 19, x: home.x, y: home.y, activity: 'home for the evening' },
      ],
    };

    villagers.push(villager);
    dialogue[id] = buildVillagerDialogueTree(villager);
  }

  return { villagers, dialogue };
}

const generated = generateVillagers();

export const VILLAGERS = generated.villagers;
export const VILLAGER_DIALOGUE = generated.dialogue;
