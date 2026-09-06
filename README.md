# Cosy Village

A storybook life between the castle and the enchanted forest. Phase 1 of an
incrementally-built village life-sim -- see `DEVELOPMENT.md` for what's
implemented, known rough edges, and where it's headed next.

## Running it

This is a dependency-free, build-free project: plain HTML/CSS/JS (ES
modules) and the Web Audio/Canvas APIs. No `npm install` required.

Browsers block loading ES modules directly from `file://` URLs, so you need
a tiny local static server -- any of these work:

```bash
# Option 1: Python (usually already installed)
python3 -m http.server 8000

# Option 2: Node, if you have it
npx serve .

# Option 3: PHP, if you have it
php -S localhost:8000
```

Then open **http://localhost:8000** in a modern desktop browser (Chrome,
Firefox, Edge, or Safari) and click **New Game**.

## Controls

| Action | Keys |
| --- | --- |
| Move | `W A S D` or Arrow Keys |
| Interact / Talk | `E` |
| Close menus | `Esc` |
| Time controls, journal, bag, save/load, sound | on-screen buttons (top bar) |

## What to try first

- Walk around the village and talk to all six villagers -- each has a
  distinct personality and a daily schedule, so the same NPC looks
  different at 6am vs 9pm.
- Cross the bridge into the forest and forage the four gathering spots
  (each resets once per day).
- Check the notice board near the inn for the day's odd job, and the empty
  plot near the well for a business you can grow.
- Use the speed controls (1x/2x/4x) to fast-forward through a full day/
  night cycle, and through several days to watch the seasons change.
- Keep an eye out at dawn near the forest edge in spring/summer, and at
  dusk over the castle any time of year -- two rare, memorable sights are
  hiding in the random-event pool. If you miss one, ask around town --
  someone will have heard about it.
- Save from the top bar, close the tab, and reload -- Continue picks up
  exactly where you left off.

## Project layout

```
index.html            entry point (DOM shell for HUD/dialogue/panels)
styles.css            all UI chrome styling
assets/               baked tree/meadow sprites (see DEVELOPMENT.md "Art assets")
src/
  main.js             wires every system together + the game loop
  core/                EventBus, GameLoop, RNG, SaveManager, Input
  world/               MapData (all world geometry), TimeSystem (calendar)
  entities/            Player, NPC
  systems/             MemorySystem, EconomySystem, PropertySystem,
                       EventSystem, DialogueSystem
  data/                npcs, dialogue, events, shopItems, properties, jobs
                       -- pure content; this is what you edit to add things
  render/              Palette, Particles, Renderer (canvas drawing), Assets (image loading)
  audio/               AudioManager (procedural Web Audio)
  ui/                  UIManager (all DOM/HUD glue)
```

The `data/` folder is deliberately the main surface for adding content --
see `DEVELOPMENT.md` section 3 for exactly what each addition looks like.
