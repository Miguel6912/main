import type { ItemId, ContentStatus } from './curriculum';

/**
 * Vocabulary budget categories (see project brief "VOCABULARY BUDGET").
 *
 * ENGINE: highly generative language (verbs/structures that let learners
 *         generate many messages).
 * INTERACTION: words used to control or sustain conversation.
 * DOMAIN: specific nouns/adjectives needed for a day's capability.
 */
export type VocabularyCategory = 'ENGINE' | 'INTERACTION' | 'DOMAIN';

export interface VocabularyItem {
  id: ItemId;
  canonicalFrench: string;
  englishMeaning: string;
  category: VocabularyCategory;
  /** First day number this item may be used by any exercise generator. */
  firstAllowedDay: number;
  /** Why this item exists -- what capability it serves. Required, auditable. */
  purpose: string;
  /** Optional short pronunciation guidance (sparse -- see PRONUNCIATION rules). */
  pronunciationNote?: string;
  status: ContentStatus;
}
