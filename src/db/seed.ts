import { ANSCI_CURRICULUM } from '@/domain/curriculum/ansci-curriculum';
import type { Curriculum } from '@/domain/curriculum/types';

import { CREATE_TABLES_SQL, DATABASE_VERSION } from './schema';

export interface SqlExecutor {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: (string | number | null)[]): Promise<unknown>;
  getFirstAsync<T>(source: string, ...params: (string | number | null)[]): Promise<T | null>;
}

export async function initializeAndSeedDatabase(
  db: SqlExecutor,
  curriculum: Curriculum = ANSCI_CURRICULUM
): Promise<void> {
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(CREATE_TABLES_SQL);
    await seedCurriculumData(db, curriculum);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    return;
  }

  const existingCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM courses WHERE program_code = ?',
    curriculum.programCode
  );
  if (!existingCount || existingCount.count === 0) {
    await seedCurriculumData(db, curriculum);
  }
}

export async function seedCurriculumData(
  db: SqlExecutor,
  curriculum: Curriculum = ANSCI_CURRICULUM
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO programs (
      code, name, major, institution, board_resolution, effectivity,
      reference, grand_total_units, nstp_units, smc_minimum_courses, smc_minimum_units
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    curriculum.programCode,
    curriculum.programName,
    curriculum.major,
    curriculum.institution,
    curriculum.boardResolution,
    curriculum.effectivity,
    curriculum.reference,
    curriculum.grandTotalUnits,
    curriculum.nstpUnits,
    curriculum.smcMinimumCourses,
    curriculum.smcMinimumUnits
  );

  const knownCourseCodes = new Set(curriculum.courses.map((course) => course.code));

  for (const course of curriculum.courses) {
    await db.runAsync(
      `INSERT OR REPLACE INTO courses (
        code, source_code, program_code, title, units, credit_bearing,
        lec_hours, lab_hours, hours_are_term_total, year_level, semester,
        kind, standing_requirement, prerequisite_cell_blank, notes_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      course.code,
      course.sourceCode ?? null,
      curriculum.programCode,
      course.title,
      course.units,
      course.creditBearing ? 1 : 0,
      course.lecHours,
      course.labHours,
      course.hoursAreTermTotal ? 1 : 0,
      course.year,
      course.term,
      course.kind,
      course.standingRequirements[0] ?? null,
      course.prerequisiteCellBlank ? 1 : 0,
      course.notes ? JSON.stringify(course.notes) : null
    );

    for (const prereqCode of course.prerequisites) {
      const isUnresolved = knownCourseCodes.has(prereqCode) ? 0 : 1;
      await db.runAsync(
        `INSERT OR REPLACE INTO course_prerequisites (
          course_code, prerequisite_code, dependency_type, is_unresolved
        ) VALUES (?, ?, 'PREREQUISITE', ?)`,
        course.code,
        prereqCode,
        isUnresolved
      );
    }

    for (const coreqCode of course.corequisites) {
      const isUnresolved = knownCourseCodes.has(coreqCode) ? 0 : 1;
      await db.runAsync(
        `INSERT OR REPLACE INTO course_prerequisites (
          course_code, prerequisite_code, dependency_type, is_unresolved
        ) VALUES (?, ?, 'COREQUISITE', ?)`,
        course.code,
        coreqCode,
        isUnresolved
      );
    }
  }
}

