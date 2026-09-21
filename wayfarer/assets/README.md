# Drop-in art assets

The game runs entirely on hand-drawn vector art (`src/sprites.js`) with no
files in this folder at all. Anything placed at the exact paths below is
picked up automatically the next time the page loads — no code changes, no
build step, no "enabling" anything. A missing file just leaves that one
sprite on its vector fallback; nothing breaks.

The loader and full path list live in `src/assets.js` (`ASSET_PATHS`) — this
file is the human-readable version of the same list.

## Format

- PNG, transparent background, no drop shadow baked in (the game adds its
  own where relevant, e.g. hit-flash, invulnerability flicker).
- Side view (profile), facing **right** — the game flips left-facing
  automatically.
- No fixed pixel size required. Characters/enemies stretch to fit their
  actual hitbox (see sizes below, for reference/proportion only); terrain
  and decoration images scale to a fixed on-screen height and keep their own
  aspect ratio.

## Player — `assets/player/`

Four poses, each its own file:

| File | Used when |
| --- | --- |
| `idle.png` | Standing still |
| `run.png` | Moving on the ground |
| `jump.png` | Airborne |
| `attack.png` | Mid-swing (`swingFlash` active) |

Reference hitbox: **38×64**.

## Enemies — `assets/enemies/`

One idle/default pose each — `wolf.png`, `bandit.png` (forest),
`skeleton.png`, `zombie.png` (graveyard), `guard.png`, `gargoyle.png`
(castle). Reference hitboxes vary by type (roughly 35–49 wide, 38–64 tall);
exact values are in `ENEMY_TYPES` in `src/core/entities.js` if you want to
match proportions precisely.

## Terrain — `assets/terrain/`

Two per biome, **seamlessly tileable** left-to-right (they're repeated
across however wide a ground segment or platform is):

- `forest_ground.png` / `forest_platform.png`
- `graveyard_ground.png` / `graveyard_platform.png`
- `castle_ground.png` / `castle_platform.png`

Ground tiles are stretched to fill the visible ground band (~80px); platform
tiles to a thin ~16px strip. Any aspect ratio works — width per tile is
derived from it — but a tile roughly 2:1 (wide) reads best at that height.

## Decorations — `assets/decor/`

One each, scaled to ~90px tall by default (times each placed instance's own
random scale factor, so some read bigger/smaller than others):

- Forest: `tree.png`, `bush.png`, `rock.png`
- Graveyard: `gravestone.png`, `deadtree.png`, `crypt.png`
- Castle: `pillar.png`, `banner.png`, `rubble.png`

## Items — `assets/items/`

Scaled to ~26px tall: `gold.png`, `scrap.png`, `potion.png`, `weapon.png`
(generic weapon-pickup icon), `armor.png` (generic armor-pickup icon),
`arrow.png` (the bow's projectile, ~14px, drawn horizontally).

## Structures & hazards

- `assets/structures/forge.png` — the whole blacksmith setup (house, anvil,
  dwarf) as one image, ~100px tall.
- `assets/structures/gate.png` — the level-end portal, ~120px tall.
- `assets/hazards/spike.png` — tiled like ground/platform, ~27px tall.

## If proportions look off once real art is in

The target-height constants (90/26/14/100/120/27px etc.) live at the top of
`src/render.js` and in the individual `drawAnchoredImage`/`drawTiledImage`
calls — they're a first guess made without any real art to check against,
not a hard spec. Adjust them once you can see how the actual images read in
place.
