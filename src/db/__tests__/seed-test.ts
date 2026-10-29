import { ANSCI_CURRICULUM } from '@/domain/curriculum/ansci-curriculum';
import { initializeAndSeedDatabase, type SqlExecutor } from '@/db/seed';

describe('SQLite Schema Migration & Curriculum Seeding', () => {
  test('initializes tables, seeds all curriculum courses, and flags unresolved prerequisites', async () => {
    const executedSql: string[] = [];
    const runCalls: { sql: string; params: (string | number | null)[] }[] = [];

    const mockDb: SqlExecutor = {
      async execAsync(source: string) {
        executedSql.push(source);
      },
      async runAsync(source: string, ...params: (string | number | null)[]) {
        runCalls.push({ sql: source, params });
        return { changes: 1, lastInsertRowId: 1 };
      },
      async getFirstAsync<T>(source: string): Promise<T | null> {
        if (source.includes('PRAGMA user_version')) {
          return { user_version: 0 } as unknown as T;
        }
        return null;
      },
    };

    await initializeAndSeedDatabase(mockDb, ANSCI_CURRICULUM);

    // Schema creation + PRAGMA user_version = 1
    expect(executedSql).toHaveLength(2);
    expect(executedSql[0]).toContain('CREATE TABLE IF NOT EXISTS courses');
    expect(executedSql[1]).toBe('PRAGMA user_version = 1');

    // 1 program insert + all courses + all prerequisites & corequisites
    const programInserts = runCalls.filter((c) => c.sql.includes('INTO programs'));
    const courseInserts = runCalls.filter((c) => c.sql.includes('INTO courses ('));
    const prereqInserts = runCalls.filter((c) => c.sql.includes('INTO course_prerequisites'));

    expect(programInserts).toHaveLength(1);
    expect(courseInserts).toHaveLength(ANSCI_CURRICULUM.courses.length);

    // Verify AGF101 on ANS042 is flagged with is_unresolved = 1
    const agf101Row = prereqInserts.find(
      (c) => c.params[0] === 'ANS042' && c.params[1] === 'AGF101'
    );
    expect(agf101Row?.params[2]).toBe(1);

    // Verify AGR001 on ANS040 is flagged with is_unresolved = 0
    const agr001Row = prereqInserts.find(
      (c) => c.params[0] === 'ANS040' && c.params[1] === 'AGR001'
    );
    expect(agr001Row?.params[2]).toBe(0);
  });
});

