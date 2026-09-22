// Optional image-asset layer. The game renders fully with hand-drawn vector
// art (sprites.js) with no assets present at all -- this module lets real
// PNGs quietly take over per-sprite as they're dropped into assets/ at the
// paths below, with zero further code changes. A missing file just fails to
// load and that one sprite keeps using its vector fallback; nothing throws
// and nothing needs to be "enabled." See assets/README.md for exactly what
// each key expects (size, orientation, transparency).

export const ASSET_PATHS = {
  // 4x4 animation sheets (16 frames each) -- superseded the old one-pose-
  // per-file player art. See src/animator.js for how a sheet's frames are
  // grouped into named clips (PLAYER_CLIPS in render.js).
  'player.sheet.moods': 'assets/player/moods.png',
  'player.sheet.walkDeath': 'assets/player/walk_death.png',
  'player.sheet.runJump': 'assets/player/run_jump.png',
  'player.sheet.melee': 'assets/player/melee.png',

  'enemy.wolf': 'assets/enemies/wolf.png',
  'enemy.bandit': 'assets/enemies/bandit.png',
  'enemy.skeleton': 'assets/enemies/skeleton.png',
  'enemy.zombie': 'assets/enemies/zombie.png',
  // Single static pose -- kept as the fallback for the sheet keys below,
  // in case either sheet is ever missing (see pickEnemyClipName's use of
  // getImage in render.js).
  'enemy.guard': 'assets/enemies/guard.png',
  'enemy.gargoyle': 'assets/enemies/gargoyle.png',
  // 4x4 animation sheets, same convention as the player's (src/animator.js):
  // idle_attack is 8 frames idle + 8 frames attack, walk_death is 8 frames
  // walk + 8 frames death. The guard is the first enemy to get real
  // animation instead of the static-pose-plus-bob hack every other enemy
  // still uses -- see ENEMY_CLIPS in render.js.
  'enemy.guard.sheet.idleAttack': 'assets/enemies/guard_idle_attack.png',
  'enemy.guard.sheet.walkDeath': 'assets/enemies/guard_walk_death.png',
  // Not delivered yet -- frostmarch/swamp render on their vector fallback
  // (sprites.js drawEnemy) until real art lands at these paths, exactly
  // like every other sprite here before its art existed.
  'enemy.frostwolf': 'assets/enemies/frostwolf.png',
  'enemy.revenant': 'assets/enemies/revenant.png',
  'enemy.bogling': 'assets/enemies/bogling.png',
  'enemy.drowned': 'assets/enemies/drowned.png',

  'biome.forest.background': 'assets/forest/background.png',
  'biome.forest.ground': 'assets/forest/ground.png',
  'biome.forest.platform': 'assets/forest/platform.png',
  'biome.graveyard.background': 'assets/graveyard/background.png',
  'biome.graveyard.ground': 'assets/graveyard/ground.png',
  'biome.graveyard.platform': 'assets/graveyard/platform.png',
  'biome.castle.background': 'assets/castle/background.png',
  'biome.castle.ground': 'assets/castle/ground.png',
  'biome.castle.platform': 'assets/castle/platform.png',
  // Also not delivered yet -- same vector-fallback story as the enemies
  // above.
  'biome.frostmarch.background': 'assets/frostmarch/background.png',
  'biome.frostmarch.ground': 'assets/frostmarch/ground.png',
  'biome.frostmarch.platform': 'assets/frostmarch/platform.png',
  'biome.swamp.background': 'assets/swamp/background.png',
  'biome.swamp.ground': 'assets/swamp/ground.png',
  'biome.swamp.platform': 'assets/swamp/platform.png',

  'decor.tree': 'assets/forest/tree.png',
  'decor.bush': 'assets/forest/bush.png',
  'decor.rock': 'assets/forest/rock.png',
  'decor.gravestone': 'assets/graveyard/gravestone.png',
  'decor.deadtree': 'assets/graveyard/dead_tree.png',
  'decor.crypt': 'assets/graveyard/crypt.png',
  'decor.pillar': 'assets/castle/pillar.png',
  'decor.banner': 'assets/castle/banner.png',
  'decor.rubble': 'assets/castle/rubble.png',
  'decor.icetree': 'assets/frostmarch/icetree.png',
  'decor.icespike': 'assets/frostmarch/icespike.png',
  'decor.frostcairn': 'assets/frostmarch/frostcairn.png',
  'decor.mangrove': 'assets/swamp/mangrove.png',
  'decor.reeds': 'assets/swamp/reeds.png',
  'decor.bogstone': 'assets/swamp/bogstone.png',

  'item.gold': 'assets/items/coins.png',
  'item.scrap': 'assets/items/scrap.png',
  'item.potion': 'assets/items/health_potion.png',
  'item.arrow': 'assets/items/arrow.png',

  // Keyed by the weapon/armor catalog id (core/items.js) so a dropped
  // pickup shows the actual item, not a generic "weapon" icon.
  'weapon.dagger': 'assets/weapons/rusty_dagger.png',
  'weapon.sword': 'assets/weapons/iron_sword.png',
  'weapon.axe': 'assets/weapons/war_axe.png',
  'weapon.greatsword': 'assets/weapons/greatsword.png',
  'weapon.bow': 'assets/weapons/hunters_bow.png',
  'armor.garb': 'assets/armour/travelers_garb.png',
  'armor.leather': 'assets/armour/leather_vest.png',
  'armor.chain': 'assets/armour/chainmail.png',
  'armor.plate': 'assets/armour/knights_plate.png',

  'structure.forge': 'assets/structures/forge.png',
  'structure.gate': 'assets/structures/portal.png',
  'hazard.spike': 'assets/structures/spikes.png',
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
