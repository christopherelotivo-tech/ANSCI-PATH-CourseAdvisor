import {
  DEFAULT_CONFIDENCE_RATINGS,
  PROTOTYPE_CONFIDENCE_RATINGS,
} from '@/db/repository';
import {
  computeRecommendedCreditLimit,
  evaluateMamdaniInference,
  fuzzifyConfidence,
  fuzzifyDifficulty,
  MAMDANI_FUZZY_RULES,
  runFuzzyWorkloadAnalysis,
} from '@/domain/algorithms/fuzzy-workload';
import { generateAcademicSchedulePlan } from '@/domain/algorithms/schedule-generator';
import { ANSCI_CURRICULUM } from '@/domain/curriculum/ansci-curriculum';

describe('Milestone 4 — Mamdani Fuzzy Inference System & Schedule Generator', () => {
  describe('Mamdani Fuzzy Inference System (fuzzy-workload.ts)', () => {
    test('separates the 2 Flow.pdf approved rules from the 7 provisional fallback rules', () => {
      const approved = MAMDANI_FUZZY_RULES.filter(
        (r) => r.provenance === 'APPROVED_BY_FLOW_PDF'
      );
      const provisional = MAMDANI_FUZZY_RULES.filter(
        (r) => r.provenance === 'PROVISIONAL_FALLBACK'
      );

      expect(approved).toHaveLength(2);
      expect(provisional).toHaveLength(7);
      expect(approved.map((r) => r.id)).toEqual(['R1', 'R2']);
    });

    test('fuzzifies confidence (1-10) and difficulty (1-10) into valid [0, 1] memberships', () => {
      const lowConf = fuzzifyConfidence(2);
      expect(lowConf.LOW).toBe(1);
      expect(lowConf.MEDIUM).toBe(0);
      expect(lowConf.HIGH).toBe(0);

      const midConf = fuzzifyConfidence(7.0);
      expect(midConf.MEDIUM).toBe(1);

      const highDiff = fuzzifyDifficulty(9.5);
      expect(highDiff.HARD).toBe(1);
      expect(highDiff.EASY).toBe(0);
    });

    test('evaluates Flow.pdf Rule 1 (Low Confidence + Hard Difficulty -> Very High Risk & 12-unit limit)', () => {
      const evalR1 = evaluateMamdaniInference(2.0, 9.0);

      expect(evalR1.firedRules).toHaveLength(1);
      expect(evalR1.firedRules[0].rule.id).toBe('R1');
      expect(evalR1.firedRules[0].firingStrength).toBe(1);
      expect(evalR1.stressScore).toBeGreaterThanOrEqual(85);
      expect(computeRecommendedCreditLimit(evalR1.stressScore)).toBe(12);
    });

    test('evaluates Flow.pdf Rule 2 (High Confidence + Moderate Difficulty -> Low Risk & 18-unit limit)', () => {
      const evalR2 = evaluateMamdaniInference(9.2, 6.3);

      expect(evalR2.firedRules).toHaveLength(1);
      expect(evalR2.firedRules[0].rule.id).toBe('R2');
      expect(evalR2.firedRules[0].firingStrength).toBe(1);
      expect(evalR2.stressScore).toBeLessThan(40);
      expect(computeRecommendedCreditLimit(evalR2.stressScore)).toBe(18);
    });

    test('produces Moderate stress (56%) and 15-unit credit limit for the default 2nd-Year prototype profile', () => {
      const secondYearFirstSemCourses = ANSCI_CURRICULUM.courses.filter(
        (c) => c.year === 2 && c.term === 'FIRST' && c.creditBearing
      );

      const workload = runFuzzyWorkloadAnalysis(
        secondYearFirstSemCourses,
        PROTOTYPE_CONFIDENCE_RATINGS
      );

      expect(workload.stressLabel).toBe('Moderate');
      expect(workload.stressScore).toBe(56);
      expect(workload.recommendedUnits).toBe(15);
      expect(workload.recommendedRange).toEqual({ minUnits: 12, maxUnits: 18 });
    });

    test('evaluates neutral baseline ratings (5/10) cleanly without runtime errors', () => {
      const firstSemCourses = ANSCI_CURRICULUM.courses.filter(
        (c) => c.year === 1 && c.term === 'FIRST' && c.creditBearing
      );

      const workload = runFuzzyWorkloadAnalysis(
        firstSemCourses,
        DEFAULT_CONFIDENCE_RATINGS
      );

      expect(workload.recommendedUnits).toBeGreaterThanOrEqual(12);
      expect(workload.recommendedUnits).toBeLessThanOrEqual(21);
      expect(workload.stressScore).toBeGreaterThan(0);
      expect(workload.stressScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Academic Schedule & Roadmap Generator (schedule-generator.ts)', () => {
    test('recommends the exact 6 courses (15 units) from 11_Recommended_Schedule.png for a 2nd-year student who completed 1st Year', () => {
      const firstYearCodes = ANSCI_CURRICULUM.courses
        .filter((c) => c.year === 1)
        .map((c) => c.code);

      const plan = generateAcademicSchedulePlan(ANSCI_CURRICULUM, firstYearCodes, {
        currentYearLevel: 2,
        currentSemester: 'FIRST',
        targetTimelineYears: 4,
        confidenceRatings: PROTOTYPE_CONFIDENCE_RATINGS,
      });

      expect(plan.nextSemester.semesterTitle).toBe('2nd Year · 1st Semester');
      expect(plan.nextSemester.recommendedUnitLimit).toBe(15);
      expect(plan.nextSemester.totalUnits).toBe(15);
      expect(plan.nextSemester.stressScore).toBe(56);

      const recommendedCodes = plan.nextSemester.courses.map((item) => item.course.code);
      expect(recommendedCodes).toEqual([
        'CHM043',
        'CHM043.1',
        'AGR002',
        'AGR003',
        'ANS002',
        'CRP002',
      ]);

      // Every course must include a transparent placement reason
      for (const item of plan.nextSemester.courses) {
        expect(item.reason.length).toBeGreaterThan(10);
      }
    });

    test('never schedules a course before its prerequisites are satisfied across the entire multi-semester roadmap', () => {
      const plan = generateAcademicSchedulePlan(ANSCI_CURRICULUM, [], {
        currentYearLevel: 1,
        currentSemester: 'FIRST',
        targetTimelineYears: 4,
        confidenceRatings: DEFAULT_CONFIDENCE_RATINGS,
      });

      expect(plan.semesters.length).toBeGreaterThanOrEqual(6);

      const knownCatalogCodes = new Set(ANSCI_CURRICULUM.courses.map((c) => c.code));
      const completedSoFar = new Set<string>();

      for (const semester of plan.semesters) {
        for (const item of semester.courses) {
          for (const prereq of item.course.prerequisites) {
            if (knownCatalogCodes.has(prereq)) {
              expect(completedSoFar.has(prereq)).toBe(true);
            }
          }
        }
        for (const item of semester.courses) {
          completedSoFar.add(item.course.code);
        }
      }
    });

    test('adjusts next-semester credit limit down to 12 units when student confidence is very low', () => {
      const firstYearCodes = ANSCI_CURRICULUM.courses
        .filter((c) => c.year === 1)
        .map((c) => c.code);

      const lowConfidencePlan = generateAcademicSchedulePlan(
        ANSCI_CURRICULUM,
        firstYearCodes,
        {
          currentYearLevel: 2,
          currentSemester: 'FIRST',
          targetTimelineYears: 4,
          confidenceRatings: {
            Mathematics: 1,
            Science: 1,
            Agriculture: 2,
            'Animal Science': 1,
            Research: 1,
          },
        }
      );

      expect(lowConfidencePlan.workloadAnalysis.recommendedUnits).toBe(12);
      expect(lowConfidencePlan.nextSemester.totalUnits).toBeLessThanOrEqual(12);
    });
  });
});
