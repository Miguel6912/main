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

## Layout

```
player/          idle, run, jump, attack — 4 poses, one player character
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

`weapons/` and `armour/` are keyed by the item's catalog id (see
`WEAPON_CATALOG`/`ARMOR_CATALOG` in `src/core/items.js`), not by filename
pattern — dagger→rusty_dagger, sword→iron_sword, axe→war_axe,
greatsword→greatsword, bow→hunters_bow; garb→travelers_garb,
leather→leather_vest, chain→chainmail, plate→knights_plate. A pickup shows
the actual weapon/armor art, not a generic icon.

## How each category is drawn (src/render.js)

- **player / enemies**: stretched to fill the entity's real hitbox exactly,
  so the art never drifts from where hits register.
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
  `render.js` — `DECOR_TARGET_H`, `ITEM_TARGET_H`, etc.) times each prop's
  own placement scale.

## If something looks off

The target-height constants in `render.js` were picked before any real art
existed; they held up well against this set, but if a specific prop reads
too big/small once you're looking at it in play, that constant — not the
art — is almost certainly what to adjust.
