import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME } from './schema';
import { initializeAndSeedDatabase } from './seed';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Opens (or returns the cached) `courseadvisor.db` SQLite connection and ensures
 * schema migrations and BS Agriculture (Animal Science) curriculum seeding have completed.
 */
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

