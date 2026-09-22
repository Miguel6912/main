# Wayfarer — Roadmap

> The actionable breakdown of `GAP_ANALYSIS.md` into work we can actually pick up. `DESIGN.md` is the vision (changes rarely). `GAP_ANALYSIS.md` is a snapshot of where we stood at last review (changes when re-audited). **This file is the backlog** — check items off as they ship, add sub-items when a step turns out to need one, don't reorder the phases without a real reason (each phase is a build-time dependency for the next, per `DESIGN.md` §32).
>
> Every item here should be small enough to build, test, and commit in one sitting — that's deliberate (`DESIGN.md` §36.7). If an item turns out bigger than that once we're in it, split it rather than push through.

---

## Phase 1 — Combat Foundation
*Target: combat is enjoyable even in an empty test arena. This is the closest phase to done — finish it before starting Phase 2.*

- [ ] **1.1 Dodge / roll** — new input (key + a new touch button), a short dash with a brief invulnerability window, on a cooldown. Wires up the `dodge` clip that already exists unused in `PLAYER_CLIPS` (`render.js`) — no new art needed.
- [ ] **1.2 Enemy defense + player crit** — add a `defense`/`armor` stat to `ENEMY_TYPES` (`entities.js`) and thread it through `resolveDamage` (`items.js`); add a crit chance/multiplier on the player's side. Needed before 1.3's axe hook can mean anything.
- [ ] **1.3 Weapon identity, pass one** — pick 2 of the 5 existing weapons and give each one real mechanical hook (not just different numbers): e.g. dagger — bonus crit on the attack right after a dodge; axe — bonus damage vs. enemy defense (needs 1.2). Prove the pattern on two before doing all five.
- [ ] **1.4 Weapon identity, pass two** — sword, greatsword, bow get their own hooks once the pattern from 1.3 is proven out.
- [ ] **1.5 Stagger state** — a distinct meter/threshold on enemies, separate from the existing brief hitstun, that opens a longer vulnerable window when filled. Reusable by boss phases later.
- [ ] **1.6 Minimal boss framework** — a generic `Boss` shape (phases, attacks, drops, hooks) and a small state machine, decoupled from the regular enemy AI in `updateEnemies`.
- [ ] **1.7 Prove it out on the Hollow Hare** — `clover_move_attack.png` / `clover_death_reaction.png` (confirmed by inspection: a harmless white rabbit whose face splits into the radial-toothed maw, plus a genuinely sweet death animation) *is* the Hollow Hare's art. Wire it through 1.6 end-to-end — it already has an encounter line written (`MICRO_BOSSES` in `story.js`) and is the natural first boss to prove the framework on. That leaves 7 other painted boss sheets (`ashwing`, `bellkeeper`, `gullet_king`, `hollow_regent`, `mirror_scholar`, `thorn_hart`, `vesper`) still unassigned — worth deciding later which of those (if any) become the four Court bosses (Vess/Korrath/Odalys/Herald) for Phase 6.
- [ ] **1.8 Extend guard-style animation to remaining regular enemies** — wolf, bandit, skeleton, zombie, gargoyle, plus the frostmarch/swamp types once *their* art lands. Lower priority than the above; content work once the pattern's proven, not a system gap.

---

## Phase 2 — World State Foundation
*Target: the game can remember something the player learned, surface it later, and let resolving it permanently change another system. Nothing in Phase 3+ is honest to build before this exists.*

- [ ] **2.1 `WorldState` shape** — a plain object separate from per-run `state`: `bossesDefeated`, `rumoursKnown`, `rumoursResolved`, `npcsRescued`, `shopsUnlocked`, `routesUnlocked`, `regionStates`, `cityChanges`, `majorStoryFlags` (`DESIGN.md` §26).
- [ ] **2.2 Event system** — a small `emit(type, payload)` / `on(type, handler)` pub-sub, no dependency needed. Event names from `DESIGN.md` §27 (`BOSS_DEFEATED`, `RUMOUR_HEARD`, etc.) as a starting vocabulary.
- [ ] **2.3 Rumour data shape + registry** — `id, sourceNPC, conditions, targetBiome, encounterID, persistence, state, prerequisites, consequences, dialogue`, plus the state machine (`LOCKED → AVAILABLE → HEARD → ACTIVE → …`).
- [ ] **2.4 Encounter data shape** — `id, biome, type, prerequisites, weight, forcedWhenActive, enemies, environmentModifiers, rewardTable, completionEffects`; a way for `levelgen.js` to reserve a slot for a forced encounter when a rumour is `ACTIVE` for that biome.
- [ ] **2.5 Versioned save system** — split `localStorage` into `PLAYER` / `WORLD` / `RUMOURS` / `CITY` / `STORY` / `SETTINGS`, with a version field and a migration stub, replacing the single best-distance number.
- [ ] **2.6 Prove it end-to-end with one real rumour** — before any pub UI exists, this can be tested through the existing message log / dialogue box: a rumour becomes known, persists across a death, and forces a specific encounter when its biome is entered.

---

## Phase 3 — City + Pub
*Target: returning home feels rewarding even without combat that session.*

- [ ] **3.1 City hub as a real screen/state** — replace "reach the gate → auto-load next level" with an actual return-to-city step between expeditions.
- [ ] **3.2 Pub tableau scene** — static illustrated interior, clickable NPC positions (fireplace, bar, tables, booths, etc.). **Art dependency**: nothing like this has been delivered yet — needs new art before this can be built for real, though we can block it out with placeholders first.
- [ ] **3.3 NPC framework** — `id, spawnConditions, spawnWeight, dialogueSets, rumours, services, relationshipState, worldStateRequirements`, plus a rotation each city visit.
- [ ] **3.4 Move Doran into the city** (open decision: keep a forge in-level too, or city-only?) and stub a second specialist — Bram (Armourer) already has a full unused art set (portrait + gestures + work sheet) sitting in the asset intake, ready to use for this.

---

## Phase 4 — First Complete Adventure Chain
*Target: the exact chain in `DESIGN.md` §32 Phase 4, built to a high polish bar, before content expands further.*

- [ ] **4.1 The swamp dragon (Mirewyrm)** as the first real rumour-boss, using Phase 1's boss framework + Phase 2's rumour system.
- [ ] **4.2 Material-based crafting at Doran's** — extend the forge past flat tier-upgrades to accept boss materials for distinct crafted results (a real choice, per `DESIGN.md` §18's mantle/boots/greatsword example).
- [ ] **4.3 The Hollow Hare** as the second boss — small-rabbit reveal, fast/erratic AI distinct from the dragon's.
- [ ] **4.4 Cross-boss progression** — make loot from one boss genuinely help against the other (the "I needed mobility, so I went and got it" loop from `DESIGN.md` §19), as an advantage, not a hard gate.
- [ ] **4.5 Playtest and tune the full chain** start to finish.

---

## Phase 5 — Buildcraft

- [ ] **5.1 Temporary run-upgrade shape** + a starting pool of ~6–10 real behavior-changing upgrades (`DESIGN.md` §15 examples as a starting list) — not flat % stat boosts.
- [ ] **5.2 Offer/choice UI** — e.g. after a boss kill or at a milestone, pick one of a few.
- [ ] **5.3 Status effects** (burn/poison/etc.), if not already partly introduced by Phase 1's weapon-identity work.
- [ ] **5.4 Curses** — drawback-for-power trades. Lower priority within this phase.

---

## Phase 6 — Campaign Structure

- [ ] **6.1 Wire Elara's story beats to real triggers** (city returns, boss kills) via the Phase 2 event system — `BOSS_ROSTER`'s `elaraLine` content already exists, just needs a caller.
- [ ] **6.2 The four Court bosses** (Vess, Korrath, Odalys, the Herald) as real fights, in sequence, using the Phase 1 boss framework.
- [ ] **6.3 Branching route choice** — a real crossroads decision point (frostmarch vs. swamp) instead of the current fixed biome loop.
- [ ] **6.4 Region consequence hooks** — clearing one area changes another's enemy table / unlocks a route, via the event system (`DESIGN.md` §11 necromancer/Drowned Prince examples).

---

## Phase 7 — Content Expansion
*Only once 1–6 are working systems. At this point, adding content should mostly mean feeding new data/assets into what already exists.*

- [ ] Wire remaining unused boss sheets as additional bosses.
- [ ] Staff weapon + a real spell-casting system, using the 14 unused spell-effect sheets already delivered.
- [ ] Full art for frostmarch and swamp biomes (currently on vector fallback).
- [ ] Additional rumours, mysteries, hidden bosses, merchants.
- [ ] Audio pass (`DESIGN.md` §31) — nothing exists yet; genuinely last, per the phase order.

---

## How to use this file

- Check an item off when it's shipped (committed, pushed, tested — not just started).
- If an item reveals a sub-step mid-work, add it under the same phase rather than letting it float.
- Don't start a later phase's items while an earlier phase still has open ✅-blocking items, unless we explicitly agree to jump ahead for a good reason (e.g. an art-dependency block).
- Re-run a real audit against `DESIGN.md` occasionally and refresh `GAP_ANALYSIS.md` — this file assumes that snapshot is still roughly accurate.
