/**
 * VOCABULARY content records.
 *
 * Every item states its category (ENGINE items live in engines.ts, not
 * here), its first permitted day, and its purpose -- so vocabulary growth
 * stays explicit and auditable (see project brief VOCABULARY BUDGET).
 *
 * Only Day 1 is populated. This is deliberate: the brief prohibits
 * inventing substantive French curriculum content beyond what's needed to
 * demonstrate the architecture. Every item below is `status: 'DRAFT'` --
 * a curriculum author must review and approve before it is presented as
 * canonical. See README "How to add vocabulary".
 */
import type { VocabularyItem } from '../types';

export const VOCABULARY: VocabularyItem[] = [
  {
    id: 'vocab.bonjour',
    canonicalFrench: 'bonjour',
    englishMeaning: 'hello',
    category: 'INTERACTION',
    firstAllowedDay: 1,
    purpose: 'Opens almost any interaction; the minimum needed to enter a conversation.',
    status: 'DRAFT',
  },
  {
    id: 'vocab.enchante',
    canonicalFrench: 'enchanté(e)',
    englishMeaning: 'pleased to meet you',
    category: 'INTERACTION',
    firstAllowedDay: 1,
    purpose: 'Social close to a first introduction; keeps the exchange natural rather than abrupt.',
    status: 'DRAFT',
  },
  {
    id: 'vocab.et-vous',
    canonicalFrench: 'et vous ?',
    englishMeaning: 'and you?',
    category: 'INTERACTION',
    firstAllowedDay: 1,
    purpose: 'Smallest possible tool to hand the conversation back -- keeps an exchange alive rather than ending it.',
    status: 'DRAFT',
  },
  {
    id: 'vocab.merci',
    canonicalFrench: 'merci',
    englishMeaning: 'thank you',
    category: 'INTERACTION',
    firstAllowedDay: 1,
    purpose: 'Universal politeness marker needed in nearly every interaction.',
    status: 'DRAFT',
  },
  {
    id: 'vocab.sil-vous-plait',
    canonicalFrench: "s'il vous plaît",
    englishMeaning: 'please',
    category: 'INTERACTION',
    firstAllowedDay: 1,
    purpose: 'Softens requests; needed from the very first interaction.',
    status: 'DRAFT',
  },
  {
    id: 'vocab.excusez-moi',
    canonicalFrench: 'excusez-moi',
    englishMeaning: 'excuse me',
    category: 'INTERACTION',
    firstAllowedDay: 1,
    purpose: 'Repair/attention-getting tool; lets the learner interrupt or approach politely.',
    status: 'DRAFT',
  },
  {
    id: 'vocab.au-revoir',
    canonicalFrench: 'au revoir',
    englishMeaning: 'goodbye',
    category: 'INTERACTION',
    firstAllowedDay: 1,
    purpose: 'Closes an interaction cleanly, the counterpart to bonjour.',
    status: 'DRAFT',
  },
  {
    id: 'vocab.oui',
    canonicalFrench: 'oui',
    englishMeaning: 'yes',
    category: 'INTERACTION',
    firstAllowedDay: 1,
    purpose: 'Minimum viable response to any yes/no question.',
    status: 'DRAFT',
  },
  {
    id: 'vocab.non',
    canonicalFrench: 'non',
    englishMeaning: 'no',
    category: 'INTERACTION',
    firstAllowedDay: 1,
    purpose: 'Minimum viable response to any yes/no question.',
    status: 'DRAFT',
  },
];

export function getVocabularyById(id: string): VocabularyItem | undefined {
  return VOCABULARY.find((v) => v.id === id);
}
