/**
 * Kahn's Topological Sorting & Prerequisite Tier Assignment Engine
 *
 * Implements Section 3.1 (Step 4) & Section 9 of `docs/SystemArchitecture.pdf`:
 * - Orders remaining required courses so no course is ever scheduled before its prerequisites.
 * - Assigns each course to a topological prerequisite tier:
 *   - Tier 0: Courses with zero pending prerequisites (immediately available).
 *   - Tier N: Courses that depend on at least one course in Tier N - 1.
 * - Computes the Critical Path (longest prerequisite dependency chain) to detect
 *   when a student's remaining dependency chain requires extended terms.
 */

import type { CurriculumCourse, Term } from '@/domain/curriculum/types';

import { buildPrerequisiteGraph } from './dag-validator';

export interface TopologicalTier {
  tier: number;
  courses: CurriculumCourse[];
}

export interface TopologicalSortResult {
  isAcyclic: boolean;
  /** Courses ordered topologically so every prerequisite appears before its dependents */
  orderedCourses: CurriculumCourse[];
  orderedCourseCodes: string[];
  /** Courses grouped by prerequisite depth tier (Tier 0, Tier 1, ..., Tier K) */
  tiers: TopologicalTier[];
  /** Map of courseCode -> tier index (0..K) */
  courseTierMap: Record<string, number>;
  /** Length of the longest prerequisite chain (number of sequential terms required by dependencies alone) */
  criticalPathLength: number;
  /** Course codes along the longest dependency chain from root prerequisite to final dependent */
  criticalPathCourseCodes: string[];
  /** Any course codes that could not be sorted due to a circular dependency */
  cycleResidualCodes: string[];
}

const TERM_ORDER: Record<Term, number> = {
  FIRST: 1,
  SECOND: 2,
  SUMMER: 3,
};

function compareCurriculumOrder(a: CurriculumCourse, b: CurriculumCourse): number {
  const yearA = a.year ?? 5;
  const yearB = b.year ?? 5;
  if (yearA !== yearB) {
    return yearA - yearB;
  }
  const termA = a.term ? TERM_ORDER[a.term] : 4;
  const termB = b.term ? TERM_ORDER[b.term] : 4;
  if (termA !== termB) {
    return termA - termB;
  }
  return a.code.localeCompare(b.code);
}

/**
 * Performs Kahn's topological sort and prerequisite tier assignment over the provided
 * set of courses (e.g. the remaining uncompleted required courses from Backward Chaining).
 *
 * Any prerequisite not present in `courses` is assumed already satisfied (or external).
 */
export function runTopologicalSort(courses: CurriculumCourse[]): TopologicalSortResult {
  const graph = buildPrerequisiteGraph(courses);
  const inDegree = new Map<string, number>();
  const tierByCode = new Map<string, number>();
  const parentOnLongestPath = new Map<string, string | null>();

  for (const course of courses) {
    const activePrereqs = graph.courseToPrerequisites.get(course.code) ?? [];
    inDegree.set(course.code, activePrereqs.length);
    tierByCode.set(course.code, 0);
    parentOnLongestPath.set(course.code, null);
  }

  // Initialize queue with all Tier-0 courses (in-degree === 0), sorted deterministically
  const readyQueue: CurriculumCourse[] = courses
    .filter((c) => (inDegree.get(c.code) ?? 0) === 0)
    .sort(compareCurriculumOrder);

  const orderedCourses: CurriculumCourse[] = [];

  while (readyQueue.length > 0) {
    const current = readyQueue.shift()!;
    orderedCourses.push(current);

    const currentTier = tierByCode.get(current.code) ?? 0;
    const dependents = graph.prerequisiteToDependents.get(current.code) ?? [];

    for (const depCode of dependents) {
      const prevDepTier = tierByCode.get(depCode) ?? 0;
      if (currentTier + 1 > prevDepTier) {
        tierByCode.set(depCode, currentTier + 1);
        parentOnLongestPath.set(depCode, current.code);
      }

      const nextInDegree = (inDegree.get(depCode) ?? 1) - 1;
      inDegree.set(depCode, nextInDegree);

      if (nextInDegree === 0) {
        const depCourse = graph.nodes.get(depCode);
        if (depCourse) {
          readyQueue.push(depCourse);
          readyQueue.sort(compareCurriculumOrder);
        }
      }
    }
  }

  const isAcyclic = orderedCourses.length === courses.length;
  const sortedSet = new Set(orderedCourses.map((c) => c.code));
  const cycleResidualCodes = courses
    .filter((c) => !sortedSet.has(c.code))
    .map((c) => c.code);

  // Group into TopologicalTiers
  const maxTier =
    orderedCourses.length > 0
      ? Math.max(...orderedCourses.map((c) => tierByCode.get(c.code) ?? 0))
      : -1;

  const tiers: TopologicalTier[] = [];
  for (let t = 0; t <= maxTier; t++) {
    const tierCourses = orderedCourses
      .filter((c) => (tierByCode.get(c.code) ?? 0) === t)
      .sort(compareCurriculumOrder);
    if (tierCourses.length > 0) {
      tiers.push({
        tier: t,
        courses: tierCourses,
      });
    }
  }

  const courseTierMap: Record<string, number> = {};
  for (const [code, tier] of tierByCode.entries()) {
    if (sortedSet.has(code)) {
      courseTierMap[code] = tier;
    }
  }

  // Reconstruct the longest prerequisite chain (Critical Path)
  let deepestCourseCode: string | null = null;
  let deepestTier = -1;
  for (const course of orderedCourses) {
    const t = tierByCode.get(course.code) ?? 0;
    if (t > deepestTier) {
      deepestTier = t;
      deepestCourseCode = course.code;
    }
  }

  const criticalPathCourseCodes: string[] = [];
  let cursor = deepestCourseCode;
  while (cursor) {
    criticalPathCourseCodes.unshift(cursor);
    cursor = parentOnLongestPath.get(cursor) ?? null;
  }

  return {
    isAcyclic,
    orderedCourses,
    orderedCourseCodes: orderedCourses.map((c) => c.code),
    tiers,
    courseTierMap,
    criticalPathLength: criticalPathCourseCodes.length,
    criticalPathCourseCodes,
    cycleResidualCodes,
  };
}

