# Wayfarer

A tiny 2D side-scrolling action-platformer. Dependency-free HTML/CSS/JS
(ES modules) and the Canvas API — no build step, no `npm install`.

Fight your way rightward through five procedurally generated realms in
rotation — forest, graveyard, castle, frostmarch, and swamp — each tougher
than the last. Kill enemies and find chests for gold, scrap, and gear;
forge upgrades at anvils along the way; reach the glowing gate at the end
of a realm to press on.

## Running it

Browsers block loading ES modules from `file://`, so serve the folder:

```bash
python3 -m http.server 8000
# or: npx serve .
```

Then open **http://localhost:8000**.

## How to play

- `A`/`D` or arrow keys to move, `W`/`Space` to jump.
- `J`/`F` to attack — melee weapons swing on contact, bows fire an arrow.
- `E` to open the forge when you're standing near an anvil, and again to close it.
- Walking over a better weapon or armor auto-equips it; anything worse is
  broken down into scrap instead, so nothing found is wasted.
- Falling into a pit costs health and drops you back on the last solid
  ground — mind your footing around gaps.
- Death is permanent. Your furthest distance is saved locally as a high score.

## Project layout

```
index.html            entry point (canvas + HUD + forge modal shell)
styles.css             UI styling
assets/                painted art (see assets/README.md) -- falls back to vector per sprite
src/
  main.js              input handling, game loop, HUD/forge UI wiring
  assets.js             optional image loader (falls back to vector art per sprite)
  render.js             camera, parallax background, draw order
  sprites.js             hand-drawn vector art for terrain, actors, items
  core/
    rng.js               seeded PRNG
    items.js             weapon/armor catalog, tiering, forge costs
    entities.js           player/enemy factories and stats
    levelgen.js           procedural terrain, hazards, spawns per biome
    game.js               real-time physics/combat/AI update loop (pure, DOM-free)
    story.js               dialogue content (intro + per-biome blacksmith lines)
```

`core/` has no DOM dependency, so its physics and combat logic can be
exercised headlessly — e.g. a `node` script stepping `update(state, input, dt)`
thousands of times with scripted input — when making changes.

## Story

A dismissible intro screen (once per page load) opens with Princess Elara
hiring you to find her father, the Hollow King, and undo whatever's
rotting the realm. Doran Emberfist, the dwarf blacksmith behind every
forge, gets a short round of dialogue the first time you reach his forge
in each biome per run — same character throughout, printed through the
existing message log (`src/core/game.js`'s `addMessage`), not a separate
dialogue system. All the actual lines live in `src/core/story.js`, kept
apart from the physics/combat code so editing dialogue never touches
simulation logic.

## Art

Every sprite has a hand-drawn vector fallback (`src/sprites.js`), but
`assets/` now ships with a full painted set (player, all enemies, all three
biomes' backgrounds/terrain/decor, items, per-weapon and per-armor icons,
forge/gate/spikes) that takes over automatically wherever a file exists —
no code changes needed either way. See `assets/README.md` for the layout
and how each category gets drawn (stretched to a hitbox, tiled, or scaled
to a fixed height, depending on what the art actually is).
