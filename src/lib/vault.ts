import { openDB, IDBPDatabase } from 'idb';

export interface ThreadItem {
  query: string;
  insight: string;
  score: number;
  timestamp: number;
}

export interface VaultSnapshot {
  id: string;
  name: string;
  timestamp: number;
  data: any;
  analysis: string;
  query: string;
  threads?: Record<string, ThreadItem[]>;
}

const DB_NAME = 'ak_aletheo_vault';
const STORE_NAME = 'snapshots';

export async function initVaultDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function saveToVault(snapshot: VaultSnapshot): Promise<void> {
  const db = await initVaultDB();
  await db.put(STORE_NAME, snapshot);
}

export async function getVaultSnapshots(): Promise<VaultSnapshot[]> {
  const db = await initVaultDB();
  return db.getAll(STORE_NAME);
}

export async function deleteFromVault(id: string): Promise<void> {
  const db = await initVaultDB();
  await db.delete(STORE_NAME, id);
}
