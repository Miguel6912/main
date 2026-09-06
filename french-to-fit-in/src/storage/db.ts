import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, type FrenchToFitInDB } from './schema';

let dbPromise: Promise<IDBPDatabase<FrenchToFitInDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<FrenchToFitInDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FrenchToFitInDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('ledger')) {
          const ledger = db.createObjectStore('ledger', { keyPath: 'id' });
          ledger.createIndex('by-status', 'status');
          ledger.createIndex('by-day', 'introducedDay');
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('by-day', 'dayNumber');
        }
        if (!db.objectStoreNames.contains('pilotEvents')) {
          const pilotEvents = db.createObjectStore('pilotEvents', { keyPath: 'id' });
          pilotEvents.createIndex('by-type', 'type');
          pilotEvents.createIndex('by-day', 'dayNumber');
        }
        if (!db.objectStoreNames.contains('fieldTestResults')) {
          db.createObjectStore('fieldTestResults', { keyPath: 'fieldTestId' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

/** Test-only: close the current connection (if any) and force a fresh
 * handle on the next getDB() call -- required before deleting the
 * underlying fake-indexeddb database, which otherwise blocks forever
 * waiting for open connections to close. */
export async function resetDBHandleForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;
}
