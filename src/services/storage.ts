import { openDB, IDBPDatabase } from 'idb';
import { DataFile } from '../types';

const DB_NAME = 'InsightWorkspaceDB';
const STORE_NAME = 'data_files';
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const workspaceStorage = {
  async saveFile(file: DataFile): Promise<void> {
    const db = await getDB();
    await db.put(STORE_NAME, file);
  },

  async getAllFiles(): Promise<DataFile[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  },

  async deleteFile(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  },

  async updateFile(file: DataFile): Promise<void> {
    const db = await getDB();
    await db.put(STORE_NAME, file);
  },

  async clearAll(): Promise<void> {
    const db = await getDB();
    await db.clear(STORE_NAME);
  }
};
