import type { ConfidenceArea, CurriculumCourse } from '@/domain/curriculum/types';

export type ConfidenceTerm = 'LOW' | 'MEDIUM' | 'HIGH';
export type DifficultyTerm = 'EASY' | 'MODERATE' | 'HARD';
export type RiskOutputTerm = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
export type StressLevelLabel = 'Low' | 'Moderate' | 'High' | 'Very High';

export type FuzzyRuleProvenance = 'APPROVED_BY_FLOW_PDF' | 'PROVISIONAL_FALLBACK';
export type FuzzyRuleConnective = 'AND' | 'OR';

export interface FuzzyRule {
  id: string;
  confidence: ConfidenceTerm;
  difficulty: DifficultyTerm;
  connective?: FuzzyRuleConnective;
  outputRisk: RiskOutputTerm;
  provenance: FuzzyRuleProvenance;
  description: string;
}

export interface FiredFuzzyRule {
  rule: FuzzyRule;
  firingStrength: number;
}

export interface CourseDifficultyProfile {
  courseCode: string;
  subjectArea: ConfidenceArea;
  difficultyScore: number;
  studentConfidenceScore: number;
  courseStressScore: number;
  isHeuristicDifficulty: boolean;
}

export interface FuzzyWorkloadResult {
  effectiveConfidence: number;
  effectiveDifficulty: number;
  stressScore: number;
  stressLabel: StressLevelLabel;
  recommendedUnits: number;
  recommendedRange: { minUnits: number; maxUnits: number };
  confidenceMemberships: Record<ConfidenceTerm, number>;
  difficultyMemberships: Record<DifficultyTerm, number>;
  firedRules: FiredFuzzyRule[];
  courseProfiles: CourseDifficultyProfile[];
}

export const RECOMMENDED_UNIT_RANGE = {
  minUnits: 12,
  maxUnits: 18,
} as const;

export const MAMDANI_FUZZY_RULES: readonly FuzzyRule[] = [
  {
    id: 'R1',
    confidence: 'LOW',
    difficulty: 'HARD',
    outputRisk: 'VERY_HIGH',
    provenance: 'APPROVED_BY_FLOW_PDF',
    description: 'IF Confidence IS Low AND Difficulty IS Hard THEN Risk IS Very High',
  },
  {
    id: 'R2',
    confidence: 'HIGH',
    difficulty: 'MODERATE',
    outputRisk: 'LOW',
    provenance: 'APPROVED_BY_FLOW_PDF',
    description: 'IF Confidence IS High AND Difficulty IS Moderate THEN Risk IS Low',
  },
  {
    id: 'R3',
    confidence: 'LOW',
    difficulty: 'EASY',
    outputRisk: 'MODERATE',
    provenance: 'PROVISIONAL_FALLBACK',
    description: 'IF Confidence IS Low AND Difficulty IS Easy THEN Risk IS Moderate',
  },
  {
    id: 'R4',
    confidence: 'LOW',
    difficulty: 'MODERATE',
    outputRisk: 'HIGH',
    provenance: 'PROVISIONAL_FALLBACK',
    description: 'IF Confidence IS Low AND Difficulty IS Moderate THEN Risk IS High',
  },
  {
    id: 'R5',
    confidence: 'MEDIUM',
    difficulty: 'EASY',
    outputRisk: 'LOW',
    provenance: 'PROVISIONAL_FALLBACK',
    description: 'IF Confidence IS Medium AND Difficulty IS Easy THEN Risk IS Low',
  },
  {
    id: 'R6',
    confidence: 'MEDIUM',
    difficulty: 'MODERATE',
    outputRisk: 'MODERATE',
    provenance: 'PROVISIONAL_FALLBACK',
    description: 'IF Confidence IS Medium AND Difficulty IS Moderate THEN Risk IS Moderate',
  },
  {
    id: 'R7',
    confidence: 'MEDIUM',
    difficulty: 'HARD',
    outputRisk: 'HIGH',
    provenance: 'PROVISIONAL_FALLBACK',
    description: 'IF Confidence IS Medium AND Difficulty IS Hard THEN Risk IS High',
  },
  {
    id: 'R8',
    confidence: 'HIGH',
    difficulty: 'EASY',
    outputRisk: 'VERY_LOW',
    provenance: 'PROVISIONAL_FALLBACK',
    description: 'IF Confidence IS High AND Difficulty IS Easy THEN Risk IS Very Low',
  },
  {
    id: 'R9',
    confidence: 'HIGH',
    difficulty: 'HARD',
    outputRisk: 'MODERATE',
    provenance: 'PROVISIONAL_FALLBACK',
    description: 'IF Confidence IS High AND Difficulty IS Hard THEN Risk IS Moderate',
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function triangularMembership(x: number, a: number, b: number, c: number): number {
  if (x <= a || x >= c) {
    return 0;
  }
  if (x === b) {
    return 1;
  }
  if (x < b) {
    return (x - a) / (b - a);
  }
  return (c - x) / (c - b);
}

export function trapezoidalMembership(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  if (x >= b && x <= c) {
    return 1;
  }
  if (x < a || x > d) {
    return 0;
  }
  if (x < b) {
    return b === a ? 1 : (x - a) / (b - a);
  }
  return d === c ? 1 : (d - x) / (d - c);
}

export function fuzzifyConfidence(confidence: number): Record<ConfidenceTerm, number> {
  const c = clamp(confidence, 1, 10);
  return {
    LOW: Number(trapezoidalMembership(c, 1, 1, 3.5, 6.5).toFixed(4)),
    MEDIUM: Number(triangularMembership(c, 3.5, 7.0, 9.0).toFixed(4)),
    HIGH: Number(trapezoidalMembership(c, 7.5, 9.0, 10, 10).toFixed(4)),
  };
}

export function fuzzifyDifficulty(difficulty: number): Record<DifficultyTerm, number> {
  const d = clamp(difficulty, 1, 10);
  return {
    EASY: Number(trapezoidalMembership(d, 1, 1, 3.5, 5.5).toFixed(4)),
    MODERATE: Number(triangularMembership(d, 3.5, 6.3, 8.2).toFixed(4)),
    HARD: Number(trapezoidalMembership(d, 6.6, 8.2, 10, 10).toFixed(4)),
  };
}

export function evaluateRiskOutputMembership(term: RiskOutputTerm, x: number): number {
  switch (term) {
    case 'VERY_LOW':
      return trapezoidalMembership(x, 0, 0, 15, 30);
    case 'LOW':
      return triangularMembership(x, 16, 36, 54);
    case 'MODERATE':
      return triangularMembership(x, 36, 56, 76);
    case 'HIGH':
      return triangularMembership(x, 58, 76, 94);
    case 'VERY_HIGH':
      return trapezoidalMembership(x, 76, 90, 100, 100);
  }
}

export function getCourseConfidenceArea(course: CurriculumCourse): ConfidenceArea {
  const code = course.code.toUpperCase();
  if (code === 'GEC104' || code === 'AEC001') {
    return 'Mathematics';
  }
  if (
    code === 'AGR003' ||
    code === 'ANS191' ||
    code === 'ANS192' ||
    code === 'ANS194' ||
    code === 'ANS195' ||
    code === 'ANS199'
  ) {
    return 'Research';
  }
  if (
    code.startsWith('CHM') ||
    code.startsWith('GEN') ||
    code.startsWith('ABT') ||
    code === 'GEC108'
  ) {
    return 'Science';
  }
  if (code.startsWith('ANS') || code.startsWith('SMC')) {
    return 'Animal Science';
  }
  return 'Agriculture';
}

export function estimateCourseDifficulty(course: CurriculumCourse): number {
  let score = 4.5;

  if (course.year === 2) score += 0.8;
  if (course.year === 3) score += 1.5;
  if (course.year === 4) score += 2.0;

  if (course.labHours && course.labHours >= 3) {
    score += 0.9;
  }

  score += Math.min(1.8, course.prerequisites.length * 0.6);

  const area = getCourseConfidenceArea(course);
  if (area === 'Science' || area === 'Research') {
    score += 0.8;
  } else if (area === 'Animal Science' && (course.year ?? 1) >= 3) {
    score += 0.6;
  }

  return clamp(Number(score.toFixed(2)), 1, 10);
}

export function evaluateMamdaniInference(
  confidence: number,
  difficulty: number,
  rules: readonly FuzzyRule[] = MAMDANI_FUZZY_RULES
): {
  stressScore: number;
  confidenceMemberships: Record<ConfidenceTerm, number>;
  difficultyMemberships: Record<DifficultyTerm, number>;
  firedRules: FiredFuzzyRule[];
} {
  const confidenceMemberships = fuzzifyConfidence(confidence);
  const difficultyMemberships = fuzzifyDifficulty(difficulty);

  const firedRules: FiredFuzzyRule[] = [];
  for (const rule of rules) {
    const muConf = confidenceMemberships[rule.confidence];
    const muDiff = difficultyMemberships[rule.difficulty];
    const connective = rule.connective ?? 'AND';
    const rawStrength =
      connective === 'OR' ? Math.max(muConf, muDiff) : Math.min(muConf, muDiff);
    const firingStrength = Number(rawStrength.toFixed(4));
    if (firingStrength > 0) {
      firedRules.push({ rule, firingStrength });
    }
  }

  let numerator = 0;
  let denominator = 0;

  for (let x = 0; x <= 100; x += 1) {
    let aggregatedMu = 0;
    for (const fired of firedRules) {
      const clippedMu = Math.min(
        fired.firingStrength,
        evaluateRiskOutputMembership(fired.rule.outputRisk, x)
      );
      if (clippedMu > aggregatedMu) {
        aggregatedMu = clippedMu;
      }
    }
    numerator += x * aggregatedMu;
    denominator += aggregatedMu;
  }

  const rawCentroid = denominator > 0 ? numerator / denominator : 50;
  const stressScore = clamp(Math.round(rawCentroid), 0, 100);

  return {
    stressScore,
    confidenceMemberships,
    difficultyMemberships,
    firedRules,
  };
}

export function getStressLevelLabel(stressScore: number): StressLevelLabel {
  if (stressScore < 40) {
    return 'Low';
  }
  if (stressScore <= 68) {
    return 'Moderate';
  }
  if (stressScore <= 84) {
    return 'High';
  }
  return 'Very High';
}

export function computeRecommendedCreditLimit(stressScore: number): number {
  if (stressScore < 40) {
    return 18;
  }
  if (stressScore <= 68) {
    return 15;
  }
  return 12;
}

export function runFuzzyWorkloadAnalysis(
  candidateCourses: CurriculumCourse[],
  confidenceRatings: Record<ConfidenceArea, number>,
  difficultyOverrides: Record<string, number> = {}
): FuzzyWorkloadResult {
  const creditCourses = candidateCourses.filter((c) => c.creditBearing && c.units > 0);

  const courseProfiles: CourseDifficultyProfile[] = creditCourses.map((course) => {
    const subjectArea = getCourseConfidenceArea(course);
    const hasOverride = Object.prototype.hasOwnProperty.call(
      difficultyOverrides,
      course.code
    );
    const difficultyScore = hasOverride
      ? clamp(difficultyOverrides[course.code], 1, 10)
      : estimateCourseDifficulty(course);
    const studentConfidenceScore = clamp(confidenceRatings[subjectArea] ?? 5, 1, 10);
    const singleEval = evaluateMamdaniInference(studentConfidenceScore, difficultyScore);

    return {
      courseCode: course.code,
      subjectArea,
      difficultyScore,
      studentConfidenceScore,
      courseStressScore: singleEval.stressScore,
      isHeuristicDifficulty: !hasOverride,
    };
  });

  let weightedConfidenceSum = 0;
  let weightedDifficultySum = 0;
  let totalUnits = 0;

  for (let i = 0; i < creditCourses.length; i++) {
    const units = creditCourses[i].units;
    const profile = courseProfiles[i];
    weightedConfidenceSum += profile.studentConfidenceScore * units;
    weightedDifficultySum += profile.difficultyScore * units;
    totalUnits += units;
  }

  const allRatingValues = Object.values(confidenceRatings);
  const fallbackAvgConfidence =
    allRatingValues.length > 0
      ? allRatingValues.reduce((sum, v) => sum + v, 0) / allRatingValues.length
      : 5;

  const effectiveConfidence =
    totalUnits > 0
      ? Number((weightedConfidenceSum / totalUnits).toFixed(2))
      : Number(fallbackAvgConfidence.toFixed(2));

  const effectiveDifficulty =
    totalUnits > 0 ? Number((weightedDifficultySum / totalUnits).toFixed(2)) : 5.6;

  const mamdani = evaluateMamdaniInference(effectiveConfidence, effectiveDifficulty);
  const stressLabel = getStressLevelLabel(mamdani.stressScore);
  const recommendedUnits = computeRecommendedCreditLimit(mamdani.stressScore);

  return {
    effectiveConfidence,
    effectiveDifficulty,
    stressScore: mamdani.stressScore,
    stressLabel,
    recommendedUnits,
    recommendedRange: RECOMMENDED_UNIT_RANGE,
    confidenceMemberships: mamdani.confidenceMemberships,
    difficultyMemberships: mamdani.difficultyMemberships,
    firedRules: mamdani.firedRules,
    courseProfiles,
  };
}
