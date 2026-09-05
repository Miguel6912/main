// NPC roster. Adding a villager means adding an entry here plus a dialogue
// tree with the matching id in dialogue.js -- no engine changes required.
//
// schedule: array of { hour, x, y, activity }, sorted by hour. The NPC
// system lerps position between the current and next schedule point across
// the hour gap so movement reads as "walking to work", not teleporting.

export const NPCS = [
  {
    id: 'mira',
    name: 'Mira Thistledown',
    color: '#e2793d',
    accent: '#fff2df',
    title: 'the Baker',
    blurb: 'Village baker with flour permanently in her hair and an opinion on everything.',
    schedule: [
      { hour: 0, x: 660, y: 480, activity: 'sleeping' },
      { hour: 5, x: 660, y: 470, activity: 'firing up the oven' },
      { hour: 6, x: 660, y: 470, activity: 'baking' },
      { hour: 18, x: 1060, y: 505, activity: 'having a well-earned ale' },
      { hour: 21, x: 660, y: 480, activity: 'home for the night' },
    ],
  },
  {
    id: 'tansy',
    name: 'Tansy Goodbarrel',
    color: '#7a9e5c',
    accent: '#fbf6e3',
    title: 'the Innkeeper',
    blurb: 'Runs the inn, knows everyone\'s business, forgets nothing.',
    schedule: [
      { hour: 0, x: 1060, y: 505, activity: 'closing up' },
      { hour: 7, x: 1060, y: 505, activity: 'serving breakfast' },
      { hour: 23, x: 1060, y: 505, activity: 'wiping the last mug' },
    ],
  },
  {
    id: 'bramble',
    name: 'Bramble Nutmeg',
    color: '#8a5fae',
    accent: '#efe2c8',
    title: 'the Shopkeeper',
    blurb: 'Sells a bit of everything and always seems to know what you actually need.',
    schedule: [
      { hour: 0, x: 830, y: 680, activity: 'asleep above the shop' },
      { hour: 8, x: 830, y: 680, activity: 'minding the store' },
      { hour: 20, x: 830, y: 680, activity: 'closing the shutters' },
    ],
  },
  {
    id: 'reginald',
    name: 'Sir Reginald Puddlefoot',
    color: '#4c6fa8',
    accent: '#dfe7f2',
    title: 'the Knight',
    blurb: 'Self-appointed village protector. Braver in stories than in practice.',
    schedule: [
      { hour: 0, x: 350, y: 530, activity: 'guarding (asleep standing up)' },
      { hour: 7, x: 350, y: 530, activity: 'polishing his armour' },
      { hour: 10, x: 900, y: 600, activity: 'patrolling the square' },
      { hour: 14, x: 1050, y: 470, activity: 'patrolling near the inn' },
      { hour: 17, x: 700, y: 500, activity: 'patrolling the bridge road' },
      { hour: 20, x: 350, y: 530, activity: 'returning to the watchpost' },
    ],
  },
  {
    id: 'cobb',
    name: 'Old Cobb',
    color: '#5c6b3f',
    accent: '#cbb995',
    title: 'the Woodcutter',
    blurb: 'Lives at the forest\'s edge. Gruff, but the forest listens to him.',
    schedule: [
      { hour: 0, x: 1445, y: 610, activity: 'asleep by the fire' },
      { hour: 6, x: 1445, y: 610, activity: 'sharpening his axe' },
      { hour: 9, x: 1580, y: 500, activity: 'working in the trees' },
      { hour: 17, x: 1445, y: 610, activity: 'home for supper' },
    ],
  },
  {
    id: 'wren',
    name: 'Wren',
    color: '#d99bc4',
    accent: '#fff0f8',
    title: 'a curious child',
    blurb: 'No one quite remembers whose child Wren is. The village looks after her anyway.',
    schedule: [
      { hour: 0, x: 1010, y: 520, activity: 'asleep behind the inn' },
      { hour: 7, x: 900, y: 560, activity: 'playing by the well' },
      { hour: 16, x: 1440, y: 480, activity: 'watching the forest, hoping' },
      { hour: 19, x: 900, y: 560, activity: 'chasing fireflies' },
      { hour: 21, x: 1010, y: 520, activity: 'settling down for the night' },
    ],
  },
];

export function getNpcData(id) {
  return NPCS.find((n) => n.id === id);
}
