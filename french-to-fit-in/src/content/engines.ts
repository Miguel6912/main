/**
 * ENGINE content records.
 *
 * "Engines" are the small set of highly generative verbs/structures that let
 * a learner build many different messages (see project brief VOCABULARY
 * BUDGET). This file is deliberately sparse: only Day 1 has been populated
 * as a demonstration. All curriculum authorship here is DRAFT -- it exists
 * to prove the architecture works, not as canonical course content. A
 * curriculum author replaces/extends this file day by day; see README
 * "How to add vocabulary" for the process (engines follow the same rules).
 */
import type { EngineItem } from '../types';

export const ENGINES: EngineItem[] = [
  {
    id: 'engine.je-mappelle',
    canonicalFrench: "je m'appelle",
    englishMeaning: 'my name is',
    introducedDay: 1,
    purpose:
      'Generative reflexive self-naming form ("s\'appeler"). The base for later person-shifts (tu t\'appelles, il/elle s\'appelle) once those are curriculum-approved for a later day -- not taught here.',
    status: 'DRAFT',
  },
];
