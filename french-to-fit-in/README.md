# French to Fit In™

**The 30-Day French Integration System.**

A functional-spoken-French training prototype for adult beginners. It is
deliberately **not** a grammar course, a phrasebook, a vocabulary game, or a
fluency-in-30-days promise. Its one objective:

> Build enough control over a deliberately small amount of French that the
> learner can remain inside a real interaction rather than immediately
> reverting to English.

This is a research pilot / prototype. The 30-day curriculum *shell* (day
numbers, titles, ordering) is locked and final. The actual lesson content is
**not** -- only Day 1 is populated, as a demonstration, and every piece of
content in this repository is explicitly marked `DRAFT`. See
[Product philosophy](#product-philosophy) and
[How curriculum locking works](#how-curriculum-locking-works) below.

---

## Table of contents

- [Product philosophy](#product-philosophy)
- [Architecture](#architecture)
- [How curriculum locking works](#how-curriculum-locking-works)
- [How to add approved lesson content](#how-to-add-approved-lesson-content)
- [How to add vocabulary](#how-to-add-vocabulary)
- [How retrieval scheduling works](#how-retrieval-scheduling-works)
- [How mastery status works](#how-mastery-status-works)
- [How field tests work](#how-field-tests-work)
- [How gamification works](#how-gamification-works)
- [How the avatar system works](#how-the-avatar-system-works)
- [How first-run onboarding works](#how-first-run-onboarding-works)
- [Running locally](#running-locally)
- [Installing as a PWA](#installing-as-a-pwa)
- [Running tests](#running-tests)
- [Exporting pilot data](#exporting-pilot-data)
- [Connecting a future AI provider safely](#connecting-a-future-ai-provider-safely)

---

## Product philosophy

The desired Day-30 transformation is from *"I know some French"* to
*"I can do things in French."* Every design decision follows from that:

- **A small, tightly-budgeted vocabulary**, spent deliberately rather than
  expanded for exercise variety. Every word is tagged `ENGINE`
  (generative verbs/structures), `INTERACTION` (words that control or
  sustain a conversation), or `DOMAIN` (specific nouns needed for one
  day's capability) -- see [How to add vocabulary](#how-to-add-vocabulary).
- **Retrieval before teaching.** Every normal session opens with a short,
  silent retrieval gate on *already-introduced* material -- never today's
  new content -- before anything new is taught.
- **Meaning over grammar.** A response that preserves meaning but has
  imperfect form is `FUNCTIONAL` and usually advances the learner. Grammar
  accuracy only matters when it changes meaning, blocks comprehension, or
  blocks the interaction goal.
- **Reward staying in the interaction**, not producing a perfect sentence.

> **Note on gamification.** The original design brief for this prototype
> explicitly avoided gamification (no streaks, no XP, no mascots). At the
> product owner's explicit request, that call was reversed: the app now has
> a full XP/level/streak/badge engagement layer with celebratory animations
> (see [How gamification works](#how-gamification-works)). The rest of the
> visual language -- palette, typography, layout -- stays editorial and
> restrained; the gamification layer sits on top of it rather than
> replacing it with cartoon chrome.

## Architecture

```
src/
  app/            Routes/pages (HomePage, SessionPage, CourseMapPage, ...),
                  small page-level hooks (useAppMeta, useWorkingKnowledge)
  components/     Presentational UI (Button, Card, Pill, AnswerInput, ...)
  features/
    lesson/       Session orchestration hook (useLessonSession), the
                  exercise/teaching screens, dayExercises grouping
    retrieval/    Retrieval-gate + diagnosis screens
    remediation/  Targeted remediation screen
    fieldTest/    Field-test orchestration hook
    ledger/       Ledger write-path service (ledgerService) -- this is the
                  ONLY place the rest of the app should touch the ledger
    pilot/        Pilot-mode analytics aggregation
  content/        LOCKED curriculum shell + editable content records
                  (curriculum.ts, vocabulary.ts, engines.ts, fieldTests.ts)
  engine/         Pure, content-agnostic logic: curriculumGuard,
                  retrievalScheduler, mastery (automaticity model),
                  scoring (deterministic response evaluator), sessionMachine
                  (the 9-phase session state machine), fieldTestScoring
  providers/
    ai/           AIProvider interface + mock implementation + the schema/
                  curriculum-guard validation wrapper every provider goes
                  through (guardedProvider.ts)
    audio/        AudioProvider interface + browser SpeechSynthesis impl
  storage/        IndexedDB access (via `idb`) -- one file per object store,
                  plus exportImport.ts for full-state JSON portability
  types/          Shared TypeScript types
  test/           Vitest fixtures + setup (fake-indexeddb, jest-dom)
```

Content (what the curriculum says) and application mechanics (how a
session runs) are deliberately separate: nothing in `engine/`, `features/`,
or `app/` hardcodes French content -- it all flows through `content/`.

### The session state machine

Every normal session follows this fixed sequence
(`engine/sessionMachine.ts`):

```
RETRIEVAL_GATE -> SCORE_DIAGNOSE -> REMEDIATION (optional)
  -> NEW_CAPABILITY_TEACHING -> CONTROLLED_MANIPULATION -> APPLICATION
  -> PRESSURE_TRANSFER -> LEDGER_UPDATE -> SESSION_COMPLETE
```

`REMEDIATION` is skipped entirely when nothing failed. Exercises are
grouped into `CONTROLLED_MANIPULATION` / `APPLICATION` / `PRESSURE_TRANSFER`
by their pressure-gradient `level` (1-2 / 3 / 4-5) -- see
`features/lesson/dayExercises.ts`.

## How curriculum locking works

`content/curriculum.ts` defines all 30 days as data (`DayDefinition[]`),
using the exact locked titles, day numbers, and week grouping from the
product brief -- proven by `content/curriculum.test.ts`
(`curriculum order (locked)`), which fails if a day is added, removed,
reordered, or retitled.

Every vocabulary and engine item declares the day it's first allowed:
`VocabularyItem.firstAllowedDay` / `EngineItem.introducedDay`. The
**curriculum guard** (`engine/curriculumGuard.ts`) is the single choke
point that enforces this:

- `checkItemsAllowed(dayNumber, itemIds)` -- pure, returns violations.
- `assertContentAllowed(dayNumber, itemIds)` -- **throws** in dev mode on
  any violation (fail loud while authoring); in production it swallows the
  violation, logs it, and appends to an in-memory violation log instead of
  rendering the offending item.
- `assertDayContentAllowed(day)` -- validates an entire `DayDefinition`:
  every lesson-block, retrieval-pool, and exercise reference must resolve
  to material introduced on or before that day, and anything the day
  declares as "new" must actually be first-allowed on that exact day (no
  forward-declaring another day's material, and no smuggling in a
  mismatched day number).

AI provider output goes through the same guard (see
[Connecting a future AI provider safely](#connecting-a-future-ai-provider-safely)),
so a misbehaving or hallucinating provider can never leak future material
into a session either.

`content/curriculum.test.ts` and `engine/curriculumGuard.test.ts` prove
all of this, including that every authored day currently passes the guard
against itself and that a deliberately tampered day is rejected.

## How to add approved lesson content

Only Day 1 (`content/curriculum.ts`, the `DAY_1` constant) has real
content; every other day is a `shellDay(...)` placeholder with empty
`lessonBlocks` / `applicationMissions` and `status: 'DRAFT'`. To flesh out
a day:

1. Add any new vocabulary/engine items it needs to `content/vocabulary.ts`
   / `content/engines.ts` first (see below) -- with `firstAllowedDay` /
   `introducedDay` set to that day's number.
2. Fill in the day's `newEngines` / `newVocabulary` (must match what you
   just added), `lessonBlocks` (one cognitive chunk each -- `EXPLANATION`,
   `SOUND_ANCHOR`, `MODEL_SENTENCE`, or `CONTROLLED_MANIPULATION`), and
   `applicationMissions` (each holding an ordered list of
   `ExerciseDefinition`s across pressure levels 1-5).
3. Run `npm test` -- `curriculumGuard.test.ts`'s guard checks and
   `curriculum.test.ts`'s order checks will catch most authoring mistakes
   (referencing an item before its allowed day, mismatched day numbers,
   etc).
4. Only flip `status` to `'APPROVED'` once a curriculum author has signed
   off -- the UI and this README both treat `DRAFT` as "not yet
   canonical," and nothing in this codebase should present Claude-invented
   content as final curriculum.

Remediation content is not authored separately: remediation always reuses
the same retrieval-gate prompt for the failing item (see
`features/remediation/RemediationScreen.tsx`) rather than replaying a
whole day.

## How to add vocabulary

Add an entry to `VOCABULARY` in `content/vocabulary.ts` (or `ENGINES` in
`content/engines.ts` for generative structures):

```ts
{
  id: 'vocab.some-new-word',
  canonicalFrench: '...',
  englishMeaning: '...',
  category: 'ENGINE' | 'INTERACTION' | 'DOMAIN',
  firstAllowedDay: 12,       // the day it becomes usable, enforced by the guard
  purpose: '...',            // required, auditable: why this item exists
  status: 'DRAFT',
}
```

Keep the budget tight -- don't add nouns just to make an exercise feel
more varied (see project brief "VOCABULARY BUDGET"). Every item's
`purpose` field exists so a reviewer can audit *why* it's there.

## How retrieval scheduling works

`engine/retrievalScheduler.ts` selects 3-5 items (`RETRIEVAL_GATE_MIN_SIZE`
/ `RETRIEVAL_GATE_MAX_SIZE`) for each session's opening gate, in priority
order:

1. **Failed retrieval** -- the learner's last attempt at this item failed
   (detected via `lastSeen !== lastRetrieved`, i.e. the most recent touch
   didn't count as a success).
2. **Weakly retrieved** -- `automaticityScore < 0.6`.
3. **Due material** -- `nextDueAt` has passed, item not yet `AUTOMATIC`.
4. **Automatic maintenance** -- `AUTOMATIC` items whose `nextDueAt` has
   passed (occasional upkeep, not urgent).

Only items with `status !== 'LOCKED'` are ever eligible -- the gate can
never draw on material the learner hasn't met yet. Spacing
(`computeNextDueAt`) approximates "next session / 2-3 sessions later /
~1 week later" using each item's accumulated successful-retrieval count,
then "occasional maintenance" (~14 days) once `AUTOMATIC`. A failed or
skipped ("?") attempt is due again immediately.

## How mastery status works

`engine/mastery.ts` implements a deliberately simple, deterministic
automaticity model -- **not** a claim of scientifically measuring fluency.
Every retrieval outcome nudges a 0-1 `automaticityScore` via a fixed-rate
exponential moving average (`ACCURATE` pulls toward 1, `FAILED_RETRIEVAL`/
`SKIPPED` pulls toward 0, `MEANING_PRESERVED_IMPERFECT` and
`PARTIALLY_RETRIEVED` sit in between); a success in a materially different
context (`isNewContext: true`) adds a small reuse bonus.

Ledger `status` (`LOCKED` / `INTRODUCED` / `RETRIEVED` / `REUSED` /
`AUTOMATIC`) is recomputed from scratch on every update:
`AUTOMATIC` requires both a high score (`>= 0.85`) **and** at least 3
successful retrievals -- so it can be *lost* again if the score later
decays from repeated failures (this is intentional: "a course day
completing does not automatically make its material AUTOMATIC," and
automaticity earned once isn't permanent). The UI never shows the raw
score or status directly; it maps to one of four bands via
`automaticityBand()`: **Introduced / Building / Reliable / Automatic**.

## How field tests work

Field tests (`content/fieldTests.ts`, one per week boundary: Day 7, 14,
21, 30) are scenario missions, not quizzes. `engine/fieldTestScoring.ts`
scores four dimensions, each 0-3 (0 unable, 1 heavily supported, 2
functional, 3 independent):

- **RETRIEVAL** -- did the response draw on the step's target material?
- **CONTROL** -- did the learner stay in French (no English fallback
  words detected)?
- **REPAIR** -- for steps whose objective calls for it, did the learner
  use a repair phrase (`excusez-moi`, `pardon`, ...) rather than stalling?
- **TRANSFER** -- did the learner produce a fuller utterance, not just a
  single memorised fragment?

These are heuristic proxies, not a linguistic assessment -- deliberately
simple and auditable rather than a black box. A field test never
auto-passes: `isProgressionJustified()` requires every dimension to score
above 0 and the average to be at least 1.5. Results are stored
(`storage/fieldTestStore.ts`) and surfaced with "what worked / what broke
/ what needs retrieval / whether progression is justified," per the
product brief -- never a bare pass/fail.

Only the Week 1 field test currently has an authored scenario step; the
others are `DRAFT` shells (`content/fieldTests.ts`), same as the day
content.

## How gamification works

`engine/gamification.ts` holds the deterministic XP/level/streak math
(same spirit as `engine/mastery.ts` -- an auditable formula, not a black
box); `content/badges.ts` lists the badge definitions; and
`features/gamification/gamificationService.ts` is the single write path
that touches XP, level, streak, and badge state (mirrors
`features/ledger/ledgerService.ts`).

- **XP** is awarded per answer (`engine/gamification.ts`'s
  `XP_BY_CLASSIFICATION`: CORRECT > FUNCTIONAL > PARTIAL > FAILED=0) plus a
  flat completion bonus per session, and a score-weighted amount per field
  test. The learner sees a small `+N XP` flash immediately
  (`components/XPPopup.tsx`) and the session/field-test result screens
  total it up.
- **Levels** use triangular XP thresholds (`xpRequiredForLevel`) -- each
  level costs a bit more than the last. `components/XPBar.tsx` shows the
  current level and progress toward the next one.
- **Streaks** track consecutive calendar days with at least one completed
  session or field test (`updateStreak`): the same day doesn't inflate it,
  the very next calendar day extends it, and a gap resets it to 1 while
  keeping the longest-streak record. Shown via `components/StreakFlame.tsx`.
- **Badges** (`content/badges.ts`) unlock on milestones -- first session,
  streak lengths, Week 1 completion, automaticity counts, a justified field
  test, and level thresholds -- computed in
  `gamificationService.ts`'s `applyGamification`. All badges (earned and
  locked) are visible on `/achievements`
  (`app/pages/AchievementsPage.tsx`), so what's coming next is never
  hidden.
- **Celebration**: `components/Confetti.tsx` fires a CSS-based confetti
  burst on a level-up or a new badge (not on every session, so it stays a
  real moment rather than background noise), and respects
  `prefers-reduced-motion` by skipping the animation entirely.

This entire layer was added at the product owner's explicit request,
reversing the original brief's "no gamification" stance -- see the note in
[Product philosophy](#product-philosophy).

## How the avatar system works

`/avatar` (linked from the avatar/level badge in `components/ProgressHUD.tsx`)
lets the learner build a profile avatar -- entirely parametric SVG, no image
assets -- and set a display name. State lives in `AppMeta.avatarConfig` /
`AppMeta.displayName` (`storage/schema.ts`), backfilled for existing
databases the same way the gamification fields were.

`types/avatar.ts` defines a discriminated union: `HumanAvatarConfig` (skin
tone, hair style/color, eye shape/color, mouth, headwear, glasses, facial
hair, freckles) or `AnimalAvatarConfig` (species + fur color + glasses) --
picking "Animal" isn't a reskin, it's a real alternative to a human likeness.
`content/avatarOptions.ts` holds the actual option data;
`components/avatar/svgParts/{humanParts,animalParts}.tsx` render each part as
SVG primitives (hair/headwear are drawn behind and larger than the face
shape, so the correct silhouette falls out of z-order alone, no clip-paths);
`components/avatar/AvatarSvg.tsx` composes a config into one `<svg>`;
`components/avatar/AvatarPicker.tsx` is the picker UI (live preview,
"Surprise me" random button via `engine/avatar.ts`, and swatch/chip grids per
option).

The art style is a bold, hand-drawn-cartoon look, not a flat generated icon:
every silhouette in `svgParts/style.tsx`'s shared helpers gets a thick ink
outline (`OUTLINE`/`OUTLINE_WIDTH`/`OUTLINE_THIN`) and a flat cel-shading
shape (one darker solid tone, via `darken()`, not a gradient) suggesting
form, plus oversized eyes with a clear white sclera ring and a catchlight.
`inkStroke()` gives linework (eyebrows, mouths, whiskers) its own outline by
stacking a wider dark stroke behind the colored one. This is a deliberate
style choice inspired by bold animated-show illustration -- thick lines,
graphic shading, expressive proportions -- not a reproduction of any
particular show or character.

Inclusivity was a deliberate design constraint, not an afterthought:

- **10 skin tones**, not a token handful.
- **12 hair styles** spanning straight, wavy, curly, coily, and braided
  textures, plus a headscarf as its own headwear option.
- **3 eye shapes** including monolid, which off-the-shelf avatar kits
  routinely omit.
- **Facial hair is not gender-locked** to either avatar path -- it's a free
  toggle independent of every other choice.
- **6 animal species** (fox, deer, owl, rabbit, bear, cat) for anyone who'd
  rather not pick a human likeness at all.

## How first-run onboarding works

`App.tsx` checks `AppMeta.onboardingCompleted` on load; while it's `false`,
`app/pages/OnboardingPage.tsx` renders full-screen in place of the entire
routed app (no header, no nav) -- there's nothing to skip to. It's a short
wizard: welcome/philosophy blurb -> optional display name -> the avatar
picker -> narrator voice choice (with a live preview) -> a ready screen
showing the finished avatar. "Start Day 1" persists
`onboardingCompleted: true` and hands control back to the normal router,
landing wherever the browser's current URL already pointed (normally `/`).
Every field it sets (`displayName`, `avatarConfig`, `voicePersona`) is the
same `AppMeta` state `/settings` and `/avatar` edit later, via the same
`useAppMeta` hook -- onboarding doesn't own separate state, it's just the
first place those settings get a value.

## Running locally

Requires Node 20+.

```bash
npm install
npm run dev       # http://localhost:5173
```

No backend is required -- everything (including the mock AI evaluator)
runs client-side against IndexedDB.

## Installing as a PWA

`npm run build && npm run preview`, then open the preview URL. On a
supported browser/OS, an install prompt (or "Add to Home Screen" on
iOS/Android Safari/Chrome) will register the app as a standalone PWA using
the manifest/service-worker generated by `vite-plugin-pwa`
(`vite.config.ts`). The service worker precaches the app shell so it works
after the first load without a network connection; nothing about the
learning data itself depends on the network (see storage, below).

## Running tests

```bash
npm test          # one-shot (vitest run)
npm run test:watch
```

Covers: curriculum order/locking, vocabulary/engine gating, forbidden
future-content rejection (including through the AI-provider guard),
retrieval scheduling (priority order, spacing, gate size), automaticity
transitions (including losing `AUTOMATIC` status), field-test scoring, and
IndexedDB persistence (seeding, CRUD, export/import round-trip) using
`fake-indexeddb`. Fixtures for a strong learner, a weak learner, a learner
with one isolated knowledge gap, and a learner returning after a 7-day gap
live in `src/test/fixtures.ts`.

## Exporting pilot data

**Pilot Mode** (Settings -> "Enable Pilot Mode") captures session
start/end, every answer attempt, retrieval success/failure, response
latency, remediation events, field-test scores, and automaticity
gain/loss events -- all to local IndexedDB only (`storage/pilotStore.ts`).
Nothing is ever sent externally.

The **Pilot Dashboard** (`/pilot`) surfaces retrieval success by day, weak
vocabulary/engines, average response latency, remediation frequency,
field-test scores, and session drop-off points
(`features/pilot/pilotAnalytics.ts`), with one-click CSV and JSON export.

Independently, **Settings -> Learner Data** can export/import a learner's
*entire* state (ledger, sessions, pilot events, field-test results) as a
single JSON file (`storage/exportImport.ts`) -- useful for moving between
devices or archiving a pilot run.

## Connecting a future AI provider safely

`providers/ai/index.ts` exports a single `aiProvider: AIProvider`. Today
it's `MockAIProvider` (`providers/ai/mockProvider.ts`) wrapped in
`createGuardedAIProvider()` -- fully deterministic, so the app works
offline and without an API key.

To add a real provider:

1. Implement `AIProvider` (`types/ai.ts`) in a new
   `providers/ai/<yourProvider>.ts`. The network call inside it must go to
   **your own backend endpoint**, which holds the API key server-side --
   never call a third-party LLM API directly from client code.
2. Wrap it with `createGuardedAIProvider()` before exporting it from
   `providers/ai/index.ts`. This wrapper (a) schema-validates every
   response with `zod` and (b) re-checks any item ids the provider claims
   to have used against the curriculum guard for the current day,
   stripping or rejecting anything forbidden -- so a hallucinating
   provider can never leak future curriculum material into a session.
3. Every call your provider receives is scoped to a `CurriculumEnvelope`
   (`providers/ai/envelope.ts`): allowed capabilities, allowed vocabulary,
   previously-introduced material, forbidden future capabilities, and the
   exercise objective. Build your prompt from that envelope alone -- don't
   give the model access to the full curriculum.

Nothing else in the app needs to change -- every caller depends only on
the `AIProvider` interface.
