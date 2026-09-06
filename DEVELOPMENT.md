# Cosy Village -- Development Notes

Phase 1 of an incrementally-built life-sim: a walkable storybook village
between a castle and an enchanted forest, with day/night, seasons, a handful
of memorable villagers, a random-event framework, and light economy/property
progression. This document tracks what exists, what's known to be rough,
what was deliberately built to make Phase 2+ easier, and what's still ahead.

See `README.md` for how to run it.

## 1. What is currently implemented

**World & time**
- Single continuous map (2200x2980, up from the original 1800x1000) between
  a castle (west) and an enchanted forest (east, now deeper, ~320 trees),
  connected by a river with one bridge. A road leads south from the village
  well into an orchard (apple trees around three forage spots) and a still
  lake, home to the cider press (see "Economy" below), then further south
  again into **Cottage Row**, a ~100-house residential quarter (see "NPCs &
  dialogue"). The river deliberately ends before Cottage Row (`RIVER_END_Y`)
  rather than running the full world height, so the new district isn't cut
  off with only the original, distant bridge as a crossing. All original
  village content stayed at its original coordinates -- the world grew
  outward twice now, nothing that already worked had to move or be
  re-verified from scratch.
- Day/night cycle with four visual phases (dawn/day/dusk/night), driving sky
  colour, a night-darkening overlay, stars, and warm window glow on
  buildings at night.
- Four seasons (5 in-game days each, 20-day year), each with a distinct
  ground palette, foliage colour, and ambient particles (spring blossom,
  summer fireflies at night, autumn falling leaves, winter snow).
- Time controls: pause/resume, 1x/2x/4x speed, and "skip to next phase of
  day". Game-time speed never affects player movement speed.

**NPCs & dialogue**
- Six named leads (Mira the baker, Tansy the innkeeper, Bramble the
  shopkeeper, Sir Reginald the knight, Old Cobb the woodcutter, Wren the
  curious child), each individually hand-written in `data/npcs.js` /
  `data/dialogue.js`: a daily schedule, a distinct outfit, and a dialogue
  tree with its own jokes, callbacks, and (for three of them) a reaction to
  a specific rare event.
- **Cottage Row's ~100+ background villagers** (`data/villagerPools.js` +
  `data/villagers.js`) are generated, not individually hand-typed one by
  one -- but genuinely generated, not copy-pasted: a fixed-seed RNG
  combines a name (from `FIRST_NAMES`/`SURNAMES`) with one of 24
  hand-written professions (farmer, weaver, blacksmith, scholar, elder,
  etc. -- each with its own outfit, workplace, and four pieces of
  hand-written first-person flavour text) and one of 30 hand-written
  personality quirks, to build a real per-villager `DialogueSystem` tree:
  a named greeting, an "about yourself" line, and a one-time branching
  decision (accept/decline a small request) with its own friendship
  payoff -- the same node/condition/action shape the six leads use, so
  `DialogueSystem` needed zero changes. Every villager also gets a home
  (a Cottage Row door) and a two-stop daily schedule (home at night, a
  profession-appropriate spot by day -- fields, lakeside, forest edge, or
  their own doorstep) via `NPC.js`'s existing lerp-between-waypoints
  movement. Honest framing: the *combinatorics* are individual (a given
  name+profession+quirk combination is very unlikely to repeat across
  ~100 villagers), but the four profession flavour lines and the greeting/
  decision *template* are shared across everyone in that profession --
  it's closer to "everyone has a real, distinct character" than to
  "everyone has 100% bespoke, never-reused dialogue prose."
- A generic, data-driven dialogue engine: conditions (met-before, time of
  day, season, friendship level, world/NPC-memory flags, job state) gate
  which line/option is shown; actions (set flags, change friendship,
  give/take items, accept/turn in jobs, open the shop) are executed
  generically. New NPCs or new conversations are content, not code.
- Per-NPC memory: friendship level and small per-NPC flags (has met the
  player, has heard a particular story, has resolved their one-time
  decision, etc).
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
- The cider press (`systems/CiderPressSystem.js`, in the southern orchard):
  a multi-stage activity rather than a menu-instant conversion. Press 4
  apples to start a batch, then the world simulates fermentation over 3
  real in-game days -- visiting mid-ferment just shows a days-remaining
  status, and a toast fires the day it's ready. Bottling rolls a quality
  (modest/fine/exceptional) that decides how many bottles you get. Modeled
  on the property system's day-based accrual, but with named stages instead
  of a continuous number, as the shape for other future "start it, come
  back later" activities (see section 5).

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
- Every character (all NPCs -- leads and Cottage Row alike --, the player,
  and ambient animals) is drawn through one shared `Renderer._drawCharacter`
  / `_drawAnimal` pipeline: a shadow, alternating legs, a shaded
  tunic-shaped body, an outfit-specific silhouette accessory
  (apron/barmaid/vest/armor/cloak/child/traveler/robe/shawl -- see `outfit`
  in `data/npcs.js` / `data/villagerPools.js`), then head/hair. Limbs use a
  real contralateral gait (left arm swings with right leg, and vice versa)
  driven by each entity's own walk-phase clock, not a uniform bob;
  four-legged animals trot with diagonal leg pairs (front-left+back-right,
  then the other pair) rather than moving all four legs in lockstep, and
  birds hop on two legs with a wing flutter. New NPCs/animals get a look by
  picking an existing `outfit`/species case or adding a new one -- not by
  writing a new draw routine per character.
- Cottage Row's ~100 cottages are drawn by a deliberately cheap
  `Renderer._drawCottage` (about a third of the draw calls a named landmark
  building costs -- flat wall + triangle thatch + one door + one window,
  no per-building stone-mottling pass), and the NPC/animal draw list is
  culled to a margin around the camera before sorting/drawing each frame
  (`render()`'s `cullMargin`) -- so per-frame cost tracks what's on screen,
  not the size of the population. Measured in a headless run standing in
  the densest point of Cottage Row at midnight (everyone home, ~70 NPCs
  within camera range at once): ~46-56 FPS in a software-rendered headless
  Chromium; real browsers with GPU compositing should do noticeably better.
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
- **Cottage Row's flavour text is templated per profession, not unique per
  villager**: two "Weaver" villagers share the same about-me/decision
  wording (only their name, home, schedule, appearance, and friendship
  state differ) -- see "NPCs & dialogue" above for the honest breakdown of
  what's individually generated vs shared per profession.
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

- **New lead NPC**: add an entry to `data/npcs.js` (schedule + appearance)
  and a matching tree in `data/dialogue.js`. `MemorySystem` and
  `DialogueSystem` need no changes.
- **New background villager profession** (for Cottage Row): add one entry
  to `PROFESSIONS` in `data/villagerPools.js` (an outfit, a work zone, and
  the four flavour-text functions) -- `data/villagers.js`'s generator picks
  it up automatically for future-generated villagers. **Growing Cottage Row
  itself** (more houses) is the same story as growing the world: extend
  `generateNeighborhood()`'s zone in `world/MapData.js`, and the villager
  generator, obstacle list, and cottage renderer all follow from
  `NEIGHBORHOOD_HOUSES` automatically.
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
  code all iterate those arrays rather than hard-coding positions. Adding a
  whole new *district* (as the orchard+lake one was) is the same story at a
  larger scale: grow `WORLD_WIDTH`/`WORLD_HEIGHT`, add content in the new
  space, and leave every existing coordinate untouched -- nothing already
  working has to move or be re-verified.
- **New NPC/animal look**: pick an existing `outfit` (NPCs) or species case
  (animals) or add a new one in `Renderer._drawOutfitDetail` /
  `_drawAnimal` -- every character/critter renders through the same shared
  pipeline, so there's one place to extend, not one per character.
- **New multi-stage activity** (a second "start it, ferment/craft/grow it,
  come back" loop beyond cider): follow `CiderPressSystem`'s shape (a
  `stage` enum, a day-based `checkProgress`, a quality-roll `collect`) --
  see section 5 for generalizing this into a shared base once there are two.
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
- Farming/crop-growing, or other production loops beyond foraging + jobs +
  one shop + the cider press.
- More business/property types beyond the single market-stall path, and
  more multi-stage activities beyond cider (the shape is proven out now --
  see section 5).
- Traveling beyond this one map (other towns, the castle interior).
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
7. **Generalize `CiderPressSystem` into a small reusable "multi-stage
   activity" base** (stage enum + day-based transitions + a quality roll)
   now that there's one working example, so a second activity (a smokehouse,
   a loom, a mead barrel) is mostly new data rather than a new state
   machine.
8. **An NPC tied to the orchard/cider press** -- right now it's a standalone
   station with no gatekeeper; a seventh villager (an orchardist?) could
   sell starter apple saplings, react to the player's cider, or fold cider
   into the job board.
