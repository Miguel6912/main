// Dialogue trees, one per NPC id. This is the biggest "content" surface in
// the game and is intentionally generic: DialogueSystem.js is the only code
// that understands how to walk these trees, so a new conversation or a new
// NPC personality quirk is added here, not in engine code.
//
// Node shape:
//   {
//     variants: [ { conditions: [...], text, onEnter?: [...actions] }, ... ] // first match wins
//     options: [ { text, conditions?: [...], action } ]                     // optional
//     next: 'nodeId'                                                       // used if no options given
//   }
// If a node has neither options nor next, DialogueSystem shows a single
// "Goodbye" option that ends the conversation.
//
// Condition types (see DialogueSystem.evaluateCondition):
//   metBefore / notMetBefore
//   minFriendship { value } / maxFriendship { value }
//   phase { phases: [...] }
//   season { seasons: [...] }
//   worldFlag { flag } / notWorldFlag { flag }
//   memFlag { flag } / notMemFlag { flag }
//   hasJobToOffer   -- economy's daily job is given by this NPC and not yet accepted/completed
//   canTurnInJob    -- player is holding an active job whose turn-in NPC is this one, and requirements are met
//
// Action types (see DialogueSystem.applyAction):
//   goto { node } / end
//   gossip
//   setWorldFlag { flag } / setMemFlag { flag }
//   addFriendship { amount }
//   giveItem { item, qty } / takeItem { item, qty }
//   addCoins { amount }
//   openShop
//   acceptJob / turnInJob
//
// Text supports {jobDesc} and {jobReward} tokens, substituted from the
// current daily job template at render time.

const COMMON_OPTIONS = [
  { text: 'Ask about the job', conditions: [{ type: 'hasJobToOffer' }], action: { type: 'goto', node: 'job_offer' } },
  { text: "I've got what you asked for", conditions: [{ type: 'canTurnInJob' }], action: { type: 'turnInJob' } },
  { text: 'Any news around the village?', action: { type: 'gossip' } },
  { text: 'Goodbye', action: { type: 'end' } },
];

const jobOfferNode = () => ({
  variants: [{ conditions: [], text: "{jobDesc} There's {jobReward} coins in it for you if you can manage it." }],
  options: [
    { text: "I'll do it", action: { type: 'acceptJob' } },
    { text: 'Maybe later', action: { type: 'goto', node: 'options_basic' } },
  ],
});

export const DIALOGUE = {
  mira: {
    start: 'greeting',
    nodes: {
      greeting: {
        variants: [
          {
            conditions: [{ type: 'notMetBefore' }],
            text: "Oh! A new face. Welcome, dear -- I'm Mira, I run the bakery. Mind the flour, it gets absolutely everywhere.",
            onEnter: [{ type: 'setMemFlag', flag: 'metBefore' }, { type: 'addFriendship', amount: 1 }],
          },
          { conditions: [{ type: 'phase', phases: ['night'] }], text: 'Bit late for bread, dear! Come by in the morning -- the ovens are cold now.' },
          { conditions: [{ type: 'minFriendship', value: 15 }], text: "There's my favourite customer! Go on, take a warm roll, I insist." },
          { conditions: [], text: 'Hello again! Fresh loaves today, if you fancy one.' },
        ],
        next: 'options_basic',
      },
      options_basic: {
        options: [
          { text: 'Tell me about yourself', action: { type: 'goto', node: 'about' } },
          ...COMMON_OPTIONS,
        ],
      },
      about: {
        variants: [{ conditions: [], text: "Twenty years I've run this oven, and it still hates me some mornings. Burns the left side of every third loaf out of pure spite. I've named it Gerald." }],
        next: 'options_basic',
      },
      job_offer: jobOfferNode(),
    },
  },

  tansy: {
    start: 'greeting',
    nodes: {
      greeting: {
        variants: [
          {
            conditions: [{ type: 'notMetBefore' }],
            text: "Well, look who it is. Tansy Goodbarrel -- I run the inn, and I hear absolutely everything that happens in this village, usually before it's finished happening.",
            onEnter: [{ type: 'setMemFlag', flag: 'metBefore' }, { type: 'addFriendship', amount: 1 }],
          },
          { conditions: [{ type: 'minFriendship', value: 15 }], text: "You again! Sit, sit. First mug's on the house tonight." },
          { conditions: [], text: "Evening. Or morning. Time gets away from me behind this bar." },
        ],
        next: 'options_basic',
      },
      options_basic: {
        options: [
          { text: 'How do you hear about everything?', action: { type: 'goto', node: 'about' } },
          ...COMMON_OPTIONS,
        ],
      },
      about: {
        variants: [{ conditions: [], text: 'People talk more after a drink than they mean to. I just pour and listen. Costs me nothing and I never forget a word of it.' }],
        next: 'options_basic',
      },
      job_offer: jobOfferNode(),
    },
  },

  bramble: {
    start: 'greeting',
    nodes: {
      greeting: {
        variants: [
          {
            conditions: [{ type: 'notMetBefore' }],
            text: "Welcome, welcome. Bramble Nutmeg, general goods, fair prices, no refunds on anything that was clearly a live animal when you bought it.",
            onEnter: [{ type: 'setMemFlag', flag: 'metBefore' }, { type: 'addFriendship', amount: 1 }],
          },
          { conditions: [{ type: 'phase', phases: ['night'] }], text: "Shop's closed, friend. Come back with the sun." },
          { conditions: [], text: "Back again! Take a look at the shelves, I restock more than you'd think." },
        ],
        next: 'options_basic',
      },
      options_basic: {
        options: [
          { text: 'Browse the shop', conditions: [{ type: 'notPhase', phases: ['night'] }], action: { type: 'openShop' } },
          { text: 'Tell me about the shop', action: { type: 'goto', node: 'about' } },
          ...COMMON_OPTIONS,
        ],
      },
      about: {
        variants: [{ conditions: [], text: "A bit of everything, that's the trick. Ribbons for sweethearts, seeds for gardens, and I'll buy just about anything you drag out of that forest, no questions asked." }],
        next: 'options_basic',
      },
      job_offer: jobOfferNode(),
    },
  },

  reginald: {
    start: 'greeting',
    nodes: {
      greeting: {
        variants: [
          {
            conditions: [{ type: 'notMetBefore' }],
            text: "Halt! ...Ah, you're not a threat. Sir Reginald Puddlefoot, sworn protector of this village. State your business. Or don't, I'm not really equipped to handle business either way.",
            onEnter: [{ type: 'setMemFlag', flag: 'metBefore' }, { type: 'addFriendship', amount: 1 }],
          },
          { conditions: [{ type: 'worldFlag', flag: 'saw_dragon' }, { type: 'notMemFlag', flag: 'toldDragonStory' }], text: "You SAW it, didn't you! The dragon! I drove it off single-handedly, of course. Terrifying business. Terrifying. I need a sit down.", onEnter: [{ type: 'setMemFlag', flag: 'toldDragonStory' }, { type: 'addFriendship', amount: 2 }] },
          { conditions: [{ type: 'minFriendship', value: 15 }], text: 'Good to see a friendly face on patrol. Keeps morale up, you understand.' },
          { conditions: [], text: 'On patrol! Or resting between patrols. The line is thinner than the official reports suggest.' },
        ],
        next: 'options_basic',
      },
      options_basic: {
        options: [
          { text: 'Any daring deeds lately?', action: { type: 'goto', node: 'about' } },
          ...COMMON_OPTIONS,
        ],
      },
      about: {
        variants: [
          { conditions: [{ type: 'worldFlag', flag: 'saw_dragon' }], text: "The dragon incident aside -- and I really can't stress enough how single-handed that was -- mostly I chase Old Man Higgins's goat. It's a surprisingly worthy adversary." },
          { conditions: [], text: 'Mostly I chase Old Man Higgins\'s goat. It has evaded capture forty-one times. I keep count. It is not going well for me.' },
        ],
        next: 'options_basic',
      },
      job_offer: jobOfferNode(),
    },
  },

  cobb: {
    start: 'greeting',
    nodes: {
      greeting: {
        variants: [
          {
            conditions: [{ type: 'notMetBefore' }],
            text: "...Cobb. That's all you need. Live at the forest's edge, cut wood, keep to myself. Mostly.",
            onEnter: [{ type: 'setMemFlag', flag: 'metBefore' }, { type: 'addFriendship', amount: 1 }],
          },
          { conditions: [{ type: 'minFriendship', value: 15 }], text: "Hm. You again. Forest's been quiet lately. That's not always a good sign, mind." },
          { conditions: [], text: 'Hm.' },
        ],
        next: 'options_basic',
      },
      options_basic: {
        options: [
          { text: 'What do you know about the forest?', action: { type: 'goto', node: 'about' } },
          ...COMMON_OPTIONS,
        ],
      },
      about: {
        variants: [
          { conditions: [{ type: 'worldFlag', flag: 'saw_unicorn' }], text: "So you've seen her too, then. I won't say more than that. Some things get smaller the more you talk about them." },
          { conditions: [], text: "The forest listens more than it talks. Keep your eyes open at dawn, especially in the warmer months. That's all I'll say on it." },
        ],
        next: 'options_basic',
      },
      job_offer: jobOfferNode(),
    },
  },

  wren: {
    start: 'greeting',
    nodes: {
      greeting: {
        variants: [
          {
            conditions: [{ type: 'notMetBefore' }],
            text: "Oh! Hi! I'm Wren. Are you new? Do you believe in magic? You should. I do. I haven't seen any yet but I KNOW it's out there.",
            onEnter: [{ type: 'setMemFlag', flag: 'metBefore' }, { type: 'addFriendship', amount: 1 }],
          },
          { conditions: [{ type: 'worldFlag', flag: 'saw_unicorn' }, { type: 'notMemFlag', flag: 'toldUnicornStory' }], text: "Wait -- WAIT. Did you see it too?! The unicorn?! I KNEW it, I KNEW it was real, I'm never going to stop thinking about this, thank you for existing.", onEnter: [{ type: 'setMemFlag', flag: 'toldUnicornStory' }, { type: 'addFriendship', amount: 5 }] },
          { conditions: [{ type: 'minFriendship', value: 15 }], text: "You're my favourite grown-up, you know. Don't tell the others." },
          { conditions: [], text: 'Hi again! Still watching the trees. Something\'s going to happen out there one day, I just know it.' },
        ],
        next: 'options_basic',
      },
      options_basic: {
        options: [
          { text: 'What do you like to do?', action: { type: 'goto', node: 'about' } },
          ...COMMON_OPTIONS,
        ],
      },
      about: {
        variants: [{ conditions: [], text: "I watch the forest. I chase fireflies. I collect interesting rocks. I have a system for the rocks, it's very serious, I could show you sometime." }],
        next: 'options_basic',
      },
      job_offer: jobOfferNode(),
    },
  },
};
