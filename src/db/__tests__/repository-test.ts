import {
  DEFAULT_CONFIDENCE_RATINGS,
  DEFAULT_STUDENT_PROFILE,
  type ExtendedSqlExecutor,
  loadCompletedCourseCodes,
  loadConfidenceRatings,
  loadStudentProfile,
  replaceCompletedCourseCodes,
  resetAllStudentProgress,
  saveConfidenceRatings,
  saveGeneratedAcademicPlan,
  saveStudentProfile,
} from '@/db/repository';
import { generateAcademicSchedulePlan } from '@/domain/algorithms/schedule-generator';
import { ANSCI_CURRICULUM } from '@/domain/curriculum/ansci-curriculum';

/**
 * In-memory relational store implementing ExtendedSqlExecutor to verify
 * that student profile, completed courses, and confidence ratings persist
 * and reload accurately across app restarts.
 */
function createInMemorySqliteStore(): ExtendedSqlExecutor {
  let profileRow: Record<string, unknown> | null = null;
  const completedSet = new Set<string>();
  const confidenceMap = new Map<string, number>();

  return {
    async execAsync() {},
    async runAsync(source: string, ...params: (string | number | null)[]) {
      if (source.includes('INTO student_profile')) {
        profileRow = {
          full_name: params[0],
          student_id: params[1],
          current_year_level: params[2],
          current_semester: params[3],
          program_code: params[4],
          goal_type: params[5],
          target_timeline_years: params[6],
          onboarding_completed: params[7],
        };
      } else if (source.includes('DELETE FROM completed_courses')) {
        completedSet.clear();
      } else if (source.includes('INTO completed_courses')) {
        if (typeof params[0] === 'string') {
          completedSet.add(params[0]);
        }
      } else if (source.includes('INTO confidence_ratings')) {
        if (typeof params[0] === 'string' && typeof params[1] === 'number') {
          confidenceMap.set(params[0], params[1]);
        }
      }
      return { changes: 1, lastInsertRowId: 1 };
    },
    async getFirstAsync<T>(source: string): Promise<T | null> {
      if (source.includes('FROM student_profile')) {
        return (profileRow as T) ?? null;
      }
      return null;
    },
    async getAllAsync<T>(source: string): Promise<T[]> {
      if (source.includes('FROM completed_courses')) {
        return Array.from(completedSet)
          .sort()
          .map((code) => ({ course_code: code }) as unknown as T);
      }
      if (source.includes('FROM confidence_ratings')) {
        return Array.from(confidenceMap.entries()).map(
          ([subject_area, rating]) => ({ subject_area, rating }) as unknown as T
        );
      }
      return [];
    },
  };
}

describe('SQLite Student Progress Repository', () => {
  test('returns default profile and ratings before first save, then persists updates across restarts', async () => {
    const db = createInMemorySqliteStore();

    // Initial state before user input
    const initialProfile = await loadStudentProfile(db);
    expect(initialProfile).toEqual(DEFAULT_STUDENT_PROFILE);

    const initialCompleted = await loadCompletedCourseCodes(db);
    expect(initialCompleted).toEqual([]);

    const initialConfidence = await loadConfidenceRatings(db);
    expect(initialConfidence).toEqual(DEFAULT_CONFIDENCE_RATINGS);

    // Save updated student profile & goal
    await saveStudentProfile(db, {
      fullName: 'Maria Clara Santos',
      studentId: '2024-0142',
      currentYearLevel: 3,
      currentSemester: 'SECOND',
      programCode: 'BSA-ANSCI',
      goalType: 'COMPLETE_PROGRAM',
      targetTimelineYears: 5,
      onboardingCompleted: true,
    });

    const reloadedProfile = await loadStudentProfile(db);
    expect(reloadedProfile).toEqual({
      fullName: 'Maria Clara Santos',
      studentId: '2024-0142',
      currentYearLevel: 3,
      currentSemester: 'SECOND',
      programCode: 'BSA-ANSCI',
      goalType: 'COMPLETE_PROGRAM',
      targetTimelineYears: 5,
      onboardingCompleted: true,
    });

    // Save completed courses and reload
    await replaceCompletedCourseCodes(db, ['CRS001', 'AGR001', 'GEC101', 'AGR001']);
    const reloadedCompleted = await loadCompletedCourseCodes(db);
    expect(reloadedCompleted).toEqual(['AGR001', 'CRS001', 'GEC101']);

    // Save confidence ratings and reload
    await saveConfidenceRatings(db, {
      Mathematics: 9,
      Science: 8,
      Agriculture: 10,
      'Animal Science': 9,
      Research: 7,
    });
    const reloadedConfidence = await loadConfidenceRatings(db);
    expect(reloadedConfidence).toEqual({
      Mathematics: 9,
      Science: 8,
      Agriculture: 10,
      'Animal Science': 9,
      Research: 7,
    });

    // Save generated academic plan and verify resetAllStudentProgress restores defaults
    const plan = generateAcademicSchedulePlan(
      ANSCI_CURRICULUM,
      ['AGR001', 'CRS001', 'GEC101'],
      {
        currentYearLevel: 2,
        currentSemester: 'FIRST',
        targetTimelineYears: 4,
        confidenceRatings: DEFAULT_CONFIDENCE_RATINGS,
      }
    );
    await saveGeneratedAcademicPlan(db, plan);

    await resetAllStudentProgress(db);
    const resetProfile = await loadStudentProfile(db);
    const resetCompleted = await loadCompletedCourseCodes(db);
    const resetConfidence = await loadConfidenceRatings(db);

    expect(resetProfile).toEqual(DEFAULT_STUDENT_PROFILE);
    expect(resetCompleted).toEqual([]);
    expect(resetConfidence).toEqual(DEFAULT_CONFIDENCE_RATINGS);
  });
});

