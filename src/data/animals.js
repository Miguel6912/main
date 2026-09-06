// Ambient wildlife roster: purely decorative (no dialogue, no economy tie-in)
// -- they exist to make the village feel lived-in. Each wanders randomly
// within `radius` of its `home` point. Adding a new animal is one entry
// here; adding a new animal *type* needs a movement profile below and a
// matching draw case in Renderer._drawAnimal.
export const ANIMALS = [
  { id: 'cat1', type: 'cat', home: { x: 860, y: 705 }, radius: 90, color: '#5a5a56' },
  { id: 'cat2', type: 'cat', home: { x: 610, y: 510 }, radius: 70, color: '#d9a05a' },
  { id: 'dog1', type: 'dog', home: { x: 1090, y: 560 }, radius: 110, color: '#b8874a' },
  { id: 'dog2', type: 'dog', home: { x: 260, y: 600 }, radius: 100, color: '#7a5a3a' },
  { id: 'bird1', type: 'bird', home: { x: 700, y: 300 }, radius: 130, color: '#8a4a2e' },
  { id: 'bird2', type: 'bird', home: { x: 960, y: 250 }, radius: 130, color: '#4a6a8a' },
  { id: 'bird3', type: 'bird', home: { x: 1230, y: 340 }, radius: 130, color: '#5a5a56' },
  { id: 'bird4', type: 'bird', home: { x: 500, y: 620 }, radius: 100, color: '#c9a35a' },
  { id: 'horse1', type: 'horse', home: { x: 200, y: 700 }, radius: 70, color: '#6b4a2e' },
  { id: 'bird5', type: 'bird', home: { x: 1450, y: 1400 }, radius: 150, color: '#e8dfc8' },
  { id: 'dog3', type: 'dog', home: { x: 700, y: 1300 }, radius: 120, color: '#9c7a4a' },
];

export const ANIMAL_PROFILES = {
  cat: { speed: 42, idleMin: 2, idleMax: 5, scale: 0.55 },
  dog: { speed: 58, idleMin: 1.5, idleMax: 4, scale: 0.75 },
  bird: { speed: 66, idleMin: 1, idleMax: 3, scale: 0.35 },
  horse: { speed: 34, idleMin: 3, idleMax: 7, scale: 1.6 },
};
