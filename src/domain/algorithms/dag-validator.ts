/**
 * Directed Acyclic Graph (DAG) Builder & Cycle Detection Engine
 *
 * Implements Section 3.1 & Section 9 of `docs/SystemArchitecture.pdf`:
 * - Builds prerequisite graph G = (V, E) where u -> v denotes course u requires v.
 * - Detects circular prerequisite loops using deterministic three-color DFS
 *   without risking stack overflow or infinite loops.
 * - Surfaces unresolved prerequisite course codes (such as `AGF101` and `AGF102`
 *   printed in red in `docs/AnimalScienceCurriculum.pdf`) as explicit diagnostics.
 */

import type { CurriculumCourse } from '@/domain/curriculum/types';

export interface UnresolvedPrerequisiteWarning {
  courseCode: string;
  courseTitle: string;
  unresolvedPrerequisiteCode: string;
  message: string;
}

export interface PrerequisiteGraph {
  /** Map of course code -> CurriculumCourse */
  nodes: Map<string, CurriculumCourse>;
  /** Adjacency list: courseCode -> array of known prerequisite course codes it requires */
  courseToPrerequisites: Map<string, string[]>;
  /** Reverse adjacency list: prerequisiteCode -> array of course codes that depend on it */
  prerequisiteToDependents: Map<string, string[]>;
  /** Unresolved prerequisite codes referenced in the source curriculum but absent from `nodes` */
  unresolvedByCourse: Map<string, string[]>;
  /** Flat list of all unresolved prerequisite warnings */
  unresolvedWarnings: UnresolvedPrerequisiteWarning[];
}

export interface DagValidationResult {
  isValidDag: boolean;
  /** Each detected cycle as an ordered array of course codes, e.g. ['A', 'B', 'A'] */
  cycles: string[][];
  unresolvedWarnings: UnresolvedPrerequisiteWarning[];
  graph: PrerequisiteGraph;
}

/**
 * Builds the directed prerequisite graph from a list of curriculum courses.
 */
export function buildPrerequisiteGraph(courses: CurriculumCourse[]): PrerequisiteGraph {
  const nodes = new Map<string, CurriculumCourse>();
  const courseToPrerequisites = new Map<string, string[]>();
  const prerequisiteToDependents = new Map<string, string[]>();
  const unresolvedByCourse = new Map<string, string[]>();
  const unresolvedWarnings: UnresolvedPrerequisiteWarning[] = [];

  for (const course of courses) {
    nodes.set(course.code, course);
    courseToPrerequisites.set(course.code, []);
    prerequisiteToDependents.set(course.code, []);
    unresolvedByCourse.set(course.code, []);
  }

  for (const course of courses) {
    const knownPrereqs: string[] = [];
    const unknownPrereqs: string[] = [];

    for (const prereqCode of course.prerequisites) {
      if (nodes.has(prereqCode)) {
        if (!knownPrereqs.includes(prereqCode)) {
          knownPrereqs.push(prereqCode);
        }
        const dependents = prerequisiteToDependents.get(prereqCode);
        if (dependents && !dependents.includes(course.code)) {
          dependents.push(course.code);
        }
      } else {
        if (!unknownPrereqs.includes(prereqCode)) {
          unknownPrereqs.push(prereqCode);
        }
        unresolvedWarnings.push({
          courseCode: course.code,
          courseTitle: course.title,
          unresolvedPrerequisiteCode: prereqCode,
          message: `${course.code} (${course.title}) references prerequisite "${prereqCode}", which is printed in red in the official curriculum PDF and does not exist in the course catalog.`,
        });
      }
    }

    courseToPrerequisites.set(course.code, knownPrereqs);
    unresolvedByCourse.set(course.code, unknownPrereqs);
  }

  return {
    nodes,
    courseToPrerequisites,
    prerequisiteToDependents,
    unresolvedByCourse,
    unresolvedWarnings,
  };
}

const enum VisitColor {
  WHITE = 0,
  GRAY = 1,
  BLACK = 2,
}

/**
 * Validates that the curriculum prerequisite graph is a true Directed Acyclic Graph (DAG).
 * Uses iterative/stack-safe three-color DFS to detect and extract any circular dependency loops.
 */
export function validateCurriculumDag(courses: CurriculumCourse[]): DagValidationResult {
  const graph = buildPrerequisiteGraph(courses);
  const color = new Map<string, VisitColor>();
  const cycles: string[][] = [];
  const recordedCycleKeys = new Set<string>();

  for (const code of graph.nodes.keys()) {
    color.set(code, VisitColor.WHITE);
  }

  const pathStack: string[] = [];
  const callStack: { code: string; prereqIndex: number }[] = [];

  for (const startCode of graph.nodes.keys()) {
    if (color.get(startCode) !== VisitColor.WHITE) {
      continue;
    }

    color.set(startCode, VisitColor.GRAY);
    pathStack.push(startCode);
    callStack.push({ code: startCode, prereqIndex: 0 });

    while (callStack.length > 0) {
      const frame = callStack[callStack.length - 1];
      const prerequisites = graph.courseToPrerequisites.get(frame.code) ?? [];

      if (frame.prereqIndex < prerequisites.length) {
        const prereqCode = prerequisites[frame.prereqIndex];
        frame.prereqIndex += 1;
        const prereqState = color.get(prereqCode) ?? VisitColor.WHITE;

        if (prereqState === VisitColor.WHITE) {
          color.set(prereqCode, VisitColor.GRAY);
          pathStack.push(prereqCode);
          callStack.push({ code: prereqCode, prereqIndex: 0 });
        } else if (prereqState === VisitColor.GRAY) {
          const cycleStartIndex = pathStack.indexOf(prereqCode);
          if (cycleStartIndex !== -1) {
            const cyclePath = [...pathStack.slice(cycleStartIndex), prereqCode];
            const key = cyclePath.join('->');
            if (!recordedCycleKeys.has(key)) {
              recordedCycleKeys.add(key);
              cycles.push(cyclePath);
            }
          }
        }
      } else {
        callStack.pop();
        pathStack.pop();
        color.set(frame.code, VisitColor.BLACK);
      }
    }
  }

  return {
    isValidDag: cycles.length === 0,
    cycles,
    unresolvedWarnings: graph.unresolvedWarnings,
    graph,
  };
}

