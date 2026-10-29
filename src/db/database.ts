import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME } from './schema';
import { initializeAndSeedDatabase } from './seed';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await initializeAndSeedDatabase(db);
      return db;
    })();
  }
  return databasePromise;
}

