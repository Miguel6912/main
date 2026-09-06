import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDBHandleForTests } from './db';
import { DB_NAME } from './schema';
import { ensureLedgerSeeded, getAllLedgerItems, getLedgerItem, putLedgerItem } from './ledgerStore';
import { getAppMeta, updateAppMeta } from './metaStore';
import { createSessionRecord, getAllSessionRecords, updateSessionRecord } from './sessionStore';
import { exportLearnerState, importLearnerState } from './exportImport';
import { recordPilotEvent, getAllPilotEvents } from './pilotStore';

function deleteTestDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

beforeEach(async () => {
  await resetDBHandleForTests();
  await deleteTestDB();
});

afterEach(async () => {
  await resetDBHandleForTests();
  await deleteTestDB();
});

describe('storage: knowledge ledger persistence', () => {
  it('seeds a LOCKED row for every content item exactly once, idempotently', async () => {
    await ensureLedgerSeeded();
    const first = await getAllLedgerItems();
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((i) => i.status === 'LOCKED')).toBe(true);

    // Mutate one item, then re-seed -- must not overwrite progress.
    const item = first[0];
    await putLedgerItem({ ...item, status: 'INTRODUCED', introducedAt: '2024-01-01T00:00:00.000Z' });
    await ensureLedgerSeeded();
    const after = await getLedgerItem(item.id);
    expect(after?.status).toBe('INTRODUCED');
  });

  it('round-trips a single ledger item through put/get', async () => {
    await ensureLedgerSeeded();
    const items = await getAllLedgerItems();
    const target = items[0];
    const updated = { ...target, retrievalAttempts: 42 };
    await putLedgerItem(updated);
    const fetched = await getLedgerItem(target.id);
    expect(fetched?.retrievalAttempts).toBe(42);
  });
});

describe('storage: app meta persistence', () => {
  it('defaults to day 1, pilot mode off, and survives updates', async () => {
    const meta = await getAppMeta();
    expect(meta.currentDay).toBe(1);
    expect(meta.pilotModeEnabled).toBe(false);

    const updated = await updateAppMeta({ currentDay: 5, pilotModeEnabled: true });
    expect(updated.currentDay).toBe(5);
    expect(updated.pilotModeEnabled).toBe(true);

    const reread = await getAppMeta();
    expect(reread.currentDay).toBe(5);
  });
});

describe('storage: session records', () => {
  it('creates and updates a session record, marking completion', async () => {
    await createSessionRecord({
      id: 'session-1',
      dayNumber: 1,
      startedAt: '2024-01-01T00:00:00.000Z',
      completedAt: null,
      retrievalAccuracy: null,
    });
    let all = await getAllSessionRecords();
    expect(all).toHaveLength(1);
    expect(all[0].completedAt).toBeNull();

    await updateSessionRecord({
      id: 'session-1',
      dayNumber: 1,
      startedAt: '2024-01-01T00:00:00.000Z',
      completedAt: '2024-01-01T00:10:00.000Z',
      retrievalAccuracy: 0.8,
    });
    all = await getAllSessionRecords();
    expect(all[0].completedAt).not.toBeNull();
    expect(all[0].retrievalAccuracy).toBe(0.8);
  });
});

describe('storage: pilot events', () => {
  it('records and retrieves pilot events in chronological order', async () => {
    await recordPilotEvent({ id: 'evt-2', type: 'SESSION_END', timestamp: '2024-01-02T00:00:00.000Z', dayNumber: 1 });
    await recordPilotEvent({ id: 'evt-1', type: 'SESSION_START', timestamp: '2024-01-01T00:00:00.000Z', dayNumber: 1 });
    const events = await getAllPilotEvents();
    expect(events.map((e) => e.id)).toEqual(['evt-1', 'evt-2']);
  });
});

describe('storage: export/import round trip', () => {
  it('exports full learner state and re-imports it into a fresh database unchanged', async () => {
    await ensureLedgerSeeded();
    await updateAppMeta({ currentDay: 3, pilotModeEnabled: true });
    await createSessionRecord({
      id: 'session-1',
      dayNumber: 1,
      startedAt: '2024-01-01T00:00:00.000Z',
      completedAt: '2024-01-01T00:10:00.000Z',
      retrievalAccuracy: 1,
    });
    await recordPilotEvent({ id: 'evt-1', type: 'SESSION_START', timestamp: '2024-01-01T00:00:00.000Z', dayNumber: 1 });

    const exported = await exportLearnerState();
    expect(exported.meta.currentDay).toBe(3);
    expect(exported.ledger.length).toBeGreaterThan(0);
    expect(exported.sessions).toHaveLength(1);
    expect(exported.pilotEvents).toHaveLength(1);

    // Wipe and re-import.
    await resetDBHandleForTests();
    await deleteTestDB();
    await importLearnerState(exported);

    const meta = await getAppMeta();
    expect(meta.currentDay).toBe(3);
    const ledger = await getAllLedgerItems();
    expect(ledger.length).toBe(exported.ledger.length);
    const sessions = await getAllSessionRecords();
    expect(sessions).toHaveLength(1);
  });
});
