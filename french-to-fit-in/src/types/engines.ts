import type { ItemId, ContentStatus } from './curriculum';

/**
 * "Engines" are the generative structures/verbs (as opposed to plain
 * vocabulary nouns) -- e.g. "je voudrais...", "je dois...", present-tense
 * regular -er conjugation pattern. They live separately from vocabulary.ts
 * because they gate grammar/structure, not lexical items.
 */
export interface EngineItem {
  id: ItemId;
  canonicalFrench: string;
  englishMeaning: string;
  /** First day number this engine may be used/taught. */
  introducedDay: number;
  /** What this engine generatively unlocks, e.g. "unlocks polite requests". */
  purpose: string;
  status: ContentStatus;
}
