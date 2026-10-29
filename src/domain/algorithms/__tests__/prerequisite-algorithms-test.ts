import {
  evaluateCasStanding,
  runBackwardChaining,
} from '@/domain/algorithms/backward-chaining';
import {
  buildPrerequisiteGraph,
  validateCurriculumDag,
} from '@/domain/algorithms/dag-validator';
import { runTopologicalSort } from '@/domain/algorithms/topological-sort';
import { ANSCI_CURRICULUM } from '@/domain/curriculum/ansci-curriculum';
import type { CurriculumCourse } from '@/domain/curriculum/types';

function makeMockCourse(
  code: string,
  prerequisites: string[] = []
): CurriculumCourse {
  return {
    code,
    title: `Mock Course ${code}`,
    units: 3,
    year: 1,
    term: 'FIRST',
    kind: 'REGULAR',
    creditBearing: true,
    lecHours: 2,
    labHours: 3,
    prerequisites,
    corequisites: [],
    standingRequirements: [],
  };
}

describe('Milestone 3 — DAG Validation, Backward Chaining & Topological Sort', () => {
  describe('validateCurriculumDag & buildPrerequisiteGraph', () => {
    test('validates the official BS Agriculture (Animal Science) curriculum as a cycle-free DAG', () => {
      const result = validateCurriculumDag(ANSCI_CURRICULUM.courses);

      expect(result.isValidDag).toBe(true);
      expect(result.cycles).toHaveLength(0);
    });

    test('surfaces unresolved source-curriculum prerequisite codes AGF101 and AGF102 on ANS042, ANS043, and ANS044', () => {
      const result = validateCurriculumDag(ANSCI_CURRICULUM.courses);

      expect(result.unresolvedWarnings).toHaveLength(4);
      const summary = result.unresolvedWarnings.map(
        (w) => `${w.courseCode}:${w.unresolvedPrerequisiteCode}`
      );
      expect(summary).toEqual(
        expect.arrayContaining([
          'ANS042:AGF101',
          'ANS043:AGF101',
          'ANS044:AGF101',
          'ANS044:AGF102',
        ])
      );
    });

    test('detects 3-node circular prerequisite loops (A -> B -> C -> A) without stack overflow', () => {
      const cyclicCourses: CurriculumCourse[] = [
        makeMockCourse('A', ['B']),
        makeMockCourse('B', ['C']),
        makeMockCourse('C', ['A']),
        makeMockCourse('D', ['A']),
      ];

      const result = validateCurriculumDag(cyclicCourses);

      expect(result.isValidDag).toBe(false);
      expect(result.cycles.length).toBeGreaterThanOrEqual(1);
      expect(result.cycles[0]).toEqual(['A', 'B', 'C', 'A']);
    });

    test('builds forward and reverse prerequisite adjacency maps accurately', () => {
      const graph = buildPrerequisiteGraph(ANSCI_CURRICULUM.courses);

      expect(graph.courseToPrerequisites.get('ANS040')).toEqual(
        expect.arrayContaining(['AGR001', 'CRS001'])
      );
      expect(graph.prerequisiteToDependents.get('ANS040')).toEqual(
        expect.arrayContaining(['ANS197', 'ANS150', 'ANS151'])
      );
    });
  });

  describe('runBackwardChaining & evaluateCasStanding', () => {
    test('verifies ANS040 requires AGR001 and CRS001', () => {
      // 1. Neither AGR001 nor CRS001 completed
      const emptyResult = runBackwardChaining(ANSCI_CURRICULUM, []);
      const ans040Blocked = emptyResult.analysisByCourse['ANS040'];

      expect(ans040Blocked.status).toBe('BLOCKED');
      expect(ans040Blocked.missingPrerequisites).toEqual(['AGR001', 'CRS001']);
      expect(ans040Blocked.satisfiedPrerequisites).toEqual([]);

      // 2. Only AGR001 completed
      const partialResult = runBackwardChaining(ANSCI_CURRICULUM, ['AGR001']);
      const ans040Partial = partialResult.analysisByCourse['ANS040'];

      expect(ans040Partial.status).toBe('BLOCKED');
      expect(ans040Partial.missingPrerequisites).toEqual(['CRS001']);
      expect(ans040Partial.satisfiedPrerequisites).toEqual(['AGR001']);

      // 3. Both AGR001 and CRS001 completed -> ANS040 becomes ELIGIBLE_NOW
      const unlockedResult = runBackwardChaining(ANSCI_CURRICULUM, [
        'AGR001',
        'CRS001',
      ]);
      const ans040Unlocked = unlockedResult.analysisByCourse['ANS040'];

      expect(ans040Unlocked.status).toBe('ELIGIBLE_NOW');
      expect(ans040Unlocked.missingPrerequisites).toEqual([]);
      expect(ans040Unlocked.satisfiedPrerequisites).toEqual(['AGR001', 'CRS001']);
    });

    test('supports targeted backward chaining for a single goal course (targetCourseCodes: ["ANS150"])', () => {
      // ANS150 (Physiology of Reproduction in Farm Animals) -> requires ANS040 -> requires AGR001 & CRS001
      const targeted = runBackwardChaining(ANSCI_CURRICULUM, ['AGR001'], {
        targetCourseCodes: ['ANS150'],
      });

      const remainingCodes = targeted.remainingRequiredCourses.map((c) => c.code);
      expect(remainingCodes).toHaveLength(3);
      expect(remainingCodes).toEqual(
        expect.arrayContaining(['CRS001', 'ANS040', 'ANS150'])
      );
      expect(remainingCodes).not.toContain('AGR001');
    });

    test('evaluates CAS (Certificate of Agricultural Science) standing for ANS191 and ANS194', () => {
      const firstTwoYearCodes = ANSCI_CURRICULUM.courses
        .filter((c) => c.kind === 'REGULAR' && (c.year === 1 || c.year === 2))
        .map((c) => c.code);

      // Without all 1st & 2nd year courses, ANS191 and ANS194 are BLOCKED by CAS
      const beforeCas = runBackwardChaining(
        ANSCI_CURRICULUM,
        firstTwoYearCodes.slice(0, 10)
      );
      expect(beforeCas.casSatisfied).toBe(false);
      expect(beforeCas.analysisByCourse['ANS191'].status).toBe('BLOCKED');
      expect(beforeCas.analysisByCourse['ANS191'].missingCasStanding).toBe(true);
      expect(beforeCas.analysisByCourse['ANS194'].status).toBe('BLOCKED');

      // Once all 1st & 2nd year courses are completed, CAS is satisfied and ANS191 & ANS194 unlock
      const afterCas = runBackwardChaining(ANSCI_CURRICULUM, firstTwoYearCodes);
      expect(afterCas.casSatisfied).toBe(true);
      expect(afterCas.remainingForCasCount).toBe(0);
      expect(afterCas.analysisByCourse['ANS191'].status).toBe('ELIGIBLE_NOW');
      expect(afterCas.analysisByCourse['ANS191'].missingCasStanding).toBe(false);
      expect(afterCas.analysisByCourse['ANS194'].status).toBe('ELIGIBLE_NOW');

      const standingCheck = evaluateCasStanding(
        ANSCI_CURRICULUM,
        new Set(firstTwoYearCodes)
      );
      expect(standingCheck.casSatisfied).toBe(true);
      expect(standingCheck.remainingFirstTwoYearsCodes).toHaveLength(0);
    });

    test('returns 0 remaining required courses when all degree-required courses are completed', () => {
      const allDegreeCodes = ANSCI_CURRICULUM.courses
        .filter((c) => c.kind === 'REGULAR' || c.kind === 'SMC_SLOT')
        .map((c) => c.code);

      const completedResult = runBackwardChaining(ANSCI_CURRICULUM, allDegreeCodes);
      expect(completedResult.remainingRequiredCourses).toHaveLength(0);
      expect(completedResult.eligibleNowCourses).toHaveLength(0);
      expect(completedResult.blockedCourses).toHaveLength(0);
    });
  });

  describe('runTopologicalSort', () => {
    test('orders all remaining curriculum courses so every prerequisite precedes its dependents', () => {
      const backwardResult = runBackwardChaining(ANSCI_CURRICULUM, []);
      const topoResult = runTopologicalSort(backwardResult.remainingRequiredCourses);

      expect(topoResult.isAcyclic).toBe(true);
      expect(topoResult.cycleResidualCodes).toHaveLength(0);
      expect(topoResult.orderedCourses).toHaveLength(
        backwardResult.remainingRequiredCourses.length
      );

      const positionMap = new Map<string, number>();
      topoResult.orderedCourseCodes.forEach((code, idx) => {
        positionMap.set(code, idx);
      });

      for (const course of backwardResult.remainingRequiredCourses) {
        const courseIndex = positionMap.get(course.code)!;
        const courseTier = topoResult.courseTierMap[course.code];

        for (const prereqCode of course.prerequisites) {
          if (positionMap.has(prereqCode)) {
            const prereqIndex = positionMap.get(prereqCode)!;
            const prereqTier = topoResult.courseTierMap[prereqCode];

            expect(prereqIndex).toBeLessThan(courseIndex);
            expect(prereqTier).toBeLessThan(courseTier);
          }
        }
      }
    });

    test('places courses with no uncompleted prerequisites into Tier 0 and computes a valid critical path', () => {
      const backwardResult = runBackwardChaining(ANSCI_CURRICULUM, ['AGR001']);
      const topoResult = runTopologicalSort(backwardResult.remainingRequiredCourses);

      expect(topoResult.tiers.length).toBeGreaterThanOrEqual(4);
      const tier0Codes = topoResult.tiers[0].courses.map((c) => c.code);
      expect(tier0Codes).toContain('CRS001');
      expect(tier0Codes).not.toContain('ANS040');

      // Since AGR001 is completed, ANS040 only waits on CRS001 (Tier 0) -> ANS040 is in Tier 1
      expect(topoResult.courseTierMap['ANS040']).toBe(1);
      // ANS041 only waits on AGR004 (Tier 0) -> ANS041 is in Tier 1
      expect(topoResult.courseTierMap['ANS041']).toBe(1);
      // ANS197 depends on ANS003 (Tier 2: ANS001 -> ANS002 -> ANS003) -> ANS197 is in Tier 3
      expect(topoResult.courseTierMap['ANS197']).toBe(3);

      // Verify critical path length matches number of tiers
      expect(topoResult.criticalPathLength).toBe(topoResult.tiers.length);
      expect(topoResult.criticalPathCourseCodes).toHaveLength(topoResult.tiers.length);
    });

    test('identifies residual courses when given a synthetic graph with a cycle', () => {
      const cyclicCourses: CurriculumCourse[] = [
        makeMockCourse('ROOT', []),
        makeMockCourse('LOOP1', ['ROOT', 'LOOP2']),
        makeMockCourse('LOOP2', ['LOOP1']),
      ];

      const topoResult = runTopologicalSort(cyclicCourses);

      expect(topoResult.isAcyclic).toBe(false);
      expect(topoResult.orderedCourseCodes).toEqual(['ROOT']);
      expect(topoResult.cycleResidualCodes).toEqual(['LOOP1', 'LOOP2']);
    });
  });
});
