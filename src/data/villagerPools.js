// Content pools for the generated background population ("Cottage Row").
// Six leads (data/npcs.js + dialogue.js) are fully hand-authored; everyone
// else is assembled from these pools by data/villagers.js -- a real name,
// a profession with its own hand-written flavor lines, and a quirk -- so
// every one of the 100+ villagers still gets a genuine greeting, an "about
// yourself" line, and a one-time branching decision with a friendship
// consequence, rather than a single copy-pasted template. See
// DEVELOPMENT.md section on Cottage Row for how the pieces combine.

export const FIRST_NAMES = [
  'Alder', 'Briony', 'Cassia', 'Dorran', 'Elowen', 'Fenwick', 'Garnet', 'Hollis',
  'Ivy', 'Jem', 'Kestrel', 'Linden', 'Marigold', 'Nettle', 'Osric', 'Poppy',
  'Quill', 'Rosalind', 'Sorrel', 'Tobin', 'Una', 'Verity', 'Wilf', 'Yarrow',
  'Aster', 'Bramwell', 'Clover', 'Dashiell', 'Elowyn', 'Fennel', 'Greta', 'Hazel',
  'Idris', 'Juniper', 'Kip', 'Lark', 'Marnie', 'Nolan', 'Orla', 'Pip',
  'Quennel', 'Rowan', 'Saffron', 'Thistle', 'Ulric', 'Vesper', 'Wren', 'Zinnia',
];

export const SURNAMES = [
  'Thistledown', 'Goodbarrel', 'Nutmeg', 'Puddlefoot', 'Rootwhistle', 'Millbank',
  'Oakhollow', 'Cobbleworth', 'Greenhollow', 'Fairweather', 'Hedgerow', 'Longacre',
  'Smallbrook', 'Wainwright', 'Applecross', 'Barleycorn', 'Cloverfield', 'Duskwater',
  'Elderberry', 'Foxglove', 'Gladwell', 'Honeywell', 'Ironside', 'Juniperton',
  'Kettlewell', 'Larkspur', 'Mosswood', 'Nightingale', 'Orchardview', 'Pemberton',
  'Quickthorn', 'Ravensworth', 'Silverbrook', 'Tumbledown', 'Underhill', 'Willowmere',
];

// Each profession carries its own outfit (matches a case in
// Renderer._drawOutfitDetail / _drawHairOrHelmet, or 'tunic' for the plain
// default body with no overlay), the district they're likeliest to be
// found working in during the day, and hand-written first-person flavour
// text for the about/decision dialogue nodes (data/villagers.js supplies
// the villager's own name separately, in the greeting node).
export const PROFESSIONS = [
  {
    id: 'farmer', title: 'a Farmer', outfit: 'tunic', workType: 'in the fields', zone: 'fields',
    aboutLine: () => "Up before the sun, in bed not long after it sets. The soil doesn't care what day of the week it is, and neither do I anymore.",
    decisionAsk: () => 'The east field needs another pair of hands before the weather turns. Could you help me clear it?',
    decisionYes: () => "Bless you, truly. Many hands, light work, and all that. I won't forget this.",
    decisionNo: () => "No matter, I'll manage. The field's not going anywhere, more's the pity.",
  },
  {
    id: 'shepherd', title: 'a Shepherd', outfit: 'tunic', workType: 'minding the flock', zone: 'fields',
    aboutLine: () => "I know every one of my flock by the shape of their ears. People find that strange. I find it strange they don't.",
    decisionAsk: () => "One of my lambs wandered off toward the orchard again. Would you keep an eye out for a little grey one?",
    decisionYes: () => "Thank you kindly. She's a stubborn thing, but she's mine. I'll rest easier knowing someone's looking.",
    decisionNo: () => "Ah well. She always turns up eventually, muddy and unrepentant.",
  },
  {
    id: 'fisher', title: 'a Fisherfolk', outfit: 'cloak', workType: 'out on the lake', zone: 'lake',
    aboutLine: () => "The lake gives up more than fish, if you're patient. Mostly it gives up fish. But not only fish.",
    decisionAsk: () => "My nets need mending before the next haul and my hands aren't what they were. Would you help me carry them up from the shore?",
    decisionYes: () => "Much obliged. A good net is half the catch, my mother always said.",
    decisionNo: () => "Fair enough. I'll drag them up myself, slower than I'd like.",
  },
  {
    id: 'hunter', title: 'a Hunter', outfit: 'cloak', workType: 'ranging the forest edge', zone: 'forest',
    aboutLine: () => "I go where the deer go, mostly. The forest's changed since I was young. Quieter in some places. Louder in others, if you know where to listen.",
    decisionAsk: () => "There's a den of foxes gotten too bold near the coops. Would you help me scare them back toward the deep trees, gently?",
    decisionYes: () => "Gently indeed, and I mean that -- no traps, no harm, just a bit of noise and nerve. Thank you for understanding that.",
    decisionNo: () => "I understand. Not everyone fancies tramping through brambles for someone else's chickens.",
  },
  {
    id: 'woodcutter', title: 'a Woodcutter', outfit: 'cloak', workType: 'splitting logs', zone: 'forest',
    aboutLine: () => "Old Cobb taught me half of what I know about the trees at the forest's edge. The other half, the trees taught me themselves.",
    decisionAsk: () => "I've got more firewood than I can split before the cold sets in properly. Fancy taking a share off my hands, cheap?",
    decisionYes: () => "Good, good -- keeps my woodpile from toppling over on me in the night. A fair trade all round.",
    decisionNo: () => "Suit yourself. I'll be stacking logs until the frost, at this rate.",
  },
  {
    id: 'weaver', title: 'a Weaver', outfit: 'apron', workType: 'at the loom', zone: 'home',
    aboutLine: () => "Every thread has a mood, if you ask me. Wool's patient. Silk's vain. Flax is stubborn as an old goat.",
    decisionAsk: () => "I'm short a pair of steady hands to hold the warp threads taut while I set a new pattern. Would you mind?",
    decisionYes: () => "Perfect, hold just there -- lovely, thank you. That pattern will outlast the both of us now.",
    decisionNo: () => "No trouble. I'll rig up the loom-weights again, slower going but it works.",
  },
  {
    id: 'cooper', title: 'a Cooper', outfit: 'apron', workType: 'binding barrels', zone: 'home',
    aboutLine: () => "Half the village's cider and ale passes through a barrel of mine at some point. I like to think that makes me indispensable. My wife disagrees.",
    decisionAsk: () => "I need someone to hold a stave steady while I fit the hoop. It's a two-person job and my apprentice is out sick.",
    decisionYes: () => "There -- perfect seal. You've a steadier hand than my apprentice, don't tell them I said that.",
    decisionNo: () => "Ah well, I'll prop it against the wall and manage solo. Slower, but it'll hold.",
  },
  {
    id: 'potter', title: 'a Potter', outfit: 'apron', workType: 'at the wheel', zone: 'home',
    aboutLine: () => "Clay remembers everything you do to it, good and bad. I find that oddly comforting. Most things don't remember you at all.",
    decisionAsk: () => "I've a kiln full of pots ready and no one to help me carry them to market without breaking half of them. Care to help?",
    decisionYes: () => "Careful over the ruts -- yes, just like that. My back thanks you, and so do the pots.",
    decisionNo: () => "I'll make three trips instead of one, then. My knees will have opinions about it tomorrow.",
  },
  {
    id: 'tanner', title: 'a Tanner', outfit: 'apron', workType: 'working the hides', zone: 'home',
    aboutLine: () => "It's an honest trade, if not a fragrant one. People make faces until winter comes and they want my boots.",
    decisionAsk: () => "I need a hide stretched and staked before it dries wrong. Extra hands make it go twice as fast -- interested?",
    decisionYes: () => "Good, pull steady on that corner -- there. That's a fine, even stretch. You've a knack for this.",
    decisionNo: () => "No matter. I'll wrestle it myself, though it'll fight me the whole way.",
  },
  {
    id: 'blacksmith', title: 'a Blacksmith', outfit: 'apron', workType: 'at the forge', zone: 'home',
    aboutLine: () => "Fire, iron, and patience -- rush any one of the three and you'll ruin the other two. Took me a decade of burns to really learn that.",
    decisionAsk: () => "I'm short a hand at the bellows while I work this hinge before it cools. Can you pump steady for me?",
    decisionYes: () => "Steady, steady -- perfect. That's a clean weld thanks to you. Come by anytime you need something mended.",
    decisionNo: () => "Fair enough, I'll let the fire cool and start fresh. No sense rushing a bad weld.",
  },
  {
    id: 'carpenter', title: 'a Carpenter', outfit: 'apron', workType: 'measuring timber', zone: 'home',
    aboutLine: () => "Measure twice, cut once, curse a lot if you forget the first part. Most of Cottage Row has a beam or a door of mine in it somewhere.",
    decisionAsk: () => "My roof beam's warped and I need someone to brace it while I true it up. Shouldn't take long.",
    decisionYes: () => "Hold it right there -- good, good, that's got it. Roof won't be sagging on me again for a good long while.",
    decisionNo: () => "I'll rig a prop instead. Not as steady as a person, but it'll do in a pinch.",
  },
  {
    id: 'herbalist', title: 'an Herbalist', outfit: 'vest', workType: 'tending the herb beds', zone: 'home',
    aboutLine: () => "Half of what grows wild in this valley can either heal you or hurt you, and it's usually the very same plant depending how you use it.",
    decisionAsk: () => "I'm out of silverleaf and my knees aren't fit for the forest today. Would you fetch some from the herb patch for me?",
    decisionYes: () => "Wonderful, thank you -- this'll keep the whole street in tonics through the week.",
    decisionNo: () => "I understand, it's a fair walk. I'll make do with what's drying on the rack.",
  },
  {
    id: 'tailor', title: 'a Tailor', outfit: 'vest', workType: 'fitting a hem', zone: 'home',
    aboutLine: () => "I can tell what someone does for a living just by looking at where their sleeves have worn through. It's not always a compliment.",
    decisionAsk: () => "I need someone to stand still for a few minutes so I can check a hem length before I commit to the cut. Would that be you?",
    decisionYes: () => "Hold still just a moment more -- there. Perfect. You've the patience of a much better-paid model.",
    decisionNo: () => "No bother, I'll use the dress form instead. It complains less, though it also never quite fits right.",
  },
  {
    id: 'cobbler', title: 'a Cobbler', outfit: 'vest', workType: 'resoling boots', zone: 'home',
    aboutLine: () => "Boots tell you everything about a person's day. Muddy toes, worn heels, a limp favoured on one side. I read feet like Tansy reads gossip.",
    decisionAsk: () => "I'm behind on orders before the market and my hands are cramping. Could you help me sort leather scraps by size?",
    decisionYes: () => "That's a real help, thank you -- saved me the better part of an hour, easily.",
    decisionNo: () => "No trouble, I'll sort them myself between customers. Slower, but it always gets done eventually.",
  },
  {
    id: 'merchant', title: 'a Trader', outfit: 'vest', workType: 'counting stock', zone: 'home',
    aboutLine: () => "I buy low, sell fair, and remember every debt owed to me down to the last copper. It's not personal. Well. Sometimes it's a little personal.",
    decisionAsk: () => "I've a cart of goods needing unloading before the light fails and my usual helper's gone home sick. Care to lend a hand?",
    decisionYes: () => "Much appreciated -- here, take a little something off the top for your trouble. Fair's fair.",
    decisionNo: () => "Ah well. I'll be at it till dark, then. Wouldn't be the first time.",
  },
  {
    id: 'scribe', title: 'a Scribe', outfit: 'robe', workType: 'copying records', zone: 'home',
    aboutLine: () => "Somebody has to write down who owes whom what, and who was born when, and who quarrelled with whom over a fence line. That somebody is me.",
    decisionAsk: () => "I've a stack of old ledgers to sort before the ink fades past reading. Would you help me carry them up from the cellar?",
    decisionYes: () => "Careful, some of those are older than either of us. Thank you -- history's a heavy thing, literally, it turns out.",
    decisionNo: () => "Understandable, dust doesn't agree with everyone. I'll make several trips myself.",
  },
  {
    id: 'scholar', title: 'a Scholar', outfit: 'robe', workType: 'lost in a book', zone: 'home',
    aboutLine: () => "I came to this village meaning to stay a season and study the old boundary stones. That was some years ago now. The stones can wait, I suppose.",
    decisionAsk: () => "I'm trying to translate an old marker stone near the fields and could use a second pair of eyes on the weathered bits. Interested?",
    decisionYes: () => "Excellent -- yes, trace that line there, does it curve or break? Fascinating. Truly, thank you for indulging me.",
    decisionNo: () => "No matter, I'll puzzle over it myself. It's waited this long, a bit longer won't hurt.",
  },
  {
    id: 'healer', title: 'a Healer', outfit: 'robe', workType: 'brewing a tonic', zone: 'home',
    aboutLine: () => "Most of what I do is common sense with a kinder name. Rest, water, warmth, and something bitter to drink. The bitterness convinces people it's working.",
    decisionAsk: () => "I've a batch of tonics to deliver across the village before they spoil. Would you help me carry a few round?",
    decisionYes: () => "Bless you -- that's half my route done already. The Widow Cobbleworth will be glad of that cough syrup, poor thing.",
    decisionNo: () => "That's alright, I'll manage the rounds myself, just a bit slower than I'd like.",
  },
  {
    id: 'elder', title: 'a Village Elder', outfit: 'shawl', workType: 'sitting in the sun', zone: 'home',
    aboutLine: () => "I've buried two husbands, raised four children, and outlived a fair few scandals I could tell you about, but won't. Not yet, anyway.",
    decisionAsk: () => "My eyes aren't what they were. Would you read me the notices from the board by the inn next time you pass?",
    decisionYes: () => "Thank you, dear. It's good to still know what's happening in the world, even secondhand.",
    decisionNo: () => "No matter. Someone always stops by eventually to tell me the news, whether I ask or not.",
  },
  {
    id: 'guard', title: 'a Watchman', outfit: 'armor', workType: 'walking the rounds', zone: 'home',
    aboutLine: () => "Sir Reginald handles the official patrols. I handle the parts he forgets, which is most of them, honestly, but don't tell him I said so.",
    decisionAsk: () => "There've been strange tracks near the fence line at night. Would you keep an eye out and tell me if you see anything odd?",
    decisionYes: () => "Good, good -- an extra pair of eyes never hurts. Probably just foxes. Probably.",
    decisionNo: () => "Fair enough. I'll keep watching myself. It's probably nothing. Probably.",
  },
  {
    id: 'stablehand', title: 'a Stablehand', outfit: 'tunic', workType: 'mucking out the stalls', zone: 'home',
    aboutLine: () => "Horses are honest in a way people rarely bother to be. If a horse doesn't like you, there's usually a reason, and it's usually your fault.",
    decisionAsk: () => "One of the horses has thrown a shoe and won't hold still for me alone. Would you help hold the lead while I check her hoof?",
    decisionYes: () => "There, good girl -- and good on you too, that's a steady hold. She's calmer with a second person about.",
    decisionNo: () => "No worries, I'll coax her round myself. She's stubborn but she comes round eventually.",
  },
  {
    id: 'cook', title: 'a Cook', outfit: 'barmaid', workType: 'stirring a pot', zone: 'home',
    aboutLine: () => "Tansy handles the ale, I handle everything that comes out of the inn's kitchen. We've an understanding: she doesn't cook, I don't pour.",
    decisionAsk: () => "I'm short on kindling for the stew pot and it's near supper time. Would you fetch me an armful from the woodpile?",
    decisionYes: () => "Perfect timing -- supper's saved. Come by later and there'll be a bowl with your name on it, near enough.",
    decisionNo: () => "Ah, no matter, I'll make do with the embers a while longer. Supper might just be a touch late.",
  },
  {
    id: 'apprentice', title: 'an Apprentice', outfit: 'child', workType: 'running errands', zone: 'home',
    aboutLine: () => "I'm learning the trade properly, I promise, it's just -- there's a lot of sweeping involved that nobody warned me about.",
    decisionAsk: () => "My master asked me to deliver this parcel across the village but I'm meant to be minding the shop. Could you take it for me?",
    decisionYes: () => "You're a lifesaver, honestly. If my master asks, I never left the shop, understood?",
    decisionNo: () => "That's alright, I'll just have to sneak off and hope nobody notices. Wish me luck.",
  },
];

export const QUIRKS = [
  'always hums the same three notes while working, and has never once finished the tune',
  'collects smooth river stones and keeps them in a jar by the door',
  'is convinced the old well grants wishes, and has never once tested that theory by wishing for anything sensible',
  'has not been seen without the same battered scarf in over a decade, regardless of season',
  'names every chicken, goat, and stray cat in the vicinity, then forgets which name goes with which animal',
  'swears a slice of Mira\'s bread cures whatever ails you, up to and including a broken heart',
  'keeps a diary nobody is allowed to read, and mentions this fact constantly',
  'believes wholeheartedly in the unicorn everyone whispers about, and gets a little misty-eyed discussing it',
  'sings terribly and with tremendous confidence',
  'has won the harvest pie contest three years running through means nobody can quite explain',
  'grows suspiciously enormous vegetables and refuses to share the secret',
  'practices sword-fighting with a broom handle when they think no one is watching',
  'insists they can predict rain by an old ache in one knee, and is right more often than seems fair',
  'never seen without a cup of something hot, rain or shine',
  'has been trying for years to teach the village cats a trick, any trick, with no success whatsoever',
  'writes poetry about the changing seasons that nobody has the heart to critique honestly',
  'maintains a long-running, entirely good-natured rivalry with a neighbour over whose garden looks better',
  'refuses to walk under ladders, around black cats, or past broken mirrors, on principle',
  'is always the first one up in the morning and always the last to bed at night',
  'whistles old work-songs nobody else remembers the words to anymore',
  'guards a family recipe so fiercely that even close friends have never tasted the finished dish',
  'keeps threatening to finally leave the village and see the wider world, and never quite does',
  'has an encyclopedic memory for who owes whom a favour, going back years',
  'talks to the animals like old, dear friends, and seems fairly convinced they talk back',
  'has strong, frequently shared opinions about proper hat etiquette',
  'sneaks table scraps to every stray dog that wanders through, and denies it when asked',
  'keeps a small collection of buttons with no earthly explanation for why',
  'is quietly, deeply superstitious about the number thirteen',
  'still tells the same three stories from their youth, a little differently each time',
  'has never once been on time for anything, and has made peace with this about themself',
];
