# Wayfarer — Gap Analysis vs. DESIGN.md

> Living document. Compares the current codebase (branch `claude/game-ideas-brainstorm-b7dwic`) against `DESIGN.md`. Update this as systems get built — `DESIGN.md` itself shouldn't need to change often, this file should change constantly.
>
> Last verified: direct inspection of `src/core/game.js`, `entities.js`, `items.js`, `levelgen.js`, `story.js`, `render.js`, `main.js`, `index.html`, and the full asset intake (delivered-but-unprocessed art), 2026-09-22.

## TL;DR

What exists today is a genuinely solid **single-run action-platformer prototype**: seeded procedural levels, real combo-based melee combat, telegraphed enemies, a working sprite-animation pipeline, and an asset-fallback system that's made incremental art rollout safe. That maps to a partial **Phase 1 (Combat Foundation)**.

**Phases 2 through 7 do not exist yet** — no world state, no rumours, no city, no pub, no bosses-as-fights, no buildcraft, no branching. The entire game today is: pick a seed, run right through an endless loop of the same 5 biomes until you die, keep only your best-distance high score. That's it.

The encouraging part: a meaningful amount of the *art* for later phases is already sitting delivered-but-unused in the asset intake — 8 fully-animated boss sheets, 14 spell-effect sheets, a second NPC's complete art set, extra parallax layers. The gap is almost entirely **systems**, not art.

---

## Phase-by-phase status

### Phase 1 — Combat Foundation: ~60% there

| Item | Status | Detail |
|---|---|---|
| Responsive movement/attack | ✅ Done | Walk, jump/double-jump, attack all feel immediate |
| Multi-stage melee combo | ✅ Done | 4-hit chain + wave finisher on the 4th hit (`performPlayerAttack`, `game.js`) |
| Enemy telegraphs | ✅ Done | Windup + pulsing ring + "!" before every melee enemy attack (`ENEMY_WINDUP`, `drawWindupTelegraph`) |
| Hit feedback | ✅ Done | Hit-flash, floating damage numbers, screen shake, knockback both directions |
| Enemy animation | ⚠️ Partial | Only the castle guard has a real walk/attack sheet wired up (just built); every other enemy type (wolf, bandit, skeleton, zombie, gargoyle, and both frostmarch/swamp types) still uses a static pose + a fake vertical bob |
| Dodge / roll | ❌ Missing | No input binding exists at all (`main.js` KEY_MAP has left/right/jump/attack/interact only). A `dodge` animation *clip* already exists unused in `render.js` (`PLAYER_CLIPS.dodge`, `moods.png` frames 8–11) — the art's ready, there's just no mechanic driving it |
| Weapon identity | ❌ Missing | All 5 weapons (dagger/sword/axe/greatsword/bow) run through the exact same combo code and differ only in damage/range/cooldown numbers (`items.js` `WEAPON_CATALOG`). No staff/magic weapon exists at all, despite **14 unused spell-effect sheets** already delivered (arcane bolt, chain lightning, meteor, frost nova, etc.) |
| Enemy armor / crit hits | ❌ Missing | Enemies only have `hp` + `damage`, no defense stat, so "axe breaks armor" has nothing to break. `resolveDamage()` is flat `damage - defense + variance` — no crit chance/multiplier anywhere |
| Stagger | ❌ Missing | Enemies have a hitstun window (brief, on every hit) but no distinct stagger *state* or threshold |
| Status effects | ❌ Missing | No poison/burn/curse/any status system |
| Boss framework | ❌ Missing | Zero boss-encounter code exists. `BOSS_ROSTER` and `MICRO_BOSSES` in `story.js` are dialogue-only, with an explicit comment in the file admitting there's no system for them to hook into yet. **8 fully-painted boss sprite sheets already exist unprocessed** in the asset intake (move_attack + special_death pairs, same 4×4 convention as the player/guard sheets) — none are wired up. One is identified: **`clover_move_attack.png` / `clover_death_reaction.png` is the Hollow Hare** (confirmed by inspection — harmless white rabbit, face splits into the radial-toothed maw on the attack sheet, a sweet sparkle-particle death animation on the reaction sheet) |

### Phase 2 — World State Foundation: 0%

No `WorldState` object, no event system, no rumour framework, no encounter framework — none of it exists in any form.

The *only* persistence in the entire game is one `localStorage` number: `wayfarer-best-distance` (`main.js`). Every run calls `createGame(seed)` completely fresh — new player, fresh gear at tier 1, everything reset — and nothing else survives death or even a page reload.

### Phase 3 — City + Pub: 0%

`index.html` has no city or pub screen of any kind. The whole game is one continuous side-scrolling run through procedurally chained biomes; reaching a level's gate (`levelgen.js` `gateX`) immediately auto-loads the next level with no return-to-hub step at all — there is no "hub" to return to.

No pub/tavern art has been delivered (checked the full asset intake — `environments/` only contains castle parallax layers).

Exactly one NPC exists: Doran, at the forge. Worth knowing — his portrait art is a **repurposed asset**: the unprocessed source file is literally named `bram_portrait.png`. There's a full second NPC's art set (portrait + a gesture sheet + a work-animation sheet, an Armourer-type character per DESIGN.md §21) sitting completely unused because that portrait got relabeled as Doran instead of used for its own character.

### Phase 4 — First Complete Adventure Chain: not buildable yet

Depends entirely on Phases 2 and 3 existing first. There is no swamp dragon, no Mirewyrm, and no crafting-from-materials system of any kind — the forge only does flat tier-upgrades paid in gold + scrap (`items.js` `forgeCost`/`canAffordUpgrade`), never boss materials.

The Hollow Hare specifically: named, its "small harmless rabbit → reveals a horrifying mouth" reveal line is already written (`story.js` `MICRO_BOSSES`), and its art is identified (`clover_move_attack.png`/`clover_death_reaction.png` — see Phase 1 above) — but it isn't an enemy type in `entities.js`, has no AI, and `levelgen.js` never spawns it. Everything it needs exists except the system to run it.

### Phase 5 — Buildcraft: 0%

No temporary-upgrade system, no run modifiers, no equipment-synergy effects resembling the DESIGN.md examples (Bloodletter, Cinderstep, etc.). Equipment "progression" is purely `+tier`, which scales flat numbers only.

### Phase 6 — Campaign Structure: content written, not wired

Elara's frame story exists as a one-time opening screen (`INTRO_LINES`), and the Court (Vess/Korrath/Odalys/Herald) has full dialogue already written in `BOSS_ROSTER` for the moment each one falls — but none of it triggers from anywhere, because there's no boss framework (Phase 1 gap) and no city to deliver the `elaraLine` reaction in (Phase 3 gap). No branching exists; biome order is a fixed round-robin loop, not a player choice.

### Phase 7 — Content Expansion: premature to assess

This phase assumes 1–6 are working systems first. Worth flagging now regardless: there's a real head start sitting in the asset intake once those systems exist — 8 boss sheets, 14 spell-effect sheets, extra ranged-weapon art (throwing dagger, bomb), extra castle parallax layers, and Bram's full unused NPC art set.

---

## What's genuinely worth keeping/building on

- **Procedural level generation** — seeded, biome-rotating, tier-scaling, and (as of this session) free of the platform-overlap/ground-seam bugs that were making it read badly.
- **Combat feel** — the combo system, windup telegraphs, knockback, and hit feedback are a real foundation, not a placeholder. This is closer to "enjoyable in an empty test arena" (Phase 1's own stated target) than anything else in the game.
- **The sprite-sheet animation pipeline** (`animator.js` + per-clip config in `render.js`) — proven out on the player, and just now on the guard. This is the exact mechanism that will wire up the 8 unused boss sheets with no new engine work, only new `*_CLIPS` config entries.
- **The dialogue-box system** (built this session) — a real reusable UI primitive (speaker/portrait/lines, world-pausing while active) that Phase 3's pub NPCs and Phase 6's Elara/Court reactions will need directly.
- **The asset fallback system** — every sprite has a vector fallback, so new art can land incrementally without ever breaking the game. This same posture (build the system, let content fill in around it) is exactly what DESIGN.md §26 asks for architecturally — it's already the house style here, just not yet applied to world state.
- **The forge/economy loop** — shallow, but a real working version of "spend currency to get stronger" that Phase 4/5 can extend (add material-based recipes) rather than replace.

## The core architectural gap

`game.js` is already a clean, pure `update(state, input, dt)` function with plain-object state — no framework fighting needed there. But there is currently **no data-driven scaffolding above the single run**: no `Rumour`, `Encounter`, `Boss`, `NPC`, or `WorldState` shape exists anywhere in the codebase. Right now, the *only* pattern available for "make something persist" is the one-off `localStorage` best-distance number — which is itself exactly the kind of special case DESIGN.md §26 warns against generalizing from.

This is the real blocker for Phase 3/4 content: adding a rumour or a persistent city change today would have nowhere legitimate to live.

## Recommended next step

DESIGN.md §32 already prescribes the order, and Phase 1 is the closest to done — finishing it is the smallest remaining lift and unblocks nothing to skip it. Concretely, in roughly priority order:

1. **Dodge/roll input** + brief invulnerability window (art already exists, unused)
2. **Weapon identity** — give each weapon family at least one mechanical hook (not just numbers), starting with the ones already in `WEAPON_CATALOG`
3. **Enemy defense + a crit system** on the player side
4. **A minimal boss framework** — even just "an enemy with phases and a death hook" — and wire up *one* of the 8 already-painted boss sheets to prove it out end to end

Only after that does Phase 2 (world state / rumour / event framework) become the honest next step, since it's what everything from Phase 3 onward is actually built on top of.
