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

// Printed once, right after the level-enter message, the first time each
// biome is reached (tier 1 only -- the loop revisits every biome at a
// higher tier every lap after that, and none of these need repeating).
// Not every biome has a line; forest and graveyard don't need one, the
// opening plea (INTRO_LINES) already covers them.
export const BIOME_FIRST_ENTRY_LINES = {
  castle:
    "The castle looms ahead: broken towers, worse company, and somewhere at the top, a king who used to throw much better parties. Elara's counting on you not to disappoint twice in one week.",
  frostmarch:
    "Nobody mentioned a frostmarch. Elara's maps clearly stop at the castle gate -- you're off the edge of them now, and so, it turns out, is the temperature.",
  swamp:
    "Nobody mentioned a swamp either. At this rate the maps back home are less \"incomplete\" and more \"aspirational.\"",
};

// ---------------------------------------------------------------- bosses --
// Content only for now -- there's no city biome and no boss-encounter
// system yet for either of these to hook into (both depend on the combat
// overhaul currently being designed alongside the boss art). Written ahead
// of that so it's ready the moment there's somewhere to call it from:
//   - BOSS_ROSTER[n].elaraLine: what she says the next time you reach the
//     city after that boss falls -- who you just fought, who's next.
//     Intended trigger: entering the city with defeatedBosses.has(id) newly
//     true for that entry and not yet acknowledged.
//   - MICRO_BOSSES[n]: secondary, non-court encounters -- see below.

export const BOSS_ROSTER = [
  {
    id: 'vess',
    name: 'Vess',
    title: "the Hollow King's Head Assassin",
    elaraLine: [
      "So. You're alive, he's not -- I'll take that as a win.",
      "That was Vess, my father's head assassin. Loyal to a fault, which was always his problem: he never once asked why the crown wanted so many people quietly dead.",
      "Next up is General Korrath, his High General. Korrath does not do \"quietly.\" Try not to die between here and there -- I only just finished the paperwork for the last hero.",
    ],
  },
  {
    id: 'korrath',
    name: 'General Korrath',
    title: "the Hollow King's High General",
    elaraLine: [
      "Korrath. Gods, that man could talk for an hour about troop formations and never once about whether the war was a good idea.",
      "Still -- done. Next is Seneschal Odalys. She basically ran the kingdom while my father was busy being kingly, which apparently included some light treason.",
      "Watch yourself with her. She was frightening before she started decomposing.",
    ],
  },
  {
    id: 'odalys',
    name: 'Seneschal Odalys',
    title: "the King's Seneschal",
    elaraLine: [
      "Odalys. I actually liked her, before. She used to sneak me sweets out of the treasury budget.",
      "Now she tried to have you filed as \"deceased, pending.\" Progress, I suppose.",
      "That leaves the Herald. I don't know what it used to be -- nobody does. It's the thing my father actually made his bargain with, or close enough to it. After that... it's him.",
    ],
  },
  {
    id: 'herald',
    name: 'the Herald',
    title: 'of the Hollowing',
    elaraLine: [
      "That's it, then. That's everyone standing between you and him. No more titles left to hide behind.",
      "Just find him. Whatever's left of him.",
      "And if there's still a person in there somewhere -- I need to know. Even if the answer's the one I'm afraid of.",
    ],
  },
];

// ---------------------------------------------------------- micro-bosses --
// A second, looser tier below BOSS_ROSTER: no rank, no chain of command,
// not necessarily something Elara has ever heard of. A stronger, named
// encounter you stumble into (or that recurs) without it counting as "the
// next thing standing between you and the King." This is the list to keep
// growing as more enemy art lands -- append here, don't stretch
// BOSS_ROSTER to cover anything that isn't actually part of the court.
//
// Shape per entry:
//   id              stable key (mirrors the eventual enemy/asset key)
//   name            display name
//   biome           where it can turn up (not wired to spawning yet)
//   encounterLines  optional -- printed the moment its fight starts, for
//                   ones with a reveal worth building up to (the Hare's
//                   "small and harmless" bait-and-switch). Skip this field
//                   for a micro-boss that doesn't need one.
//   elaraLine       optional -- only for one she'd actually have an
//                   opinion on. Leave it out for anything she has no
//                   reason to know about, same as the Hare.
export const MICRO_BOSSES = [
  {
    id: 'hollow_hare',
    name: 'the Hollow Hare',
    biome: 'forest',
    encounterLines: [
      "Huh. A rabbit.",
      "...that is a lot of teeth for a rabbit.",
    ],
  },
];
