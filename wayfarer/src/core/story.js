// Story content lives here, separate from game.js's physics/combat loop, so
// writing or editing dialogue never touches simulation code. Delivered
// entirely through the existing message log (see addMessage in game.js) --
// no new dialogue system, no cutscenes, just more lines in the same channel
// that already prints "Entered the forest -- tier 1."

// Shown once, before the very first run starts (see main.js) -- the hook and
// the stakes, not a wall of lore.
export const INTRO_LINES = [
  "You there. Yes -- you, with the sword you clearly haven't sharpened this week.",
  "My name is Elara. My father, King Aldric, ruled this land until three months ago, when he made a bargain with something that should have stayed unbargained-with. Now the land is rotting from the inside out. So is he.",
  "I've hired mercenaries. They quit. I've hired heroes. They also quit, several of them loudly, one of them mid-sentence. You're what's left on the list.",
  "Cross the forest, the graveyard, and whatever's happened to my family's castle. Find my father. Find a way to undo this. I'd go myself, but someone has to stay behind and pretend this kingdom still has a functioning government.",
  "Bring him back to me. Preferably still attached to his skin.",
];

// Doran Emberfist -- the blacksmith behind every forge in every level. Same
// dwarf, absurdly consistent business instincts, wherever the level
// generator happens to plant him. Shown once per biome per run, the first
// time that biome's forge is opened (see the seenForgeBiomes check in
// game.js) -- not every single forge, or he'd never stop talking.
export const FORGE_INTRO_LINES = {
  forest: [
    "Ah, a customer! Doran Emberfist -- best blacksmith this side of anywhere, mostly because I'm the only blacksmith this side of anywhere.",
    "Don't mind the tree growing through the anvil. Adds character. Also I couldn't be bothered moving it.",
    "Gear up, don't die, come back with more scrap. That's the whole business model.",
  ],
  graveyard: [
    "Oh good, you found me! Set up shop here for the peace and quiet -- say what you want about the neighbours, they never haggle and they never complain about the noise.",
    "Real estate's dirt cheap too. Ha. \"Dirt.\" ...I'll see myself out. Except I won't, I live here now.",
    "Weapons, armour, questionable life choices. What'll it be?",
  ],
  castle: [
    "Set up right outside the King's own gate, if you can believe it. Best foot traffic I've ever had. Well -- \"traffic.\" Most of it shambles.",
    "Free advice, since you're a paying customer and not a friend: whatever's through those doors, hit it before it hits you. Works on most things. Kings included, apparently.",
    "Go on then. I'll keep the forge warm. And the exits closer than usual.",
  ],
};

// Printed once, right after the level-enter message, the first time the
// castle is reached (tier 1 only -- the biome loop revisits it every third
// level after that at a higher tier, and the joke doesn't need repeating).
export const CASTLE_APPROACH_LINE =
  "The castle looms ahead: broken towers, worse company, and somewhere at the top, a king who used to throw much better parties. Elara's counting on you not to disappoint twice in one week.";
