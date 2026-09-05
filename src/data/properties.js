// The single Phase-1 business progression path: an empty plot near the
// well that the player can buy and upgrade. Adding a tier is just adding
// an entry to this array.

export const PROPERTY_LEVELS = [
  {
    level: 0,
    name: 'Empty Plot',
    cost: 0,
    incomePerDay: 0,
    desc: 'An empty patch of grass near the well. Someone could build something here.',
  },
  {
    level: 1,
    name: 'Market Stall',
    cost: 40,
    incomePerDay: 8,
    desc: 'A modest wooden stall selling odds and ends. Brings in a trickle of coin each day.',
  },
  {
    level: 2,
    name: 'Cosy Shopfront',
    cost: 150,
    incomePerDay: 20,
    desc: 'A proper little shop with a striped awning. Villagers actually stop and browse now.',
  },
  {
    level: 3,
    name: 'Charming Cottage Business',
    cost: 400,
    incomePerDay: 45,
    desc: 'The pride of the village high street. Passers-by point it out to visitors.',
  },
];

export function getPropertyTier(level) {
  return PROPERTY_LEVELS[Math.max(0, Math.min(PROPERTY_LEVELS.length - 1, level))];
}
