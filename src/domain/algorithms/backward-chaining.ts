/**
 * Backward Chaining Prerequisite Inference Engine
 *
 * Implements Section 3.1 of `docs/SystemArchitecture.pdf` and Stages 6–8 of `docs/Flow.pdf`:
 * 1. Goal Node Identification: Target program completion or specific capstone course(s).
 * 2. Recursive Stack Traversal: Traverses prerequisite edges backward from V_target,
 *    pushing uncompleted courses onto an evaluation stack while ignoring courses
 *    already present in the student's completed transcript set.
 * 3. Standing & Corequisite Evaluation: Checks CAS (Certificate of Agricultural Science,
 *    awarded after completing all 1st & 2nd Year courses) and corequisite pairings.
 * 4. Eligibility Classification: Categorizes each remaining required course as
 *    immediately eligible (`ELIGIBLE_NOW`) or blocked (`BLOCKED`) with exact missing prerequisites.
 */

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
  /** Direct known prerequisites that the student has not yet completed */
  missingPrerequisites: string[];
  /** Full transitive chain of uncompleted prerequisites discovered via backward chaining */
  allMissingPrerequisiteChain: string[];
  /** Direct known prerequisites that the student HAS already completed */
  satisfiedPrerequisites: string[];
  /** Whether the course requires CAS (2nd-year completion standing) and it is not yet met */
  missingCasStanding: boolean;
  /** Unresolved curriculum prerequisite codes (e.g., AGF101, AGF102) attached as warnings */
  unresolvedPrerequisites: string[];
  /** Courses in the target path that directly depend on this course */
  unlocksCourses: string[];
}

export interface BackwardChainingOptions {
  /**
   * Optional explicit target course codes (e.g. `['ANS199']` or `['ANS040']`).
   * If omitted or empty, targets all degree-required courses (`REGULAR` + `SMC_SLOT`).
   */
  targetCourseCodes?: string[];
}

export interface BackwardChainingResult {
  isValidDag: boolean;
  cycles: string[][];
  /** Whether the student has completed all 1st Year and 2nd Year regular courses (CAS standing) */
  casSatisfied: boolean;
  /** Count of 1st & 2nd Year courses still needed for CAS standing */
  remainingForCasCount: number;
  /** Target course codes used as goal roots */
  targetCourseCodes: string[];
  /** Course codes already completed by the student */
  completedCourseCodes: string[];
  /** All uncompleted courses required to reach the target goal(s), discovered via backward chaining */
  remainingRequiredCourses: CurriculumCourse[];
  /** Uncompleted required courses whose prerequisites and standing requirements are 100% met now */
  eligibleNowCourses: CurriculumCourse[];
  /** Uncompleted required courses waiting on one or more uncompleted prerequisites or CAS */
  blockedCourses: CurriculumCourse[];
  /** Detailed prerequisite & unlock analysis keyed by course code */
  analysisByCourse: Record<string, CourseRequirementAnalysis>;
  /** Unresolved source curriculum prerequisite warnings encountered along the goal path */
  unresolvedWarnings: UnresolvedPrerequisiteWarning[];
}

/**
 * Checks whether the student satisfies the Certificate of Agricultural Science (CAS)
 * requirement (completion of all 1st Year and 2nd Year regular courses).
 */
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

/**
 * Runs the Backward Chaining Inference Engine from the target goal(s) over the
 * curriculum DAG while pruning already-completed courses.
 */
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

  // Step 1: Identify Goal Nodes (V_target)
  const defaultTargets = curriculum.courses
    .filter((c) => c.kind === 'REGULAR' || c.kind === 'SMC_SLOT')
    .map((c) => c.code);

  const targetCourseCodes =
    options.targetCourseCodes && options.targetCourseCodes.length > 0
      ? options.targetCourseCodes.filter((code) => graph.nodes.has(code))
      : defaultTargets;

  // Step 2: Backward Chaining Stack Traversal from V_target
  // Push uncompleted target nodes onto the evaluation stack and walk prerequisites backward,
  // ignoring courses already present in `completedSet`.
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

    // Traverse known prerequisites backward
    const prereqs = graph.courseToPrerequisites.get(currentCode) ?? [];
    for (const prereqCode of prereqs) {
      if (!completedSet.has(prereqCode) && !requiredUncompletedSet.has(prereqCode)) {
        evalStack.push(prereqCode);
      }
    }

    // If course requires CAS standing and CAS is not yet satisfied, backward-chain
    // all remaining 1st & 2nd Year courses required to earn CAS.
    if (course.standingRequirements.includes('CAS') && !casSatisfied) {
      for (const casCode of remainingFirstTwoYearsCodes) {
        if (!completedSet.has(casCode) && !requiredUncompletedSet.has(casCode)) {
          evalStack.push(casCode);
        }
      }
    }
  }

  // Helper to compute all transitive missing prerequisites for any course via backward DFS
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

  // Step 3: Build per-course eligibility and dependency analysis
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

