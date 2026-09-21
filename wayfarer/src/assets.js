// Optional image-asset layer. The game renders fully with hand-drawn vector
// art (sprites.js) with no assets present at all -- this module lets real
// PNGs quietly take over per-sprite as they're dropped into assets/ at the
// paths below, with zero further code changes. A missing file just fails to
// load and that one sprite keeps using its vector fallback; nothing throws
// and nothing needs to be "enabled." See assets/README.md for exactly what
// each key expects (size, orientation, transparency).

export const ASSET_PATHS = {
  'player.idle': 'assets/player/idle.png',
  'player.run': 'assets/player/run.png',
  'player.jump': 'assets/player/jump.png',
  'player.attack': 'assets/player/attack.png',

  'enemy.wolf': 'assets/enemies/wolf.png',
  'enemy.bandit': 'assets/enemies/bandit.png',
  'enemy.skeleton': 'assets/enemies/skeleton.png',
  'enemy.zombie': 'assets/enemies/zombie.png',
  'enemy.guard': 'assets/enemies/guard.png',
  'enemy.gargoyle': 'assets/enemies/gargoyle.png',

  'terrain.forest.ground': 'assets/terrain/forest_ground.png',
  'terrain.forest.platform': 'assets/terrain/forest_platform.png',
  'terrain.graveyard.ground': 'assets/terrain/graveyard_ground.png',
  'terrain.graveyard.platform': 'assets/terrain/graveyard_platform.png',
  'terrain.castle.ground': 'assets/terrain/castle_ground.png',
  'terrain.castle.platform': 'assets/terrain/castle_platform.png',

  'decor.tree': 'assets/decor/tree.png',
  'decor.bush': 'assets/decor/bush.png',
  'decor.rock': 'assets/decor/rock.png',
  'decor.gravestone': 'assets/decor/gravestone.png',
  'decor.deadtree': 'assets/decor/deadtree.png',
  'decor.crypt': 'assets/decor/crypt.png',
  'decor.pillar': 'assets/decor/pillar.png',
  'decor.banner': 'assets/decor/banner.png',
  'decor.rubble': 'assets/decor/rubble.png',

  'item.gold': 'assets/items/gold.png',
  'item.scrap': 'assets/items/scrap.png',
  'item.potion': 'assets/items/potion.png',
  'item.weapon': 'assets/items/weapon.png',
  'item.armor': 'assets/items/armor.png',
  'item.arrow': 'assets/items/arrow.png',

  'structure.forge': 'assets/structures/forge.png',
  'structure.gate': 'assets/structures/gate.png',
  'hazard.spike': 'assets/hazards/spike.png',
};

const loaded = new Map();

// Fires all loads and returns immediately -- the game starts and plays on
// vector art right away, with real images popping in per-sprite the moment
// each one finishes loading (render.js checks getImage() fresh every frame).
export function preloadAssets() {
  for (const [key, path] of Object.entries(ASSET_PATHS)) {
    const img = new Image();
    img.onload = () => loaded.set(key, img);
    img.onerror = () => {
      // No file at that path yet (or ever, if this sprite stays vector) --
      // expected during normal development, not an error worth surfacing.
    };
    img.src = path;
  }
}

export function getImage(key) {
  return loaded.get(key) || null;
}

export function hasImage(key) {
  return loaded.has(key);
}
