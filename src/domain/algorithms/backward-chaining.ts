import type { Curriculum, CurriculumCourse } from '@/domain/curriculum/types';

import {
  buildPrerequisiteGraph,
  type UnresolvedPrerequisiteWarning,
  validateCurriculumDag,
} from './dag-validator';

export type CourseEligibilityStatus = 'COMPLETED' | 'ELIGIBLE_NOW' | 'BLOCKED';

export interface CourseRequirementAnalysis {
  course: CurriculumCourse;
  status: CourseEligibilityStatus;
  missingPrerequisites: string[];
  allMissingPrerequisiteChain: string[];
  satisfiedPrerequisites: string[];
  missingCasStanding: boolean;
  unresolvedPrerequisites: string[];
  unlocksCourses: string[];
}

export interface BackwardChainingOptions {
  targetCourseCodes?: string[];
}

export interface BackwardChainingResult {
  isValidDag: boolean;
  cycles: string[][];
  casSatisfied: boolean;
  remainingForCasCount: number;
  targetCourseCodes: string[];
  completedCourseCodes: string[];
  remainingRequiredCourses: CurriculumCourse[];
  eligibleNowCourses: CurriculumCourse[];
  blockedCourses: CurriculumCourse[];
  analysisByCourse: Record<string, CourseRequirementAnalysis>;
  unresolvedWarnings: UnresolvedPrerequisiteWarning[];
}

export function evaluateCasStanding(
  curriculum: Curriculum,
  completedSet: ReadonlySet<string>
): { casSatisfied: boolean; remainingFirstTwoYearsCodes: string[] } {
  const firstTwoYearCourses = curriculum.courses.filter(
    (c) => c.kind === 'REGULAR' && c.creditBearing && (c.year === 1 || c.year === 2)
  );

  const remainingFirstTwoYearsCodes = firstTwoYearCourses
    .filter((c) => !completedSet.has(c.code))
    .map((c) => c.code);

  return {
    casSatisfied: remainingFirstTwoYearsCodes.length === 0,
    remainingFirstTwoYearsCodes,
  };
}

export function runBackwardChaining(
  curriculum: Curriculum,
  completedCourseCodesInput: Iterable<string>,
  options: BackwardChainingOptions = {}
): BackwardChainingResult {
  const dagCheck = validateCurriculumDag(curriculum.courses);
  const graph = buildPrerequisiteGraph(curriculum.courses);
  const completedSet = new Set(
    Array.from(completedCourseCodesInput).filter((code) => graph.nodes.has(code))
  );

  const { casSatisfied, remainingFirstTwoYearsCodes } = evaluateCasStanding(
    curriculum,
    completedSet
  );

  const defaultTargets = curriculum.courses
    .filter((c) => c.kind === 'REGULAR' || c.kind === 'SMC_SLOT')
    .map((c) => c.code);

  const targetCourseCodes =
    options.targetCourseCodes && options.targetCourseCodes.length > 0
      ? options.targetCourseCodes.filter((code) => graph.nodes.has(code))
      : defaultTargets;

  const requiredUncompletedSet = new Set<string>();
  const evalStack: string[] = [];

  for (const targetCode of targetCourseCodes) {
    if (!completedSet.has(targetCode)) {
      evalStack.push(targetCode);
    }
  }

  while (evalStack.length > 0) {
    const currentCode = evalStack.pop()!;
    if (completedSet.has(currentCode) || requiredUncompletedSet.has(currentCode)) {
      continue;
    }

    const course = graph.nodes.get(currentCode);
    if (!course) {
      continue;
    }

    requiredUncompletedSet.add(currentCode);

    const prereqs = graph.courseToPrerequisites.get(currentCode) ?? [];
    for (const prereqCode of prereqs) {
      if (!completedSet.has(prereqCode) && !requiredUncompletedSet.has(prereqCode)) {
        evalStack.push(prereqCode);
      }
    }

    if (course.standingRequirements.includes('CAS') && !casSatisfied) {
      for (const casCode of remainingFirstTwoYearsCodes) {
        if (!completedSet.has(casCode) && !requiredUncompletedSet.has(casCode)) {
          evalStack.push(casCode);
        }
      }
    }
  }

  function getTransitiveMissingPrerequisites(startCode: string): string[] {
    const visited = new Set<string>();
    const stack = [...(graph.courseToPrerequisites.get(startCode) ?? [])];

    while (stack.length > 0) {
      const code = stack.pop()!;
      if (completedSet.has(code) || visited.has(code)) {
        continue;
      }
      visited.add(code);
      const deeperPrereqs = graph.courseToPrerequisites.get(code) ?? [];
      for (const next of deeperPrereqs) {
        if (!completedSet.has(next) && !visited.has(next)) {
          stack.push(next);
        }
      }
    }

    return Array.from(visited);
  }

  const analysisByCourse: Record<string, CourseRequirementAnalysis> = {};
  const remainingRequiredCourses: CurriculumCourse[] = [];
  const eligibleNowCourses: CurriculumCourse[] = [];
  const blockedCourses: CurriculumCourse[] = [];

  for (const course of curriculum.courses) {
    const isCompleted = completedSet.has(course.code);
    const knownPrereqs = graph.courseToPrerequisites.get(course.code) ?? [];
    const missingPrerequisites = knownPrereqs.filter((p) => !completedSet.has(p));
    const satisfiedPrerequisites = knownPrereqs.filter((p) => completedSet.has(p));
    const missingCasStanding =
      course.standingRequirements.includes('CAS') && !casSatisfied;
    const unresolvedPrerequisites = graph.unresolvedByCourse.get(course.code) ?? [];
    const unlocksCourses = graph.prerequisiteToDependents.get(course.code) ?? [];

    let status: CourseEligibilityStatus;
    if (isCompleted) {
      status = 'COMPLETED';
    } else if (missingPrerequisites.length === 0 && !missingCasStanding) {
      status = 'ELIGIBLE_NOW';
    } else {
      status = 'BLOCKED';
    }

    const allMissingPrerequisiteChain = isCompleted
      ? []
      : getTransitiveMissingPrerequisites(course.code);

    analysisByCourse[course.code] = {
      course,
      status,
      missingPrerequisites,
      allMissingPrerequisiteChain,
      satisfiedPrerequisites,
      missingCasStanding,
      unresolvedPrerequisites,
      unlocksCourses,
    };

    if (requiredUncompletedSet.has(course.code)) {
      remainingRequiredCourses.push(course);
      if (status === 'ELIGIBLE_NOW') {
        eligibleNowCourses.push(course);
      } else {
        blockedCourses.push(course);
      }
    }
  }

  const relevantWarnings = dagCheck.unresolvedWarnings.filter(
    (w) => requiredUncompletedSet.has(w.courseCode) || completedSet.has(w.courseCode)
  );

  return {
    isValidDag: dagCheck.isValidDag,
    cycles: dagCheck.cycles,
    casSatisfied,
    remainingForCasCount: remainingFirstTwoYearsCodes.length,
    targetCourseCodes,
    completedCourseCodes: Array.from(completedSet),
    remainingRequiredCourses,
    eligibleNowCourses,
    blockedCourses,
    analysisByCourse,
    unresolvedWarnings: relevantWarnings,
  };
}
