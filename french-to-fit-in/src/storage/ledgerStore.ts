import { getDB } from './db';
import { VOCABULARY } from '../content/vocabulary';
import { ENGINES } from '../content/engines';
import { createLockedLedgerItem, type LedgerItem, type LedgerStatus } from '../types/ledger';

function allContentAsLockedLedgerItems(): LedgerItem[] {
  const vocabItems = VOCABULARY.map((v) =>
    createLockedLedgerItem({
      id: v.id,
      canonicalFrench: v.canonicalFrench,
      englishMeaning: v.englishMeaning,
      type: v.category,
      introducedDay: v.firstAllowedDay,
    }),
  );
  const engineItems = ENGINES.map((e) =>
    createLockedLedgerItem({
      id: e.id,
      canonicalFrench: e.canonicalFrench,
      englishMeaning: e.englishMeaning,
      type: 'ENGINE',
      introducedDay: e.introducedDay,
    }),
  );
  return [...vocabItems, ...engineItems];
}

/**
 * Idempotently seeds the ledger with a LOCKED row for every content item
 * that doesn't already have one. Safe to call on every app start -- never
 * overwrites an existing (already-progressing) ledger row.
 */
export async function ensureLedgerSeeded(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('ledger', 'readwrite');
  const store = tx.objectStore('ledger');
  for (const item of allContentAsLockedLedgerItems()) {
    const existing = await store.get(item.id);
    if (!existing) {
      await store.put(item);
    }
  }
  await tx.done;
}

export async function getAllLedgerItems(): Promise<LedgerItem[]> {
  const db = await getDB();
  return db.getAll('ledger');
}

export async function getLedgerItem(id: string): Promise<LedgerItem | undefined> {
  const db = await getDB();
  return db.get('ledger', id);
}

export async function putLedgerItem(item: LedgerItem): Promise<void> {
  const db = await getDB();
  await db.put('ledger', item);
}

export async function putLedgerItems(items: LedgerItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('ledger', 'readwrite');
  await Promise.all(items.map((item) => tx.store.put(item)));
  await tx.done;
}

export async function getLedgerItemsByStatus(status: LedgerStatus): Promise<LedgerItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('ledger', 'by-status', status);
}

export async function getLedgerItemsIntroducedByDay(dayNumber: number): Promise<LedgerItem[]> {
  const all = await getAllLedgerItems();
  return all.filter((item) => item.introducedDay <= dayNumber && item.status !== 'LOCKED');
}
