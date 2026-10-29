/**
 * Academic Schedule & Multi-Semester Roadmap Generator
 *
 * Implements Section 3.3 & Section 9 of `docs/SystemArchitecture.pdf` and Stages 11–12 of `docs/Flow.pdf`:
 * - Selects eligible courses for the student's next semester and subsequent roadmap terms.
 * - Strictly respects:
 *   1. Completed courses (never recommends an already-completed course)
 *   2. Prerequisite satisfaction & Kahn's topological tier ordering
 *   3. Lecture + Laboratory corequisite pairing (e.g., CHM033 + CHM033.1, CHM043 + CHM043.1)
 *   4. Semester availability (`FIRST`, `SECOND`, `SUMMER`)
 *   5. Mamdani Fuzzy Inference System recommended credit limit (`12–18` units for next term)
 * - Generates a transparent human-readable placement explanation (`reason`) for every course.
 */

import type {
  ConfidenceArea,
  Curriculum,
  CurriculumCourse,
  Term,
  YearLevel,
} from '@/domain/curriculum/types';

import { runBackwardChaining } from './backward-chaining';
import {
  estimateCourseDifficulty,
  evaluateMamdaniInference,
  type FuzzyWorkloadResult,
  getCourseConfidenceArea,
  getStressLevelLabel,
  runFuzzyWorkloadAnalysis,
  type StressLevelLabel,
} from './fuzzy-workload';
import { runTopologicalSort } from './topological-sort';

export interface ScheduledCourseItem {
  course: CurriculumCourse;
  tier: number;
  subjectArea: ConfidenceArea;
  /** Baseline course difficulty score (1-10) */
  difficultyScore: number;
  /** Mamdani per-course stress score (0-100%) */
  courseStressScore: number;
  /** Human-readable per-course stress label ('Low' | 'Moderate' | 'High' | 'Very High') */
  courseStressLabel: StressLevelLabel;
  /** Human-readable explanation of why this course was placed in this semester */
  reason: string;
  /** Downstream courses unlocked by completing this course */
  unlocksCourseCodes: string[];
}

export interface SemesterSchedulePlan {
  semesterIndex: number;
  year: YearLevel;
  term: Term;
  /** Formatted label, e.g. '2nd Year · 1st Semester' */
  semesterTitle: string;
  /** Short badge label, e.g. 'Next Semester' for index 1 */
  badgeLabel: string;
  recommendedUnitLimit: number;
  totalUnits: number;
  stressScore: number;
  courses: ScheduledCourseItem[];
}

export interface GeneratedAcademicPlan {
  /** True if the curriculum graph is a valid DAG with 0 circular prerequisite loops */
  isValidDag: boolean;
  /** Detected circular prerequisite paths (empty when `isValidDag === true`) */
  cycles: string[][];
  /** Fuzzy workload analysis for the immediate next semester */
  workloadAnalysis: FuzzyWorkloadResult;
  /** Immediate next semester recommendation shown on Screen 11 (`11_Recommended_Schedule.png`) */
  nextSemester: SemesterSchedulePlan;
  /** Full sequence of remaining semesters to graduation shown on Screen 12 (`12_Your_Plan_Roadmap.png`) */
  semesters: SemesterSchedulePlan[];
  /** Number of regular semesters remaining to graduation */
  semestersToGraduation: number;
  /** Overall degree credit completion percentage (0-100) */
  completionPercentage: number;
  /** Total completed credit units */
  completedUnits: number;
  /** Total required degree credit units (178) */
  totalDegreeUnits: number;
  /** True when remaining semesters fit within the student's selected target timeline */
  isOnTrack: boolean;
  /** Minimum prerequisite chain depth (number of topological tiers) */
  criticalPathLength: number;
  /** Human-readable explanation when an Extended Term is required per SystemArchitecture.pdf Section 9 */
  extendedTermReason: string | null;
}

export interface ScheduleGeneratorOptions {
  currentYearLevel?: YearLevel;
  currentSemester?: Term;
  targetTimelineYears?: 4 | 5 | 6;
  confidenceRatings: Record<ConfidenceArea, number>;
  /** Optional explicit credit limit override */
  overrideCreditLimit?: number;
}

const YEAR_NUMBER_TO_LABEL: Record<YearLevel, string> = {
  1: '1st Year',
  2: '2nd Year',
  3: '3rd Year',
  4: '4th Year',
};

const TERM_TO_LABEL: Record<Term, string> = {
  FIRST: '1st Semester',
  SECOND: '2nd Semester',
  SUMMER: 'Summer',
};

const ORDERED_CURRICULUM_SLOTS: readonly { year: YearLevel; term: Term }[] = [
  { year: 1, term: 'FIRST' },
  { year: 1, term: 'SECOND' },
  { year: 1, term: 'SUMMER' },
  { year: 2, term: 'FIRST' },
  { year: 2, term: 'SECOND' },
  { year: 3, term: 'FIRST' },
  { year: 3, term: 'SECOND' },
  { year: 3, term: 'SUMMER' },
  { year: 4, term: 'FIRST' },
  { year: 4, term: 'SECOND' },
];

export function formatSemesterTitle(year: YearLevel, term: Term): string {
  return `${YEAR_NUMBER_TO_LABEL[year]} · ${TERM_TO_LABEL[term]}`;
}

/**
 * Determines the starting (year, term) slot for the student's next semester.
 * If all credit-bearing courses in the student's nominal (year, term) are already completed,
 * advances to the earliest curriculum slot that still has uncompleted eligible courses.
 */
export function resolveNextSemesterSlot(
  curriculum: Curriculum,
  completedSet: ReadonlySet<string>,
  currentYearLevel: YearLevel = 2,
  currentSemester: Term = 'FIRST'
): { year: YearLevel; term: Term; slotIndex: number } {
  const requestedYear = currentYearLevel;
  const requestedTerm = currentSemester;

  const requestedIndex = ORDERED_CURRICULUM_SLOTS.findIndex(
    (s) => s.year === requestedYear && s.term === requestedTerm
  );
  const startIdx = requestedIndex >= 0 ? requestedIndex : 0;

  // Check if the requested slot still has uncompleted credit-bearing courses
  const hasRemainingInSlot = (year: YearLevel, term: Term) =>
    curriculum.courses.some(
      (c) =>
        (c.kind === 'REGULAR' || c.kind === 'SMC_SLOT') &&
        c.creditBearing &&
        c.year === year &&
        c.term === term &&
        !completedSet.has(c.code)
    );

  if (hasRemainingInSlot(requestedYear, requestedTerm)) {
    return { year: requestedYear, term: requestedTerm, slotIndex: startIdx };
  }

  // Advance forward from startIdx to find the next slot with uncompleted courses
  for (let i = startIdx + 1; i < ORDERED_CURRICULUM_SLOTS.length; i++) {
    const slot = ORDERED_CURRICULUM_SLOTS[i];
    if (hasRemainingInSlot(slot.year, slot.term)) {
      return { year: slot.year, term: slot.term, slotIndex: i };
    }
  }

  // Fallback: check any earlier slot with uncompleted courses
  for (let i = 0; i < startIdx; i++) {
    const slot = ORDERED_CURRICULUM_SLOTS[i];
    if (hasRemainingInSlot(slot.year, slot.term)) {
      return { year: slot.year, term: slot.term, slotIndex: i };
    }
  }

  return {
    year: requestedYear,
    term: requestedTerm,
    slotIndex: startIdx,
  };
}

/**
 * Finds a companion lecture/lab course that should be co-scheduled in the same semester
 * (e.g., CHM033 <-> CHM033.1, CHM043 <-> CHM043.1).
 */
function findPairedLabOrLectureCode(
  course: CurriculumCourse,
  eligibleMap: ReadonlyMap<string, CurriculumCourse>
): CurriculumCourse | null {
  if (course.code.endsWith('.1')) {
    const baseCode = course.code.slice(0, -2);
    return eligibleMap.get(baseCode) ?? null;
  }
  const labCode = `${course.code}.1`;
  if (eligibleMap.has(labCode)) {
    return eligibleMap.get(labCode) ?? null;
  }
  for (const coCode of course.corequisites) {
    if (eligibleMap.has(coCode)) {
      return eligibleMap.get(coCode) ?? null;
    }
  }
  return null;
}

/**
 * Builds a transparent human-readable placement explanation for a scheduled course.
 */
function buildPlacementReason(
  course: CurriculumCourse,
  satisfiedPrerequisites: string[],
  unlocksCourseCodes: string[],
  pairedCode: string | null,
  creditLimit: number
): string {
  const parts: string[] = [];

  if (satisfiedPrerequisites.length > 0) {
    parts.push(`Prerequisites satisfied (${satisfiedPrerequisites.join(', ')})`);
  } else {
    parts.push('No pending prerequisites');
  }

  if (pairedCode) {
    parts.push(`paired with ${pairedCode}`);
  }

  if (unlocksCourseCodes.length > 0) {
    parts.push(`unlocks ${unlocksCourseCodes.slice(0, 3).join(', ')}`);
  } else if (course.year && course.term) {
    parts.push(
      `scheduled for ${formatSemesterTitle(course.year, course.term)} within ${creditLimit}-unit limit`
    );
  }

  return `${parts.join(' · ')}.`;
}

/**
 * Selects eligible courses for a single semester up to `creditLimit`, preserving
 * curriculum table priority, topological order, and lecture/lab corequisite pairing.
 */
function selectCoursesForSemester(
  curriculum: Curriculum,
  completedSet: ReadonlySet<string>,
  targetYear: YearLevel,
  targetTerm: Term,
  creditLimit: number,
  confidenceRatings: Record<ConfidenceArea, number>
): ScheduledCourseItem[] {
  const backward = runBackwardChaining(curriculum, completedSet);
  const topo = runTopologicalSort(backward.remainingRequiredCourses);

  const curriculumIndexMap = new Map<string, number>();
  curriculum.courses.forEach((c, idx) => {
    curriculumIndexMap.set(c.code, idx);
  });

  // Eligible credit-bearing courses
  const eligibleCreditCourses = backward.eligibleNowCourses.filter(
    (c) => c.creditBearing && c.units > 0
  );

  // Strictly respect semester offering availability (FIRST, SECOND, SUMMER)
  const candidates = eligibleCreditCourses.filter(
    (c) => !c.term || c.term === targetTerm
  );

  // Sort candidates by:
  // 1. Exact match with target (year, term) first
  // 2. Catch-up courses from earlier years (course.year < targetYear)
  // 3. Matching term offering (FIRST vs SECOND)
  // 4. Curriculum table definition order (preserves official syllabus grouping)
  const prioritized = [...candidates].sort((a, b) => {
    const aExactSlot = a.year === targetYear && a.term === targetTerm ? 0 : 1;
    const bExactSlot = b.year === targetYear && b.term === targetTerm ? 0 : 1;
    if (aExactSlot !== bExactSlot) {
      return aExactSlot - bExactSlot;
    }

    const aYear = a.year ?? 4;
    const bYear = b.year ?? 4;
    if (aYear !== bYear) {
      return aYear - bYear;
    }

    const aSameTerm = a.term === targetTerm ? 0 : 1;
    const bSameTerm = b.term === targetTerm ? 0 : 1;
    if (aSameTerm !== bSameTerm) {
      return aSameTerm - bSameTerm;
    }

    return (curriculumIndexMap.get(a.code) ?? 0) - (curriculumIndexMap.get(b.code) ?? 0);
  });

  const eligibleMap = new Map<string, CurriculumCourse>();
  for (const c of prioritized) {
    eligibleMap.set(c.code, c);
  }

  const selected: ScheduledCourseItem[] = [];
  const selectedCodes = new Set<string>();
  let currentUnits = 0;

  const smcOptions = curriculum.courses.filter((c) => c.kind === 'SMC_OPTION');

  for (const course of prioritized) {
    if (selectedCodes.has(course.code)) {
      continue;
    }

    // Ensure all known corequisites are either completed, already selected, or eligible now
    const hasUnsatisfiedCoreq = course.corequisites.some(
      (coCode) =>
        curriculumIndexMap.has(coCode) &&
        !completedSet.has(coCode) &&
        !selectedCodes.has(coCode) &&
        !eligibleMap.has(coCode)
    );
    if (hasUnsatisfiedCoreq) {
      continue;
    }

    // Ensure SMC slots are only scheduled when at least one Specialized Major option is eligible
    if (course.kind === 'SMC_SLOT' && smcOptions.length > 0) {
      const anyOptionEligible = smcOptions.some((opt) =>
        opt.prerequisites
          .filter((p) => curriculumIndexMap.has(p))
          .every((p) => completedSet.has(p))
      );
      if (!anyOptionEligible) {
        continue;
      }
    }

    const companion = findPairedLabOrLectureCode(course, eligibleMap);
    const companionUnselected =
      companion && !selectedCodes.has(companion.code) ? companion : null;

    const bundleUnits = course.units + (companionUnselected ? companionUnselected.units : 0);

    if (currentUnits + bundleUnits <= creditLimit) {
      const courseAnalysis = backward.analysisByCourse[course.code];
      const unlocks = courseAnalysis?.unlocksCourses ?? [];
      const satisfied = courseAnalysis?.satisfiedPrerequisites ?? [];
      const subjectArea = getCourseConfidenceArea(course);
      const difficultyScore = estimateCourseDifficulty(course);
      const confScore = confidenceRatings[subjectArea] ?? 5;
      const singleEval = evaluateMamdaniInference(confScore, difficultyScore);

      selected.push({
        course,
        tier: topo.courseTierMap[course.code] ?? 0,
        subjectArea,
        difficultyScore,
        courseStressScore: singleEval.stressScore,
        courseStressLabel: getStressLevelLabel(singleEval.stressScore),
        unlocksCourseCodes: unlocks,
        reason: buildPlacementReason(
          course,
          satisfied,
          unlocks,
          companionUnselected?.code ?? null,
          creditLimit
        ),
      });
      selectedCodes.add(course.code);
      currentUnits += course.units;

      if (companionUnselected) {
        const compAnalysis = backward.analysisByCourse[companionUnselected.code];
        const compUnlocks = compAnalysis?.unlocksCourses ?? [];
        const compSatisfied = compAnalysis?.satisfiedPrerequisites ?? [];
        const compArea = getCourseConfidenceArea(companionUnselected);
        const compDiff = estimateCourseDifficulty(companionUnselected);
        const compConf = confidenceRatings[compArea] ?? 5;
        const compEval = evaluateMamdaniInference(compConf, compDiff);

        selected.push({
          course: companionUnselected,
          tier: topo.courseTierMap[companionUnselected.code] ?? 0,
          subjectArea: compArea,
          difficultyScore: compDiff,
          courseStressScore: compEval.stressScore,
          courseStressLabel: getStressLevelLabel(compEval.stressScore),
          unlocksCourseCodes: compUnlocks,
          reason: buildPlacementReason(
            companionUnselected,
            compSatisfied,
            compUnlocks,
            course.code,
            creditLimit
          ),
        });
        selectedCodes.add(companionUnselected.code);
        currentUnits += companionUnselected.units;
      }
    }
  }

  return selected;
}

/**
 * Generates the student's Next-Semester Recommended Schedule and full Multi-Semester Roadmap
 * using Backward Chaining, Topological Sorting, and Mamdani Fuzzy Workload Analysis.
 */
export function generateAcademicSchedulePlan(
  curriculum: Curriculum,
  completedCourseCodesInput: Iterable<string>,
  options: ScheduleGeneratorOptions
): GeneratedAcademicPlan {
  const completedSet = new Set(completedCourseCodesInput);

  // Calculate overall degree completion percentage
  const degreeCourses = curriculum.courses.filter(
    (c) => (c.kind === 'REGULAR' || c.kind === 'SMC_SLOT') && c.creditBearing
  );
  const totalDegreeUnits = curriculum.grandTotalUnits;
  const completedUnits = degreeCourses
    .filter((c) => completedSet.has(c.code))
    .reduce((sum, c) => sum + c.units, 0);

  const completionPercentage = Math.min(
    100,
    Math.round((completedUnits / totalDegreeUnits) * 100)
  );

  // Step 1: Identify starting (year, term) slot
  const nextSlot = resolveNextSemesterSlot(
    curriculum,
    completedSet,
    options.currentYearLevel ?? 2,
    options.currentSemester ?? 'FIRST'
  );

  // Step 2: Gather candidate courses for the next semester to feed Mamdani Fuzzy Engine
  const backwardInitial = runBackwardChaining(curriculum, completedSet);
  const slotCandidates = backwardInitial.remainingRequiredCourses.filter(
    (c) => c.creditBearing && c.year === nextSlot.year && c.term === nextSlot.term
  );
  const fuzzyCandidatePool =
    slotCandidates.length > 0
      ? slotCandidates
      : backwardInitial.eligibleNowCourses.filter((c) => c.creditBearing).slice(0, 6);

  const workloadAnalysis = runFuzzyWorkloadAnalysis(
    fuzzyCandidatePool,
    options.confidenceRatings
  );

  const nextTermCreditLimit =
    options.overrideCreditLimit ??
    (nextSlot.term === 'SUMMER' ? 3 : workloadAnalysis.recommendedUnits);

  // Step 3: Build the immediate Next Semester schedule (`11_Recommended_Schedule.png`)
  const nextSemesterCourses = selectCoursesForSemester(
    curriculum,
    completedSet,
    nextSlot.year,
    nextSlot.term,
    nextTermCreditLimit,
    options.confidenceRatings
  );
  const nextSemesterTotalUnits = nextSemesterCourses.reduce(
    (sum, item) => sum + item.course.units,
    0
  );

  const nextSemester: SemesterSchedulePlan = {
    semesterIndex: 1,
    year: nextSlot.year,
    term: nextSlot.term,
    semesterTitle: formatSemesterTitle(nextSlot.year, nextSlot.term),
    badgeLabel: 'Next Semester',
    recommendedUnitLimit: nextTermCreditLimit,
    totalUnits: nextSemesterTotalUnits,
    stressScore: workloadAnalysis.stressScore,
    courses: nextSemesterCourses,
  };

  // Step 4: Simulate full multi-semester roadmap until all degree-required courses are planned
  const simulatedCompleted = new Set(completedSet);
  for (const item of nextSemesterCourses) {
    simulatedCompleted.add(item.course.code);
  }
  // Also mark non-credit NSTP courses in completed slots if applicable
  for (const c of curriculum.courses) {
    if (!c.creditBearing && c.year === nextSlot.year && c.term === nextSlot.term) {
      simulatedCompleted.add(c.code);
    }
  }

  const semesters: SemesterSchedulePlan[] = [nextSemester];
  let currentSlotYear: YearLevel = nextSlot.year;
  let currentSlotTerm: Term = nextSlot.term;
  let emptySlotStreak = 0;
  let safetyCounter = 0;

  while (safetyCounter < 40) {
    safetyCounter += 1;
    const remainingCheck = runBackwardChaining(curriculum, simulatedCompleted);
    const remainingCreditCourses = remainingCheck.remainingRequiredCourses.filter(
      (c) => c.creditBearing && c.units > 0
    );

    if (remainingCreditCourses.length === 0) {
      break;
    }

    const hasEligibleSummer = remainingCheck.eligibleNowCourses.some(
      (c) => c.term === 'SUMMER' && c.creditBearing && c.units > 0
    );

    // Advance calendar slot: FIRST -> SECOND -> (SUMMER if eligible) -> next year FIRST
    if (currentSlotTerm === 'FIRST') {
      currentSlotTerm = 'SECOND';
    } else if (currentSlotTerm === 'SECOND') {
      if (hasEligibleSummer) {
        currentSlotTerm = 'SUMMER';
      } else {
        currentSlotYear = Math.min(4, currentSlotYear + 1) as YearLevel;
        currentSlotTerm = 'FIRST';
      }
    } else {
      currentSlotYear = Math.min(4, currentSlotYear + 1) as YearLevel;
      currentSlotTerm = 'FIRST';
    }

    const termUnitCap =
      currentSlotTerm === 'SUMMER' ? 3 : workloadAnalysis.recommendedUnits;
    const plannedCourses = selectCoursesForSemester(
      curriculum,
      simulatedCompleted,
      currentSlotYear,
      currentSlotTerm,
      termUnitCap,
      options.confidenceRatings
    );

    if (plannedCourses.length === 0) {
      emptySlotStreak += 1;
      if (emptySlotStreak >= 4) {
        break;
      }
      continue;
    }
    emptySlotStreak = 0;

    for (const item of plannedCourses) {
      simulatedCompleted.add(item.course.code);
    }

    const termFuzzy = runFuzzyWorkloadAnalysis(
      plannedCourses.map((p) => p.course),
      options.confidenceRatings
    );
    const totalUnits = plannedCourses.reduce((sum, item) => sum + item.course.units, 0);
    const semIdx = semesters.length + 1;

    semesters.push({
      semesterIndex: semIdx,
      year: currentSlotYear,
      term: currentSlotTerm,
      semesterTitle: formatSemesterTitle(currentSlotYear, currentSlotTerm),
      badgeLabel: `Semester ${semIdx}`,
      recommendedUnitLimit: termUnitCap,
      totalUnits,
      stressScore: termFuzzy.stressScore,
      courses: plannedCourses,
    });
  }

  // Count non-summer semesters remaining (or total semesters if only summer remains)
  const regularSemestersRemaining = semesters.filter((s) => s.term !== 'SUMMER').length;
  const semestersToGraduation =
    regularSemestersRemaining > 0 ? regularSemestersRemaining : semesters.length;

  const topoInitial = runTopologicalSort(backwardInitial.remainingRequiredCourses);
  const criticalPathLength = topoInitial.tiers.length;

  const targetYears = options.targetTimelineYears ?? 4;
  const currentYear = options.currentYearLevel ?? 2;
  const currentTermOffset = (options.currentSemester ?? 'FIRST') === 'SECOND' ? 1 : 2;
  const nominalRemainingTerms = Math.max(
    1,
    (targetYears - currentYear) * 2 + currentTermOffset
  );
  const isOnTrack = semestersToGraduation <= nominalRemainingTerms;

  const extendedTermReason =
    semestersToGraduation > nominalRemainingTerms || !isOnTrack
      ? `Extended Term Required: Prerequisite chain depth (${criticalPathLength} tiers) and ${
          totalDegreeUnits - completedUnits
        } remaining units require ${semestersToGraduation} regular semesters at a ${nextTermCreditLimit}-unit next-term limit.`
      : null;

  return {
    isValidDag: backwardInitial.isValidDag,
    cycles: backwardInitial.cycles,
    workloadAnalysis,
    nextSemester,
    semesters,
    semestersToGraduation,
    completionPercentage,
    completedUnits,
    totalDegreeUnits,
    isOnTrack,
    criticalPathLength,
    extendedTermReason,
  };
}
