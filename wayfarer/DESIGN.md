# WAYFARER — Master Game Design & Development Directive

> This is the standing design reference for Wayfarer. It defines the game we're building toward and should govern how features get prioritized and implemented. See `GAP_ANALYSIS.md` in this same folder for a living comparison of the current codebase against this directive — that file gets updated as we build; this one should change rarely, and only when the vision itself changes.

---

## 1. THE GAME WE ARE MAKING

Wayfarer is a 2D fantasy action-adventure roguelite built around expeditions, rumours, deliberate preparation, memorable bosses, an evolving city and a world that reacts permanently to player actions.

The game should feel immediately understandable but gradually reveal surprising mechanical depth.

The core fantasy is not simply:

> Walk through levels, kill monsters, get stronger.

It is:

> Hear about something dangerous. Decide whether it is worth pursuing. Prepare for it. Travel into the world. Discover unexpected things along the way. Fight it. Survive or fail. Bring something meaningful home. Change the world. Use what you gained to pursue something you previously couldn't defeat.

The player should regularly create their own goals:

> "The Hollow Hare destroyed me. I need equipment that can deal with its speed."
>
> "A dragon hunter in the tavern said there's a dragon in the swamp."
>
> "If I kill that dragon, Doran might be able to make armour that lets me survive the Hare."
>
> "Okay. I'm going to the swamp."

That chain of player reasoning is the heart of Wayfarer.

---

## 2. PRIMARY DESIGN PRINCIPLE — STRUCTURED RANDOMNESS

Wayfarer should contain considerable randomness, but randomness must create possibilities, not undermine player agency.

The game may randomly determine:

- which travellers visit the pub
- which rumours become available
- ordinary enemy layouts
- minor encounters
- merchants
- environmental events
- available temporary upgrades
- treasure locations
- incidental NPC encounters

However, once the player discovers something important, it becomes persistent knowledge.

**Example:**

A Dragon Hunter randomly appears in the pub. He says:

> "Something huge has been circling the southern mire. I've hunted wyrms thirty years and I've never seen tracks like those."

This unlocks: **Rumour: Scales in the Mire**

The dragon encounter is now permanently available. The player does NOT have to immediately visit the swamp — they can pursue other objectives first. When they eventually choose the swamp route, the dragon encounter is guaranteed to occur. If the player dies fighting the dragon, the rumour is NOT consumed. The dragon remains there until defeated or deliberately resolved through another designed outcome.

Randomness creates discovery. Player decisions determine what happens next.

---

## 3. THE CORE GAME LOOP

The full game should revolve around:

**CITY → INFORMATION → PREPARATION → EXPEDITION → DISCOVERY → COMBAT → REWARD/FAILURE → WORLD CHANGE → CITY**

Every system should reinforce this loop. If a new feature cannot meaningfully connect to this loop, reconsider whether it belongs in the game.

---

## 4. THE CITY

The city is Wayfarer's persistent home and primary representation of progression. It must NOT merely be a collection of menus. The city should visibly change as the player's actions affect the world.

Initially it may be:

- partially abandoned
- damaged
- poorly defended
- short on traders
- lacking specialised craftsmen
- populated by nervous civilians and travellers

Over time:

- rescued NPCs arrive
- shops open
- buildings are repaired
- merchants begin using reopened trade routes
- decorations appear
- defeated monsters may leave trophies
- guards become better equipped
- refugees return
- new sections of the city become active
- dialogue reflects the player's actions

Avoid simply displaying `CITY LEVEL 4`. The player should be able to LOOK at the city and recognise their progress.

---

## 5. THE PUB

The pub should be a major gameplay system. It should NOT be a scrolling platforming environment.

Create it as a 2D illustrated flat-lay/tableau scene. The player sees the interior of a fantasy tavern containing various interactable positions: fireplace, bar, tables, dark corner, booths, doorway, possibly upstairs balcony or alcove.

A rotating selection of NPCs occupies these locations whenever the player returns. Some seats may be empty. Some NPCs are recurring. Others are rare. The player taps/clicks characters to interact.

Possible visitors include: dragon hunters, mercenaries, grave robbers, treasure hunters, travelling merchants, wounded soldiers, explorers, refugees, witches, scholars, adventurers, scouts, hunters, drunken civilians, storytellers, suspicious strangers, representatives of factions, completely useless but entertaining patrons.

**IMPORTANT:** Not every NPC must provide content. The pub must feel like a believable place rather than six glowing quest dispensers. Some patrons may simply tell stories, complain, joke, lie or be drunk. This makes genuinely important information feel discovered.

---

## 6. THE RUMOUR SYSTEM

Rumours are one of Wayfarer's defining mechanics. Internally each major rumour should support states such as:

`LOCKED → AVAILABLE → HEARD → ACTIVE → FAILED/UNRESOLVED → COMPLETED → TRANSFORMED`

Rumours can reveal: bosses, minibosses, rare monsters, hidden areas, treasure, NPCs needing rescue, unusual merchants, legendary materials, world events, shortcuts, Court members, strange environmental phenomena.

Rumours should vary in certainty. Some are explicit ("A dragon has been seen in the Mire.") Others are mysterious ("Lights have been moving beneath the frozen lake.") Others may be incomplete ("Something keeps taking livestock from the eastern farms.")

Do not always reveal: boss name, exact reward, exact location, encounter mechanics. Curiosity should motivate exploration.

---

## 7. RUMOUR CHAINS

Some rumours should begin multi-stage stories.

**Example:**

A traveller mentions lights beneath the Frostmarch ice → Player investigates → Finds a frozen corpse carrying an ancient object → Returns to town → A scholar recognises the object → New rumour unlocked: *The Sunken Vault* → Player returns to Frostmarch → A hidden area is now accessible → Boss encounter → Unique material recovered → Doran can forge new equipment.

A small tavern conversation can therefore create 20–40 minutes of meaningful gameplay.

---

## 8. RUMOURS MAY INTERACT

Whenever feasible, systems should combine rather than exist independently.

**Example:**

The player has discovered *Dragon in the Mire* and *Merchant Caravan Crossing the Mire*. If both are active when entering the swamp, the procedural encounter system may combine them: the player finds the dragon attacking the caravan.

Possible consequences — **Save merchants:** merchant later appears in city, additional trade options become available. **Fail to save them:** dragon may still be defeated, dragon loot still obtained, merchant does not arrive, another method may eventually reopen that trade opportunity.

These intersections produce emergent stories without requiring an enormous quantity of bespoke content.

---

## 9. EXPEDITIONS

Leaving the city should feel like committing to an expedition. The player should have reasons for choosing a route.

Potential motives: story objective, boss hunt, rumour, gathering materials, rescuing NPC, completing bounty, finding better equipment, unlocking a route, testing a new build, revenge against something that previously killed them, investigating a mystery.

Never reduce the world to a simple sequential level list.

---

## 10. ROUTE CHOICES

Biome progression should gradually become branching rather than strictly linear.

**Example:**

```
FOREST
  ↓
CROSSROADS
 ↙︎     ↘︎
FROSTMARCH  SWAMP
  ↓
future branches
```

Route selection should be influenced by information the player has gathered. The player may know Frostmarch has a Court general present, a mysterious lights rumour, rare ore — and Swamp has a dragon rumour, missing merchant, rare alchemy material. Now biome selection itself becomes gameplay.

---

## 11. THE WORLD MUST CHANGE

Killing bosses should produce persistent consequences. Bosses should not simply disappear and drop loot.

**Example:**

Kill a necromancer. Before: skeletons common, roads dangerous, graveyard inaccessible, civilians avoid region. After: undead significantly reduced, grave robbers appear, travellers return, merchants may use nearby roads, previously unsafe areas become accessible, another creature may occupy the ecological vacuum.

Solving one problem may reveal another.

**Example:**

Kill the Drowned Prince → Swamp waterways reopen → Civilian boats return → Trade improves → His presence had unknowingly kept a dragon away → Dragon sightings begin.

The player's actions should create history.

---

## 12. PLAYER PROGRESSION

Avoid a simple `Sword +1 → Sword +2 → Sword +3` model. Progression should create new possibilities and encourage different builds.

Three primary progression layers:

**A. TEMPORARY RUN POWER** — temporary upgrades, blessings, curses, run-specific synergies, consumables. Usually lost when an expedition ends or the player dies.

**B. EQUIPMENT** — persistent or semi-persistent equipment that changes HOW the player fights.

**C. WORLD PROGRESSION** — permanent: bosses defeated, rumours resolved, NPCs rescued, shops unlocked, routes changed, city developed, story progressed.

Death should hurt without making the previous hour meaningless.

---

## 13. EQUIPMENT MUST CHANGE GAMEPLAY

Weapons cannot simply be different damage values. Each weapon family should encourage a distinct combat style.

- **DAGGER** — extremely fast, short range, high mobility, critical-hit focused, attacks following dodges gain bonuses
- **SWORD** — balanced, reliable combo chain, defensive/parry potential, adaptable
- **GREAT SWORD** — slow, enormous impact, broad cleave, strong stagger, powerful final combo attack
- **AXE** — armour breaking, knockback, execution mechanics
- **BOW** — ranged positioning, charged shots, precision mechanics, specialised ammunition
- **STAFF** — magic-focused, spell interactions, mana/charge mechanics, elemental builds

A player finding a weapon should sometimes think "My build just changed." Not merely "The number is green."

---

## 14. COMBAT

Combat must develop beyond repeatedly pressing attack. Core systems should eventually include: movement, attack, multi-stage melee combos, dodge, enemy telegraphs, knockback, stagger, critical hits, ranged attacks, magic, status effects, meaningful weapon differences, enemy armour, positioning, terrain hazards.

Dodging should become particularly important. Boss encounters should reward recognising attack patterns rather than simply having sufficient HP.

A highly skilled player should theoretically be capable of defeating extremely difficult enemies with weak equipment. Better equipment should make success more achievable — not simply act as an artificial permission gate.

---

## 15. BUILDCRAFT

Temporary expedition upgrades should create genuine synergies.

**Examples:**

- **Moonlit Edge** — Fourth combo attack produces a larger projectile.
- **Bloodletter** — Critical hits restore a small amount of health.
- **Cinderstep** — Perfect dodges leave burning ground.
- **Executioner's Rhythm** — Kills reduce dodge cooldown.
- **Grave Pact** — Damage increases significantly below 50% health.
- **Stormcall** — Every sixth melee hit summons lightning.
- **Second Wind** — First lethal blow per biome leaves player at 1 HP.

Avoid excessive use of upgrades such as `+3% damage`, `+4% health`, `+2% movement speed`. Numerical improvements may exist, but the memorable upgrades should modify behaviour.

---

## 16. BOSS DESIGN

Bosses are milestones, stories and sources of distinctive materials. Each should have: recognisable silhouette, clear personality/theme, multiple attack patterns, readable telegraphs, escalating phases, unique arena considerations, meaningful reward, persistent effect on the world.

Bosses should fall broadly into categories:

- **STORY BOSSES** — Court members and major antagonists. Their deaths advance the central campaign and change the world.
- **RUMOUR BOSSES** — Optional creatures found through exploration and information (swamp dragon, Hollow Hare, ancient frost creature, hidden grave monster).
- **HIDDEN BOSSES** — Require unusual conditions, obscure clues or multi-stage rumours.

---

## 17. THE HOLLOW HARE

The Hollow Hare should become one of Wayfarer's signature encounters.

Initial presentation: a harmless white rabbit. Minimal threat cues. Potential humour. Then its face splits into the grotesque multi-pronged mouth. Boss fight begins.

It should be: extremely fast, aggressive, difficult to track, capable of sudden lunges, mechanically different from slow heavy bosses.

It may become a recurring nemesis rather than necessarily dying permanently on first encounter. Later variants can become progressively more monstrous. Potential ultimate form: **THE HOLLOW HARE, DEVOURER OF KNIGHTS**.

Its loot should encourage fast/aggressive gameplay.

**Example: HAREFANG** (Legendary dagger)
- **Predator's Instinct** — Dodging through an enemy causes the next attack to critically strike.
- **Blood Scent** — Kills briefly increase movement speed.
- **Fourfold Bite** — Every fourth critical strike emits multiple slashes.

---

## 18. THE SWAMP DRAGON

The dragon should exemplify the rumour → preparation → boss → crafting loop.

A Dragon Hunter visiting the pub can unlock the rumour. The player may leave it unresolved indefinitely. When they eventually enter the swamp: burned vegetation appears, corpses or destroyed enemies indicate something large, footprints/claw marks foreshadow it, normal creatures may flee, Doran or another character may comment.

Boss: **THE MIREWYRM** (or another final name). Killing it provides distinctive materials rather than merely random armour — e.g. **Mirewyrm Heart**, **Mirewyrm Scales**, **Dragonbone**.

Back in town, Doran can transform these into different rewards — e.g. a choice between **Dragonhide Mantle** (defensive build), **Cinderstep Boots** (mobility/dodge build), **Dragonbone Greatsword** (heavy offensive build). That decision should matter.

---

## 19. PROGRESSION THROUGH PROBLEMS

Wayfarer's strongest progression should often look like:

Player wants to kill Boss A → Boss A exploits player's current weakness → Player learns about Boss B → Boss B drops material that can address that weakness → Player chooses to hunt Boss B → Crafts new equipment → Returns to Boss A.

This creates stories naturally.

**Example:** Hollow Hare repeatedly kills player → Player decides they need mobility/defence → Dragon rumour discovered → Player hunts swamp dragon → Crafts Cinderstep Boots → Returns to Hollow Hare → Player finally wins.

**Important:** This should provide an advantage, NOT create a hard requirement. Alternative solutions should remain possible.

---

## 20. DORAN EMBERFIST

Doran should become an important recurring character. He is not merely a shop interface. His role includes: weapon crafting, boss material processing, reforging, explaining unusual materials, occasional rumours, commentary on regions and enemies, humorous observations, reacting to major player achievements.

Doran should feel like someone the player develops familiarity with. His dialogue should change as the world changes.

---

## 21. CITY SPECIALISTS

Do not give every function to one NPC. Possible specialists:

- **DORAN — WEAPONSMITH** — weapons, reforging, boss crafting
- **ARMOURER** — defence, armour abilities, resistances
- **ALCHEMIST** — potions, consumables, temporary expedition preparations
- **CURIO DEALER** — cursed equipment, strange artefacts, rare effects
- **CARTOGRAPHER** — improves route knowledge and expedition information
- **TAVERN KEEPER** — central rumour ecosystem
- **SCHOLAR** — identifies relics and enables mystery chains

These characters may initially be missing. Players can discover/rescue/recruit them through expeditions. Unlocking a person should physically change the city.

---

## 22. FAILURE

Death should create tension but not erase narrative progress. Generally retain: rumours, defeated bosses, story progress, rescued NPCs, city development, major discoveries. Potentially lose: temporary run upgrades, some carried currency, consumables, expedition-specific resources.

Boss rumours should generally remain active after death. The emotional reaction should be "I failed that expedition," not "The last hour didn't matter."

---

## 23. CONTENT TARGET

Wayfarer's initial complete campaign should provide approximately **4–6 hours** for a player's first meaningful campaign completion, with considerably more gameplay available to players seeking: optional bosses, rare rumours, legendary equipment, hidden areas, alternative builds, unresolved mysteries.

Do NOT artificially extend playtime with grind. Hours should come from decisions, discovery, mastery, experimentation, exploration, consequences, replayability.

---

## 24. TONE

The visual and narrative tone should remain: **beautiful fantasy + dangerous grotesque creatures + slightly absurd/humorous people and situations.** Avoid generic grimdark fantasy. Allow sincere dramatic moments without making the entire world miserable.

Doran can be funny. Tavern patrons can be ridiculous. A tiny rabbit can unfold into an abomination. A terrifying dragon can have somehow become notorious because it keeps stealing goats. The contrast gives Wayfarer identity.

---

## 25. DO NOT TURN THE GAME INTO A CHECKLIST

Avoid overusing: map markers, quest arrows, giant objective logs, completion percentages, collectible counters, explicit boss locations, excessive tutorial popups.

Prefer environmental storytelling and NPC knowledge. Instead of `SWAMP DRAGON — 0/1`, give the player: "The hunter at the Red Lantern said something enormous has been circling the Mire."

Players should feel like adventurers following information, not employees clearing tickets.

---

## 26. TECHNICAL DEVELOPMENT PHILOSOPHY

**THIS IS CRITICAL.**

Do not implement these features as isolated hard-coded exceptions. Before expanding the game substantially, inspect the existing architecture and create reusable systems capable of supporting future content.

Prefer DATA-DRIVEN systems.

Do not hard-code: `IF player talked to DragonHunter AND biome == swamp THEN spawn dragon.`

Instead create generic structures such as:

**Rumour** — id, sourceNPC, conditions, targetBiome, encounterID, persistence, state, prerequisites, consequences, dialogue

**Encounter** — id, biome, type, prerequisites, weight, forcedWhenActive, enemies, environmentModifiers, rewardTable, completionEffects

**Boss** — id, phases, attacks, drops, worldStateChanges, dialogueTriggers, unlocks

**NPC** — id, spawnConditions, spawnWeight, dialogueSets, rumours, services, relationshipState, worldStateRequirements

**WorldState** — tracks things such as: bossesDefeated, rumoursKnown, rumoursResolved, NPCsRescued, shopsUnlocked, routesUnlocked, regionStates, cityChanges, majorStoryFlags

Build systems once. Feed content into them afterwards.

---

## 27. EVENT-DRIVEN WORLD

Where practical, create a lightweight event system.

Examples: `BOSS_DEFEATED`, `RUMOUR_HEARD`, `NPC_RESCUED`, `REGION_CLEARED`, `CITY_RETURNED`, `ITEM_CRAFTED`, `EXPEDITION_FAILED`, `EXPEDITION_COMPLETED`.

Other systems can respond to those events.

**Example:** `BOSS_DEFEATED: drowned_prince` may trigger: swamp enemy table change, merchant spawn possibility, pub dialogue update, city decoration, dragon rumour eligibility, Elara conversation.

This avoids tightly coupling every feature to every other feature.

---

## 28. SAVE SYSTEM

Persistent progression should be saved cleanly and versioned. The save structure should clearly separate:

- **PLAYER** — equipment, currencies, unlocks
- **WORLD** — boss deaths, region states, NPCs rescued
- **RUMOURS** — known, active, completed
- **CITY** — unlocked inhabitants/services/visual upgrades
- **STORY** — major campaign progression
- **SETTINGS** — controls/audio/preferences

Plan for future save migrations so new content does not destroy existing saves.

---

## 29. PROCEDURAL GENERATION PHILOSOPHY

Procedural generation should support authored experiences, not replace them. Ordinary sections may be procedural. Important encounters should be authored.

The game should be able to reserve sections of a generated biome for: bosses, rumour encounters, NPC rescues, special landmarks, merchants, story encounters. This produces variety without destroying pacing.

---

## 30. ENVIRONMENTAL IDENTITY

Each biome needs gameplay rules beyond artwork.

- **FOREST** — vertical movement, wolves, ambushes, hidden paths
- **GRAVEYARD** — undead resurrection, ghosts, tombstones affecting movement/projectiles
- **CASTLE** — armoured enemies, ranged units, traps, formations
- **FROSTMARCH** — ice movement, visibility changes, falling hazards, cold-themed enemies
- **SWAMP** — slow water, poison, hidden enemies, environmental decay

Entering a different biome should require a slight change in how the player thinks.

---

## 31. AUDIO

Audio is a major future polish priority. Eventually include: weapon impacts, enemy hit sounds, enemy telegraph cues, boss stingers, dodge feedback, loot feedback, ambience, biome music, city music, tavern ambience, boss phase changes.

Sound should improve mechanical readability, not only atmosphere.

---

## 32. IMPLEMENTATION ORDER

Do NOT attempt to add everything simultaneously. Build the foundations first.

**PHASE 1 — COMBAT FOUNDATION**
Improve: dodge, responsive attacks, enemy telegraphs, weapon identities, hit feedback, boss framework.
*Target: Combat must be enjoyable even in an empty test arena.*

**PHASE 2 — WORLD STATE FOUNDATION**
Build: persistent world state, event system, rumour framework, encounter framework, clean save structure.
*Target: The game can remember that the player learned something, deliberately surface it later, resolve it and permanently modify another system.*

**PHASE 3 — CITY + PUB**
Build: city navigation, static illustrated tavern, rotating patrons, dialogue, persistent rumours, basic merchants, Doran integration.
*Target: Returning home should feel rewarding even without combat.*

**PHASE 4 — FIRST COMPLETE ADVENTURE CHAIN**
Use existing content to create ONE excellent vertical slice.

Suggested chain: Forest expedition → City → Dragon Hunter appears → Dragon rumour acquired → Swamp chosen → Dragon foreshadowing → Mirewyrm boss → Boss material recovered → Return to city → Doran offers meaningful crafting choice → Player equips item → Hollow Hare rumour/encounter → Hare boss → Unique reward → Visible city/world reaction.

Build this chain to a very high standard before massively expanding content.

**PHASE 5 — BUILDCRAFT**
Add: temporary upgrades, meaningful weapon synergies, status effects, curses, more boss materials, equipment interactions.

**PHASE 6 — CAMPAIGN STRUCTURE**
Introduce: Elara's central story, Aldric's Court, branching targets, region consequences, multiple possible objective orders.

**PHASE 7 — CONTENT EXPANSION**
Only after the systems work well: additional rumours, bosses, NPCs, rare encounters, areas, weapons, spells, merchants, mysteries.

At this stage adding content should mostly mean supplying new data/assets to established systems rather than rewriting the engine.

---

## 33. DEVELOPMENT RULE

Before implementing any new feature, ask: **Does an existing system support this?**

- If yes: extend its data/content.
- If no: ask whether this feature represents a reusable category.
  - If reusable: build the underlying system first.
  - If truly unique: implement the smallest justified exception.

Do NOT continually add one-off logic.

---

## 34. FEATURE ACCEPTANCE TEST

A new mechanic should ideally accomplish at least one of the following:

- changes how the player fights
- creates a meaningful decision
- changes the world
- creates information the player can act upon
- gives the player a new objective
- enables a new build
- creates an unexpected story
- provides meaningful preparation
- makes returning to the city interesting
- makes an existing biome play differently

If it merely adds another number, enemy reskin, decoration or collectible, challenge whether it deserves development time.

---

## 35. THE TARGET PLAYER EXPERIENCE

Wayfarer succeeds when a player says something like:

> "I went into the swamp because some bloke at the pub told me there was a dragon there. It absolutely destroyed me, so I upgraded my greatsword and went back. I killed it and used its scales to make these boots that leave fire when I dodge. Then I realised those boots were perfect for fighting this horrifying rabbit I'd found earlier, so I went back to the forest and finally killed the bastard. And now because I killed the dragon, merchants have started using the swamp route and there's a new trader in my city."

That single story contains: information, choice, failure, preparation, mastery, boss progression, crafting, buildcraft, player-created objectives, persistent world change, city development.

That is Wayfarer. Protect that experience above everything else.

---

## 36. INSTRUCTION TO THE DEVELOPMENT AI

When modifying Wayfarer:

1. First inspect the existing codebase and understand the current systems before editing.
2. Preserve working visual assets and mechanics unless changes are required.
3. Do not solve architectural problems through repeated hard-coded special cases.
4. Prefer reusable, data-driven systems.
5. Keep gameplay state separated from rendering wherever reasonably possible.
6. Keep persistent world state separate from temporary expedition state.
7. Build features in small testable stages.
8. Verify existing systems after each structural change.
9. Avoid adding large quantities of content before its supporting mechanics are enjoyable.
10. When requested to implement a feature, consider how it interacts with the entire Wayfarer loop rather than treating it as an isolated task.
11. If implementation would create technical debt that makes the broader design harder to achieve, address the architecture first.
12. Preserve mobile compatibility and existing desktop controls.
13. Keep performance appropriate for a browser-based game.
14. Never sacrifice combat responsiveness for visual complexity.
15. Treat the systems described in this document as interconnected parts of one game, not a backlog of independent features.

The objective is not to make Wayfarer contain many features. The objective is to make every feature create reasons to engage with the others.
