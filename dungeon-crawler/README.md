# Descent

A tiny turn-based roguelike dungeon crawler. Dependency-free HTML/CSS/JS
(ES modules) and the Canvas API — no build step, no `npm install`.

## Running it

Browsers block loading ES modules from `file://`, so serve the folder:

```bash
python3 -m http.server 8000
# or: npx serve .
```

Then open **http://localhost:8000** and start descending.

## How to play

- `WASD` / arrow keys to move — walk into a monster to attack it.
- `.` or `Z` to wait a turn in place.
- `P` or `Q` to drink a potion.
- Reach the `>` stairs to descend to the next (harder) floor.
- Death is permanent. Your deepest floor is saved locally as a high score.

Each floor is procedurally generated, only what's in your torchlight is
visible, and monsters get tougher the deeper you go. Gold and potions are
scattered around for you to find along the way.

## Project layout

```
index.html            entry point (canvas + HUD shell)
styles.css             UI styling
src/
  main.js              input handling, HUD/DOM wiring, game loop
  render.js             canvas tile/entity rendering, fog of war
  sprites.js             hand-drawn vector art for every tile/creature/item
  core/
    rng.js               seeded PRNG
    dungeon.js            room+corridor generation, field of view
    entities.js           player/monster stats, combat resolution
    game.js               turn logic tying it all together (pure, DOM-free)
```

All art in `sprites.js` is drawn procedurally with canvas paths/gradients
(no image assets to load) — a small stylized fantasy-icon look: brick walls
with the occasional flickering torch, cracked flagstone floors, a glowing
staircase, and a distinct sprite per monster type and pickup.

`core/` has no DOM dependency, so its logic can be exercised headlessly
(e.g. `node` scripts simulating thousands of turns) when making changes.
