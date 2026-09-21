# Art assets

Real painted art, in place and wired up. If a file at one of these paths
goes missing (or gets replaced with a broken image), that one sprite falls
back to the original hand-drawn vector art automatically — nothing else
breaks. The loader and full path list live in `src/assets.js`
(`ASSET_PATHS`); this file is the human-readable index.

Source art was delivered at ~1200-1500px per side (AI-generated,
painterly style); everything here has been downscaled (LANCZOS, PNG
optimize) to whatever it actually needs for how large it renders in
game, which cut total size from ~82MB to ~13MB with no visible quality
loss at game scale. If you bring in new art at similar source sizes,
re-run that resize pass rather than committing multi-MB originals.

Every non-background file is also auto-cropped to its alpha content
bounding box (2px safety margin) — the source files had transparent
padding on most edges (up to 57px on some), which left visible gaps
between characters/spikes and the ground, and let ground/platform art's
top padding show the vector fallback color through as a seam. If new art
arrives with similar padding, crop it the same way (`Image.getbbox()` on
the alpha channel) before committing.

## Layout

```
player/          4 animation sheets (see "Animation sheets" below) —
                 moods (idle/hurt/dodge/victory), walk_death, run_jump, melee
enemies/         wolf, bandit, skeleton, zombie, guard, gargoyle
forest/          background, ground, platform, tree, bush, rock
graveyard/       background, ground, platform, gravestone, dead_tree, crypt
castle/          background, ground, platform, pillar, banner, rubble
items/           coins, scrap, health_potion, arrow
weapons/         rusty_dagger, iron_sword, war_axe, greatsword, hunters_bow
armour/          travelers_garb, leather_vest, chainmail, knights_plate
structures/      forge, portal (the level-end gate), spikes (hazard)
alternate_versions/
                 second takes on wolf, bush, rock, pillar, banner, rubble —
                 not wired into the manifest. Swap one in by pointing its
                 ASSET_PATHS entry at the alternate file if you prefer its
                 look; the primary version stays as an unused file either way.
```

### Not delivered yet (two newer biomes, playing on vector fallback)

Two more biomes exist in the rotation (`src/core/levelgen.js` `BIOMES`) with
no art behind them yet -- same story every other biome went through before
its art landed: fully playable now on hand-drawn vector fallback
(`src/sprites.js`), ready to take over instantly the moment files show up
at these paths, zero code changes needed either way.

```
enemies/         + frostwolf, revenant (frostmarch), bogling, drowned (swamp)
frostmarch/      background, ground, platform, icetree, icespike, frostcairn
swamp/           background, ground, platform, mangrove, reeds, bogstone
```

`weapons/` and `armour/` are keyed by the item's catalog id (see
`WEAPON_CATALOG`/`ARMOR_CATALOG` in `src/core/items.js`), not by filename
pattern — dagger→rusty_dagger, sword→iron_sword, axe→war_axe,
greatsword→greatsword, bow→hunters_bow; garb→travelers_garb,
leather→leather_vest, chain→chainmail, plate→knights_plate. A pickup shows
the actual weapon/armor art, not a generic icon.

## Animation sheets

`player/*.png` are 4x4 grids (16 frames each), not single poses — see
`src/animator.js` for the frame-slicing math and `PLAYER_CLIPS` in
`src/render.js` for which rows of which sheet map to which named clip
(idle, run, jump, hurt, death, and 4 melee combo swings). Several clips can
share one sheet file. **Downscale these without cropping** — cropping
would shift the grid's cell boundaries, since `frameRect()` divides the
image's own pixel dimensions by 4 to find each cell.

A few frames (mostly in `walk_death.png`'s death rows) have a stray limb
fragment from the row above bleeding across the cell boundary — a known
issue from the source generation, not a frame-slicing bug (verified by
extracting the raw cells directly). Low-priority since it only shows in
the death clip, which is rarely lingered on (the game-over modal covers
it within one frame in normal play); worth a proper source-side fix
(re-crop or regenerate the affected frames) if the sheets get revisited.

Enemies, bosses, and NPCs delivered in the same expansion (spells, ranged
effects, castle parallax layers, a full boss roster, and a blacksmith
portrait/workbench set) are not wired in yet -- only the player's moveset
uses the new animation system so far. They're extracted and inventoried,
waiting on the next integration pass.

## How each category is drawn (src/render.js)

- **player**: same per-frame animation system as above, stretched to the
  entity's real hitbox (`drawSheetBox`) so the art never drifts from where
  hits register regardless of which frame is showing.
- **enemies** (still single-pose, not yet upgraded to sheets): stretched to
  fill the entity's real hitbox exactly, same reasoning.
- **`*/background.png`**: these are full painted vistas (sun, a distant
  landmark, specific mountains) — not a repeating pattern. Scaled to cover
  the viewport once and panned only slightly (clamped within its own
  overflow), rather than tiled, so landmarks never visibly repeat down a
  multi-thousand-px level.
- **`*/ground.png`**: a seamless-enough cross-section, tiled horizontally
  across however wide a segment is.
- **`*/platform.png` / `structures/portal.png` / `structures/forge.png`**:
  self-contained chunks with finished edges (not repeating strips) —
  stretched once to fit rather than tiled.
- **`structures/spikes.png`**: a repeating spike row, tiled like ground.
- **decorations / items / weapons / armour**: aspect-ratio preserved,
  scaled to a fixed target height (documented as constants at the top of
  `render.js` — `DECOR_BASE_H` per decor type, `ITEM_TARGET_H`, etc.) times
  each prop's own placement scale.

## If something looks off

The target-height constants in `render.js` were picked before any real art
existed; they held up well against this set, but if a specific prop reads
too big/small once you're looking at it in play, that constant — not the
art — is almost certainly what to adjust.
