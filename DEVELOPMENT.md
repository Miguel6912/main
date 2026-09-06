# Cosy Village -- Development Notes

Phase 1 of an incrementally-built life-sim: a walkable storybook village
between a castle and an enchanted forest, with day/night, seasons, a handful
of memorable villagers, a random-event framework, and light economy/property
progression. This document tracks what exists, what's known to be rough,
what was deliberately built to make Phase 2+ easier, and what's still ahead.

See `README.md` for how to run it.

## 1. What is currently implemented

**World & time**
- Single continuous village map (1800x1000) between a castle (west) and an
  enchanted forest (east), connected by a river with one bridge.
- Day/night cycle with four visual phases (dawn/day/dusk/night), driving sky
  colour, a night-darkening overlay, stars, and warm window glow on
  buildings at night.
- Four seasons (5 in-game days each, 20-day year), each with a distinct
  ground palette, foliage colour, and ambient particles (spring blossom,
  summer fireflies at night, autumn falling leaves, winter snow).
- Time controls: pause/resume, 1x/2x/4x speed, and "skip to next phase of
  day". Game-time speed never affects player movement speed.

**NPCs & dialogue**
- Six named villagers (Mira the baker, Tansy the innkeeper, Bramble the
  shopkeeper, Sir Reginald the knight, Old Cobb the woodcutter, Wren the
  curious child), each with a daily schedule (they visibly walk between
  scheduled locations) and a distinct dialogue tree.
- A generic, data-driven dialogue engine: conditions (met-before, time of
  day, season, friendship level, world/NPC-memory flags, job state) gate
  which line/option is shown; actions (set flags, change friendship,
  give/take items, accept/turn in jobs, open the shop) are executed
  generically. New NPCs or new conversations are content, not code.
- Per-NPC memory: friendship level and small per-NPC flags (has met the
  player, has heard a particular story, etc).
- Ambient wildlife (cats, dogs, birds, a horse) wander randomly near a home
  point -- pure atmosphere, no dialogue or economy tie-in. Adding one is a
  one-line entry in `data/animals.js`; a new *species* needs a movement
  profile there and a matching shape in `Renderer._drawAnimal`.

**Random events**
- A weighted, condition-gated event roller (season/phase/cooldown-eligible
  events are re-rolled periodically) covering 10 ordinary/comedic events
  (goat escapes, sudden rain, a tone-deaf bard, a pie heist, a mysterious
  sock, a firefly swarm, a leaf-pile ambush, a snowball fight, a blossom
  breeze, a spilled apple cart) and 2 rare magical events (a unicorn at
  dawn near the forest edge; a dragon flying over the castle at dusk), each
  with a distinct particle/glow/chime flourish.
- Witnessed vs missed tracking: proximity to the event's location at fire
  time decides which the player gets. Witnessed events show a popup and are
  logged to the player's journal. Missed events are assigned to a "gossip
  carrier" NPC (Tansy the innkeeper is preferred) who can share the story
  later via a generic "Any news around the village?" dialogue option.
- A Village Almanac (journal) UI lists both witnessed events and rumours
  heard, most recent first.

**Economy**
- Two money-making loops: foraging (four forest spots, one item type each,
  once-per-day cooldown, doubled yield with a purchasable basket upgrade)
  and a rotating daily "odd job" board (three job templates covering
  item-delivery, self-sourced-forage-then-turn-in, and letter-delivery
  patterns) -- picked in `data/jobs.js`.
- Buy/sell at Bramble's General Store (gift items, a permanent forage-yield
  upgrade; sells foraged goods and rare event keepsakes).
- One property/business progression path: an empty plot near the well can
  be bought and upgraded through 3 tiers (Market Stall -> Cosy Shopfront ->
  Charming Cottage Business), each with higher passive daily income,
  claimed by visiting the plot.

**Save/Load**
- Single-slot save to `localStorage`, versioned envelope for future
  migrations. Captures time, player position, all NPC memory, economy
  state (coins/inventory/forage cooldowns/job state), property level,
  the full event log (witnessed + gossip), world flags, and audio mute
  state. Verified via an actual page reload + Continue round-trip.

**Audio**
- Fully procedural (Web Audio API, no external audio files): a soft
  layered ambient pad that shifts tone by time of day, generative bird
  chirps (day) / crickets (night), and short sfx (UI blip, coin chime, a
  four-note magical chime for rare events). Starts on first user gesture
  per browser autoplay policy; mutable from the HUD.

**Rendering & atmosphere**
- Canvas 2D scene, styled after a warm rustic-village reference image: rough
  stone building walls (mottled tone + faint coursing lines + a dark
  foundation strip), exposed dark timber corner posts and header beams,
  rounded hand-bundled thatch roofs (a layered-puff technique, not a flat
  triangle) in place of the original flat-painted cottages, a worn dirt
  road with soft mottling instead of a flat tinted strip, a large landmark
  tree over the village well, and a soft screen-space vignette for depth.
  Decorative trees and the meadow ground texture are real baked sprites
  (see "Art assets" below); castle, river, particles, and UI rings stay
  procedural vector art, generated once from a fixed seed where relevant so
  decoration is stable across reloads. Village square dressing (a picket
  fence around the property plot, a hanging sign beside every building
  door, a proper roofed stone well, barrels and flower pots by doorways)
  adds "little market street" detail in the same style.
- Every character (all six NPCs, the player, and ambient animals) is drawn
  through one shared `Renderer._drawCharacter` / `_drawAnimal` pipeline: a
  shadow, alternating legs, a shaded tunic-shaped body, an outfit-specific
  silhouette accessory (apron/barmaid/vest/armor/cloak/child/traveler --
  see `outfit` in `data/npcs.js`), then head/hair. Limbs use a real
  contralateral gait (left arm swings with right leg, and vice versa) driven
  by each entity's own walk-phase clock, not a uniform bob; four-legged
  animals trot with diagonal leg pairs (front-left+back-right, then the
  other pair) rather than moving all four legs in lockstep, and birds hop
  on two legs with a wing flutter. New NPCs/animals get a look by picking
  an existing `outfit`/species case or adding a new one -- not by writing a
  new draw routine per character.
- Comic/warm tone in dialogue and event text (Sir Reginald's exaggerated
  bravado, Mira's temperamental oven, Wren's wide-eyed belief in magic)
  aiming for Fable-style charm without borrowing any of its content.

**Art assets**
- `assets/tree-{spring,summer,autumn,winter}.png` and `assets/meadow-tile.png`
  are pre-rendered sprites baked from two user-supplied 3D models (a
  detailed low-poly village tree and a meadow ground patch with grass and
  wildflowers, both OBJ meshes with per-part materials but no textures).
  They were baked *offline* using Three.js + `OBJLoader` in a throwaway
  headless-Chromium harness (not part of the shipped game -- the browser
  game itself has no WebGL/Three.js dependency and never loads the source
  OBJ files): each named material (`bark`, `leaf_sun`, `grass_mid`,
  `petal_rose`, etc.) was mapped to a flat colour, the tree was captured
  from a fixed 3/4 angle (four times, once per season's leaf palette) and
  the meadow patch from directly above, then each was alpha-cropped and
  downscaled to a game-appropriate size.
- `src/render/Assets.js` loads these five PNGs once at startup and hands
  ready-to-draw `<img>` elements to the renderer; `Renderer._drawTree`
  falls back to the original flat-vector tree shape for any frame rendered
  before an image has finished decoding, so there's never a visible gap.
  Ground tiling (`_drawMeadowTexture`) only runs in spring/summer and only
  west of the forest edge, so autumn/winter and the forest floor keep their
  flat seasonal colour.
- To add another baked asset from a new 3D model later: register its path
  in `ASSET_PATHS` in `Assets.js`, then reference it from the renderer the
  same way `_drawTree`/`_drawMeadowTexture` do. The original `.obj` source
  files are not stored in this repo (only the baked output is); if new
  colour/angle variants of the existing tree or meadow model are needed,
  the source OBJs would need to be supplied again.

## 2. Known bugs / rough edges

- **Meadow tile seams**: the baked meadow ground texture is tiled with
  alternating flips to break up repetition, but a faint grid can still be
  spotted on close inspection, especially at building/road edges where the
  tile is partly covered.
- **NPC label overlap**: when two NPCs' schedules put them close together,
  their name labels can visually overlap. Cosmetic only.
- **NPCs don't avoid obstacles**: NPC movement is a straight-line lerp
  between schedule waypoints, so in rare cases a walking NPC can visually
  clip through the corner of a building. Player movement has full
  collision; NPCs do not collide with anything (including the player).
- **Fireflies are subtle**: the summer-night firefly ambient particle rate
  is intentionally light and can be easy to miss in a single glance.
- **No mobile/touch input**: keyboard only (WASD/arrows + E + Esc).
- **Single save slot**: saving overwrites the previous save; there's no
  multiple-slot UI.
- **Gift-giving isn't wired up**: `fine_ribbon` and `pressed_flower` are
  purchasable and flagged `giftItem` in `data/shopItems.js`, but there is
  no dialogue action yet that lets the player hand an item to an NPC for a
  friendship boost. They can currently only be bought, not used.
- **Property income can be idle-farmed**: capped at 14 days of accrual, but
  a player who never visits still accumulates it just by advancing time.
  Intentional for Phase 1 simplicity, worth revisiting.
- Canvas is sized in CSS pixels (no devicePixelRatio scaling), so art can
  look slightly soft on very high-density displays.

## 3. Systems intentionally prepared for expansion

The brief asked for data-driven, additive growth. Concretely, here's what
that buys you for Phase 2+:

- **New NPC**: add an entry to `data/npcs.js` (schedule + appearance) and a
  matching tree in `data/dialogue.js`. `MemorySystem` and `DialogueSystem`
  need no changes.
- **New random event** (ordinary or magical): add one object to
  `data/events.js`. Season/phase/cooldown/proximity/effects are all
  declarative; `EventSystem` needs no changes. A new *effect type* (e.g.
  "unlock a location") would need one new case in `EventSystem._fire`.
- **New dialogue condition/action type**: one `case` in
  `DialogueSystem.evaluateCondition` / `runAction` / `applyAction`, usable
  from any NPC's tree immediately.
- **New job template**: add an entry to `data/jobs.js`. The accept/turn-in
  flow, dialogue options, and notice board text are all generic against
  whatever job is currently active.
- **New shop item**: add an entry to `data/shopItems.js` and reference its
  id in `SHOP_BUY_LIST`/`SHOP_SELL_LIST`.
- **New property tier**: append to `data/properties.js`.
- **New building/hotspot/forage spot/obstacle**: add to the relevant array
  in `world/MapData.js`; the renderer, collision, and interaction-range
  code all iterate those arrays rather than hard-coding positions.
- **EventBus** decouples every system (time, economy, events, UI, audio)
  from every other -- a new system (weather, quests, a companion) can
  listen to `time:newDay`, `event:witnessed`, etc. without editing the
  emitters.
- **SaveManager** envelope carries a `version` field specifically so a
  future schema change can add a migration step without breaking existing
  saves.

## 4. Features remaining from the original master brief

This phase deliberately scoped down to a tight, polished slice. Believed
still outstanding for the larger vision:

- Interior scenes for buildings (shops/homes are currently exterior-only,
  entered via dialogue rather than a walkable interior).
- Real NPC pathfinding/obstacle avoidance (currently straight-line lerp).
- Gift-giving as a friendship mechanic (items exist, the interaction
  doesn't yet).
- Deeper relationship arcs: multi-stage friendship/romance milestones,
  unique reaction cutscenes, NPC-to-NPC social simulation.
- A weather system with gameplay impact (currently a flavour-only "sudden
  rain" event; no rain mechanically affecting foraging, movement, etc).
- Farming/crop-growing, animal husbandry, or other production loops beyond
  foraging + jobs + one shop.
- More business/property types beyond the single market-stall path.
- A larger world: traveling beyond this one village (other towns, the
  castle interior, deeper forest zones).
- More rare magical events beyond the unicorn and dragon; a rarer "epic"
  tier; events that chain into short storylines.
- Achievements/collections UI beyond the almanac.
- A real soundtrack / musical themes per location (currently fully
  procedural ambience + stingers, no composed melodies).
- Multiple save slots, cloud save, or profile-based saves.
- Controller and touch/mobile support.
- Marriage/family or town-building style long-term goals.

## 5. Recommended next phase

Suggested Phase 2, roughly in priority order:

1. **Gift-giving.** The items already exist; add a `giveItem` dialogue
   action variant that consumes an inventory item and grants friendship
   (with per-NPC "liked gifts" data for bonus warmth). High value, low
   effort, directly extends the existing systems.
2. **NPC pathfinding / obstacle avoidance**, or at minimum waypoint-based
   walking (a short list of via-points per schedule transition) so NPCs
   stop clipping through buildings.
3. **Interior scenes** for at least the inn and general store -- even a
   single static interior "room" swap on entry would let shops/dialogue
   feel less like talking to a lawn ornament.
4. **Weather with mechanical impact**: rain reduces forage yield outdoors
   but boosts a new indoor activity; snow slows movement slightly; ties
   the existing "sudden rain"/seasonal palette work into gameplay instead
   of pure flavour.
5. **2-3 more NPCs and a second rare-event tier**, to broaden both the
   social and the "you had to be there" event content now that the
   frameworks for both are proven out.
6. **Multi-step quest chains** riffing on the job-board pattern (a job that
   unlocks a follow-up job with its own NPC reactions), likely wanting a
   small `QuestSystem` alongside the existing `EconomySystem` job fields.
