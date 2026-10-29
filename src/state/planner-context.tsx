import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { getDatabase } from '@/db/database';
import {
  type ConfidenceRatingsMap,
  DEFAULT_CONFIDENCE_RATINGS,
  DEFAULT_STUDENT_PROFILE,
  loadCompletedCourseCodes,
  loadConfidenceRatings,
  loadStudentProfile,
  replaceCompletedCourseCodes,
  resetAllStudentProgress,
  saveConfidenceRatings,
  saveGeneratedAcademicPlan,
  saveStudentProfile,
  type StudentProfileRecord,
  type SubjectArea,
  type TargetTimelineYears,
} from '@/db/repository';
import {
  type BackwardChainingResult,
  runBackwardChaining,
} from '@/domain/algorithms/backward-chaining';
import {
  generateAcademicSchedulePlan,
  type GeneratedAcademicPlan,
} from '@/domain/algorithms/schedule-generator';
import {
  runTopologicalSort,
  type TopologicalSortResult,
} from '@/domain/algorithms/topological-sort';
import { ANSCI_CURRICULUM } from '@/domain/curriculum/ansci-curriculum';
import type { Term, YearLevel } from '@/domain/curriculum/types';

export interface PlannerContextValue {
  isHydrated: boolean;
  profile: StudentProfileRecord;
  completedCourses: Set<string>;
  confidenceRatings: ConfidenceRatingsMap;
  backwardChaining: BackwardChainingResult;
  topologicalSort: TopologicalSortResult;
  academicPlan: GeneratedAcademicPlan;
  updateStudentSetup: (input: {
    fullName: string;
    studentId: string;
    currentYearLevel: YearLevel;
    currentSemester: Term;
  }) => Promise<void>;
  updateAcademicGoal: (targetTimelineYears: TargetTimelineYears) => Promise<void>;
  toggleCourseCompleted: (courseCode: string) => void;
  setCoursesCompletedBulk: (courseCodes: string[], completed: boolean) => void;
  clearAllCompletedCourses: () => void;
  persistCompletedCourses: () => Promise<void>;
  setSubjectConfidence: (area: SubjectArea, rating: number) => void;
  persistConfidenceRatings: () => Promise<void>;
  completeOnboardingAndPersistPlan: () => Promise<void>;
  resetAcademicPlan: () => Promise<void>;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export interface PlannerProviderProps {
  children: React.ReactNode;
  initialProfile?: StudentProfileRecord;
  initialCompletedCourses?: Set<string>;
  initialConfidenceRatings?: ConfidenceRatingsMap;
}

export function PlannerProvider({
  children,
  initialProfile,
  initialCompletedCourses,
  initialConfidenceRatings,
}: PlannerProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [profile, setProfile] = useState<StudentProfileRecord>(
    initialProfile ?? DEFAULT_STUDENT_PROFILE
  );
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(
    () => initialCompletedCourses ?? new Set()
  );
  const [confidenceRatings, setConfidenceRatings] = useState<ConfidenceRatingsMap>(
    initialConfidenceRatings ?? DEFAULT_CONFIDENCE_RATINGS
  );

  useEffect(() => {
    if (Platform.OS === 'web' || process.env.JEST_WORKER_ID) {
      return;
    }

    let active = true;

    async function hydrateFromSqlite() {
      try {
        const db = await getDatabase();
        const [savedProfile, savedCompleted, savedConfidence] = await Promise.all([
          loadStudentProfile(db),
          loadCompletedCourseCodes(db),
          loadConfidenceRatings(db),
        ]);
        if (active) {
          setProfile(savedProfile);
          setCompletedCourses(new Set(savedCompleted));
          setConfidenceRatings(savedConfidence);
        }
      } catch (err) {
        console.warn('[CourseAdvisor] State hydration fallback:', err);
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    }

    hydrateFromSqlite();

    return () => {
      active = false;
    };
  }, []);

  const backwardChaining = useMemo(
    () => runBackwardChaining(ANSCI_CURRICULUM, completedCourses),
    [completedCourses]
  );

  const topologicalSort = useMemo(
    () => runTopologicalSort(backwardChaining.remainingRequiredCourses),
    [backwardChaining.remainingRequiredCourses]
  );

  const academicPlan = useMemo(
    () =>
      generateAcademicSchedulePlan(ANSCI_CURRICULUM, completedCourses, {
        currentYearLevel: profile.currentYearLevel,
        currentSemester: profile.currentSemester,
        targetTimelineYears: profile.targetTimelineYears,
        confidenceRatings,
      }),
    [
      completedCourses,
      profile.currentYearLevel,
      profile.currentSemester,
      profile.targetTimelineYears,
      confidenceRatings,
    ]
  );

  const updateStudentSetup = useCallback(
    async (input: {
      fullName: string;
      studentId: string;
      currentYearLevel: YearLevel;
      currentSemester: Term;
    }) => {
      const updated: StudentProfileRecord = {
        ...profile,
        fullName: input.fullName.trim(),
        studentId: input.studentId.trim(),
        currentYearLevel: input.currentYearLevel,
        currentSemester: input.currentSemester,
      };
      setProfile(updated);
      try {
        if (Platform.OS !== 'web') {
          const db = await getDatabase();
          await saveStudentProfile(db, updated);
        }
      } catch (err) {
        console.warn('[CourseAdvisor] Failed to persist student setup:', err);
      }
    },
    [profile]
  );

  const updateAcademicGoal = useCallback(
    async (targetTimelineYears: TargetTimelineYears) => {
      const updated: StudentProfileRecord = {
        ...profile,
        targetTimelineYears,
      };
      setProfile(updated);
      try {
        if (Platform.OS !== 'web') {
          const db = await getDatabase();
          await saveStudentProfile(db, updated);
        }
      } catch (err) {
        console.warn('[CourseAdvisor] Failed to persist academic goal:', err);
      }
    },
    [profile]
  );

  const toggleCourseCompleted = useCallback((courseCode: string) => {
    setCompletedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseCode)) {
        next.delete(courseCode);
      } else {
        next.add(courseCode);
      }
      if (Platform.OS !== 'web') {
        void getDatabase()
          .then((db) => replaceCompletedCourseCodes(db, next))
          .catch((err) =>
            console.warn('[CourseAdvisor] Failed to auto-persist course toggle:', err)
          );
      }
      return next;
    });
  }, []);

  const setCoursesCompletedBulk = useCallback((courseCodes: string[], completed: boolean) => {
    setCompletedCourses((prev) => {
      const next = new Set(prev);
      for (const code of courseCodes) {
        if (completed) {
          next.add(code);
        } else {
          next.delete(code);
        }
      }
      if (Platform.OS !== 'web') {
        void getDatabase()
          .then((db) => replaceCompletedCourseCodes(db, next))
          .catch((err) =>
            console.warn('[CourseAdvisor] Failed to auto-persist bulk courses:', err)
          );
      }
      return next;
    });
  }, []);

  const clearAllCompletedCourses = useCallback(() => {
    setCompletedCourses(new Set());
    if (Platform.OS !== 'web') {
      void getDatabase()
        .then((db) => replaceCompletedCourseCodes(db, []))
        .catch((err) =>
          console.warn('[CourseAdvisor] Failed to clear completed courses:', err)
        );
    }
  }, []);

  const persistCompletedCourses = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        const db = await getDatabase();
        await replaceCompletedCourseCodes(db, completedCourses);
      }
    } catch (err) {
      console.warn('[CourseAdvisor] Failed to persist completed courses:', err);
    }
  }, [completedCourses]);

  const setSubjectConfidence = useCallback((area: SubjectArea, rating: number) => {
    const clamped = Math.min(10, Math.max(1, Math.round(rating)));
    setConfidenceRatings((prev) => ({
      ...prev,
      [area]: clamped,
    }));
  }, []);

  const persistConfidenceRatings = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        const db = await getDatabase();
        await saveConfidenceRatings(db, confidenceRatings);
      }
    } catch (err) {
      console.warn('[CourseAdvisor] Failed to persist confidence ratings:', err);
    }
  }, [confidenceRatings]);

  const completeOnboardingAndPersistPlan = useCallback(async () => {
    const updatedProfile: StudentProfileRecord = {
      ...profile,
      onboardingCompleted: true,
    };
    setProfile(updatedProfile);
    try {
      if (Platform.OS !== 'web') {
        const db = await getDatabase();
        await saveStudentProfile(db, updatedProfile);
        await saveGeneratedAcademicPlan(db, academicPlan);
      }
    } catch (err) {
      console.warn('[CourseAdvisor] Failed to persist generated academic plan:', err);
    }
  }, [profile, academicPlan]);

  const resetAcademicPlan = useCallback(async () => {
    setProfile(DEFAULT_STUDENT_PROFILE);
    setCompletedCourses(new Set());
    setConfidenceRatings(DEFAULT_CONFIDENCE_RATINGS);
    try {
      if (Platform.OS !== 'web') {
        const db = await getDatabase();
        await resetAllStudentProgress(db);
      }
    } catch (err) {
      console.warn('[CourseAdvisor] Failed to reset student progress:', err);
    }
  }, []);

  const value = useMemo<PlannerContextValue>(
    () => ({
      isHydrated,
      profile,
      completedCourses,
      confidenceRatings,
      backwardChaining,
      topologicalSort,
      academicPlan,
      updateStudentSetup,
      updateAcademicGoal,
      toggleCourseCompleted,
      setCoursesCompletedBulk,
      clearAllCompletedCourses,
      persistCompletedCourses,
      setSubjectConfidence,
      persistConfidenceRatings,
      completeOnboardingAndPersistPlan,
      resetAcademicPlan,
    }),
    [
      isHydrated,
      profile,
      completedCourses,
      confidenceRatings,
      backwardChaining,
      topologicalSort,
      academicPlan,
      updateStudentSetup,
      updateAcademicGoal,
      toggleCourseCompleted,
      setCoursesCompletedBulk,
      clearAllCompletedCourses,
      persistCompletedCourses,
      setSubjectConfidence,
      persistConfidenceRatings,
      completeOnboardingAndPersistPlan,
      resetAcademicPlan,
    ]
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return ctx;
}
