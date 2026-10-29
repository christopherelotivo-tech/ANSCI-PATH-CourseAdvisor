import type { GeneratedAcademicPlan } from '@/domain/algorithms/schedule-generator';
import type { Term, YearLevel } from '@/domain/curriculum/types';

import type { SqlExecutor } from './seed';

export const SUBJECT_AREAS = [
  'Mathematics',
  'Science',
  'Agriculture',
  'Animal Science',
  'Research',
] as const;

export type SubjectArea = (typeof SUBJECT_AREAS)[number];

export type TargetTimelineYears = 4 | 5 | 6;

export interface StudentProfileRecord {
  fullName: string;
  studentId: string;
  currentYearLevel: YearLevel;
  currentSemester: Term;
  programCode: string;
  goalType: 'COMPLETE_PROGRAM';
  targetTimelineYears: TargetTimelineYears;
  onboardingCompleted: boolean;
}

export type ConfidenceRatingsMap = Record<SubjectArea, number>;

export const DEFAULT_STUDENT_PROFILE: StudentProfileRecord = {
  fullName: '',
  studentId: '',
  currentYearLevel: 1,
  currentSemester: 'FIRST',
  programCode: 'BSA-ANSCI',
  goalType: 'COMPLETE_PROGRAM',
  targetTimelineYears: 4,
  onboardingCompleted: false,
};

export const PROTOTYPE_STUDENT_PROFILE: StudentProfileRecord = {
  fullName: 'Juan Dela Cruz',
  studentId: '2025-0001',
  currentYearLevel: 2,
  currentSemester: 'FIRST',
  programCode: 'BSA-ANSCI',
  goalType: 'COMPLETE_PROGRAM',
  targetTimelineYears: 4,
  onboardingCompleted: true,
};

export const DEFAULT_CONFIDENCE_RATINGS: ConfidenceRatingsMap = {
  Mathematics: 5,
  Science: 5,
  Agriculture: 5,
  'Animal Science': 5,
  Research: 5,
};

export const PROTOTYPE_CONFIDENCE_RATINGS: ConfidenceRatingsMap = {
  Mathematics: 7,
  Science: 7,
  Agriculture: 8,
  'Animal Science': 5,
  Research: 6,
};

export interface ExtendedSqlExecutor extends SqlExecutor {
  getAllAsync<T>(source: string, ...params: (string | number | null)[]): Promise<T[]>;
}

interface DbProfileRow {
  full_name: string;
  student_id: string;
  current_year_level: number;
  current_semester: string;
  program_code: string;
  goal_type: string;
  target_timeline_years: number;
  onboarding_completed: number;
}

interface DbCompletedCourseRow {
  course_code: string;
}

interface DbConfidenceRow {
  subject_area: string;
  rating: number;
}

export async function loadStudentProfile(db: SqlExecutor): Promise<StudentProfileRecord> {
  const row = await db.getFirstAsync<DbProfileRow>(
    `SELECT full_name, student_id, current_year_level, current_semester,
            program_code, goal_type, target_timeline_years, onboarding_completed
     FROM student_profile
     WHERE id = 1`
  );

  if (!row) {
    return { ...DEFAULT_STUDENT_PROFILE };
  }

  const isLegacyMock =
    row.full_name === 'Juan Dela Cruz' &&
    row.student_id === '2025-0001' &&
    row.onboarding_completed === 0;

  return {
    fullName: isLegacyMock ? '' : row.full_name,
    studentId: isLegacyMock ? '' : row.student_id,
    currentYearLevel: (row.current_year_level as YearLevel) || 1,
    currentSemester: (row.current_semester as Term) || 'FIRST',
    programCode: row.program_code || 'BSA-ANSCI',
    goalType: 'COMPLETE_PROGRAM',
    targetTimelineYears: (row.target_timeline_years as TargetTimelineYears) || 4,
    onboardingCompleted: row.onboarding_completed === 1,
  };
}

export async function saveStudentProfile(
  db: SqlExecutor,
  profile: StudentProfileRecord
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO student_profile (
      id, full_name, student_id, current_year_level, current_semester,
      program_code, goal_type, target_timeline_years, onboarding_completed, updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    profile.fullName.trim(),
    profile.studentId.trim(),
    profile.currentYearLevel,
    profile.currentSemester,
    profile.programCode,
    profile.goalType,
    profile.targetTimelineYears,
    profile.onboardingCompleted ? 1 : 0,
    now
  );
}

export async function loadCompletedCourseCodes(db: ExtendedSqlExecutor): Promise<string[]> {
  const rows = await db.getAllAsync<DbCompletedCourseRow>(
    'SELECT course_code FROM completed_courses ORDER BY course_code ASC'
  );
  return rows.map((r) => r.course_code);
}

export async function replaceCompletedCourseCodes(
  db: SqlExecutor,
  courseCodes: Iterable<string>
): Promise<void> {
  await db.runAsync('DELETE FROM completed_courses');
  const now = new Date().toISOString();
  const uniqueCodes = Array.from(new Set(courseCodes));
  for (const code of uniqueCodes) {
    await db.runAsync(
      'INSERT OR REPLACE INTO completed_courses (course_code, completed_at) VALUES (?, ?)',
      code,
      now
    );
  }
}

export async function loadConfidenceRatings(
  db: ExtendedSqlExecutor
): Promise<ConfidenceRatingsMap> {
  const rows = await db.getAllAsync<DbConfidenceRow>(
    'SELECT subject_area, rating FROM confidence_ratings'
  );
  const ratings: ConfidenceRatingsMap = { ...DEFAULT_CONFIDENCE_RATINGS };
  for (const row of rows) {
    if (SUBJECT_AREAS.includes(row.subject_area as SubjectArea)) {
      const clamped = Math.min(10, Math.max(1, Math.round(row.rating)));
      ratings[row.subject_area as SubjectArea] = clamped;
    }
  }
  return ratings;
}

export async function saveConfidenceRatings(
  db: SqlExecutor,
  ratings: ConfidenceRatingsMap
): Promise<void> {
  const now = new Date().toISOString();
  for (const area of SUBJECT_AREAS) {
    const score = Math.min(10, Math.max(1, Math.round(ratings[area] ?? 5)));
    await db.runAsync(
      `INSERT OR REPLACE INTO confidence_ratings (subject_area, rating, updated_at)
       VALUES (?, ?, ?)`,
      area,
      score,
      now
    );
  }
}

export async function saveGeneratedAcademicPlan(
  db: SqlExecutor,
  plan: GeneratedAcademicPlan
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO generated_plans (
      id, stress_score, stress_label, recommended_credit_limit,
      semesters_remaining, completion_percentage, plan_json, generated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
    plan.workloadAnalysis.stressScore,
    plan.workloadAnalysis.stressLabel,
    plan.workloadAnalysis.recommendedUnits,
    plan.semestersToGraduation,
    plan.completionPercentage,
    JSON.stringify({
      semestersToGraduation: plan.semestersToGraduation,
      completionPercentage: plan.completionPercentage,
      nextSemesterTitle: plan.nextSemester.semesterTitle,
      nextSemesterCourseCodes: plan.nextSemester.courses.map((c) => c.course.code),
    }),
    now
  );

  await db.runAsync('DELETE FROM recommended_schedule_items');
  for (const sem of plan.semesters) {
    for (const item of sem.courses) {
      await db.runAsync(
        `INSERT INTO recommended_schedule_items (
          semester_index, year_level, semester, course_code, units, placement_reason, tier
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        sem.semesterIndex,
        sem.year,
        sem.term,
        item.course.code,
        item.course.units,
        item.reason,
        item.tier
      );
    }
  }
}

export async function resetAllStudentProgress(db: SqlExecutor): Promise<void> {
  await db.runAsync('DELETE FROM completed_courses');
  await db.runAsync('DELETE FROM recommended_schedule_items');
  await db.runAsync('DELETE FROM generated_plans');
  await saveStudentProfile(db, DEFAULT_STUDENT_PROFILE);
  await saveConfidenceRatings(db, DEFAULT_CONFIDENCE_RATINGS);
}


