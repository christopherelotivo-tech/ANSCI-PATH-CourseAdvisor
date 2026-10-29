/**
 * CORE ALGORITHM AUDIT — Focused verification tests (see docs/CORE_ALGORITHM_AUDIT.md)
 *
 * These tests verify behaviour against SystemArchitecture.pdf (Sec 3.1, 3.2, 9, 10) and
 * Flow.pdf (Stages 6–12). Reference values for the fuzzy engine are computed INDEPENDENTLY
 * in this file (own membership functions + fine-grained numerical integration) rather than
 * by calling the engine under test.
 *
 * Tests named "KNOWN DEFECT" use `test.failing`: they encode the CORRECT expected behaviour,
 * currently fail, and therefore pass as `failing`. When the defect is fixed, Jest will report
 * them as unexpectedly passing — convert them to normal `test` at that point.
 */
import { runBackwardChaining } from "@/domain/algorithms/backward-chaining";
import { validateCurriculumDag } from "@/domain/algorithms/dag-validator";
import {
  computeRecommendedCreditLimit,
  evaluateMamdaniInference,
  fuzzifyConfidence,
  fuzzifyDifficulty,
  MAMDANI_FUZZY_RULES,
  runFuzzyWorkloadAnalysis,
} from "@/domain/algorithms/fuzzy-workload";
import {
  generateAcademicSchedulePlan,
  type GeneratedAcademicPlan,
} from "@/domain/algorithms/schedule-generator";
import { runTopologicalSort } from "@/domain/algorithms/topological-sort";
import { ANSCI_CURRICULUM } from "@/domain/curriculum/ansci-curriculum";
import type {
  ConfidenceArea,
  Curriculum,
  CurriculumCourse,
  Term,
  YearLevel,
} from "@/domain/curriculum/types";

// ─────────────────────────── helpers ───────────────────────────

function mk(
  code: string,
  pre: string[] = [],
  opts: Partial<CurriculumCourse> = {},
): CurriculumCourse {
  return {
    code,
    title: `Synthetic ${code}`,
    units: 3,
    creditBearing: true,
    lecHours: 3,
    labHours: 0,
    year: 1,
    term: "FIRST",
    kind: "REGULAR",
    prerequisites: pre,
    standingRequirements: [],
    corequisites: [],
    ...opts,
  };
}

function curriculumOf(courses: CurriculumCourse[]): Curriculum {
  return {
    ...ANSCI_CURRICULUM,
    programCode: "TEST",
    courses,
    termTotals: [],
    grandTotalUnits: courses.reduce(
      (s, c) => s + (c.creditBearing ? c.units : 0),
      0,
    ),
  };
}

const codesOf = (cs: { code: string }[]) => cs.map((c) => c.code).sort();

const ALL = (v: number): Record<ConfidenceArea, number> => ({
  Mathematics: v,
  Science: v,
  Agriculture: v,
  "Animal Science": v,
  Research: v,
});

const DEFAULT_CONF: Record<ConfidenceArea, number> = {
  Mathematics: 7,
  Science: 7,
  Agriculture: 8,
  "Animal Science": 5,
  Research: 6,
};

const codesWhere = (pred: (c: CurriculumCourse) => boolean) =>
  ANSCI_CURRICULUM.courses.filter(pred).map((c) => c.code);

const YEAR1 = codesWhere((c) => c.year === 1);
const YEAR12 = codesWhere((c) => c.year === 1 || c.year === 2);
const YEAR123 = codesWhere((c) => c.year !== null && c.year <= 3);

// ── Independent fuzzy reference implementation (parameters copied from fuzzy-workload.ts) ──
function tri(x: number, a: number, b: number, c: number) {
  if (x <= a || x >= c) return 0;
  return x <= b ? (x - a) / (b - a) : (c - x) / (c - b);
}
function trap(x: number, a: number, b: number, c: number, d: number) {
  if (x >= b && x <= c) return 1;
  if (x < a || x > d) return 0;
  return x < b ? (x - a) / (b - a) : (d - x) / (d - c);
}
const OUT: Record<string, (x: number) => number> = {
  VERY_LOW: (x) => trap(x, 0, 0, 15, 30),
  LOW: (x) => tri(x, 16, 36, 54),
  MODERATE: (x) => tri(x, 36, 56, 76),
  HIGH: (x) => tri(x, 58, 76, 94),
  VERY_HIGH: (x) => trap(x, 76, 90, 100, 100),
};
/** Fine midpoint-rule centroid (step 0.01) of max-aggregated, min-clipped output sets. */
function referenceCentroid(
  fired: { term: string; strength: number }[],
): number | null {
  let num = 0;
  let den = 0;
  const h = 0.01;
  for (let x = h / 2; x < 100; x += h) {
    let mu = 0;
    for (const f of fired)
      mu = Math.max(mu, Math.min(f.strength, OUT[f.term](x)));
    num += x * mu * h;
    den += mu * h;
  }
  return den > 0 ? num / den : null;
}

// ── Scheduler invariant checker ──
interface Profile {
  name: string;
  completed: string[];
  year: YearLevel;
  term: Term;
  conf: Record<ConfidenceArea, number>;
  target?: 4 | 5 | 6;
}

const PROFILES: Profile[] = [
  {
    name: "fresh Y1S1",
    completed: [],
    year: 1,
    term: "FIRST",
    conf: DEFAULT_CONF,
  },
  {
    name: "app default (Y2S1, 0 completed)",
    completed: [],
    year: 2,
    term: "FIRST",
    conf: DEFAULT_CONF,
  },
  {
    name: "Y1 done -> Y2S1 (screenshot)",
    completed: YEAR1,
    year: 2,
    term: "FIRST",
    conf: DEFAULT_CONF,
  },
  {
    name: "Y1 done, low confidence",
    completed: YEAR1,
    year: 2,
    term: "FIRST",
    conf: ALL(1),
  },
  {
    name: "Y1 done, high confidence",
    completed: YEAR1,
    year: 2,
    term: "FIRST",
    conf: ALL(10),
  },
  {
    name: "Y1+Y2 done -> Y3S1",
    completed: YEAR12,
    year: 3,
    term: "FIRST",
    conf: DEFAULT_CONF,
  },
  {
    name: "Y1-Y3 done -> Y4S1",
    completed: YEAR123,
    year: 4,
    term: "FIRST",
    conf: DEFAULT_CONF,
  },
  {
    name: "Y1S1 only -> Y1S2",
    completed: codesWhere((c) => c.year === 1 && c.term === "FIRST"),
    year: 1,
    term: "SECOND",
    conf: DEFAULT_CONF,
  },
];

function planFor(p: Profile): GeneratedAcademicPlan {
  return generateAcademicSchedulePlan(ANSCI_CURRICULUM, p.completed, {
    currentYearLevel: p.year,
    currentSemester: p.term,
    targetTimelineYears: p.target ?? 4,
    confidenceRatings: p.conf,
  });
}

const CATALOG = new Map(ANSCI_CURRICULUM.courses.map((c) => [c.code, c]));
const CAS_REQUIRED = codesWhere(
  (c) =>
    c.kind === "REGULAR" && c.creditBearing && (c.year === 1 || c.year === 2),
);

function checkInvariants(p: Profile) {
  const plan = planFor(p);
  const done = new Set(p.completed);
  const v = {
    recommendedCompleted: [] as string[],
    prereqViolations: [] as string[],
    casViolations: [] as string[],
    coreqViolations: [] as string[],
    termMismatches: [] as string[],
    overCreditLimit: [] as string[],
    duplicates: [] as string[],
    missingFromRoadmap: [] as string[],
  };
  const seen = new Set<string>();
  for (const sem of plan.semesters) {
    const thisSem = new Set(sem.courses.map((i) => i.course.code));
    if (sem.totalUnits > sem.recommendedUnitLimit) {
      v.overCreditLimit.push(
        `${sem.semesterTitle}: ${sem.totalUnits} > ${sem.recommendedUnitLimit}`,
      );
    }
    for (const { course } of sem.courses) {
      if (p.completed.includes(course.code))
        v.recommendedCompleted.push(course.code);
      if (seen.has(course.code)) v.duplicates.push(course.code);
      for (const pre of course.prerequisites) {
        if (CATALOG.has(pre) && !done.has(pre)) {
          v.prereqViolations.push(
            `${course.code}<-${pre} @${sem.semesterTitle}`,
          );
        }
      }
      for (const co of course.corequisites) {
        if (CATALOG.has(co) && !done.has(co) && !thisSem.has(co)) {
          v.coreqViolations.push(`${course.code}~${co} @${sem.semesterTitle}`);
        }
      }
      if (course.standingRequirements.includes("CAS")) {
        const missing = CAS_REQUIRED.filter((c) => !done.has(c));
        if (missing.length)
          v.casViolations.push(`${course.code} @${sem.semesterTitle}`);
      }
      if (course.term && course.term !== sem.term) {
        v.termMismatches.push(
          `${course.code}(${course.term}) in ${sem.semesterTitle}`,
        );
      }
    }
    for (const c of thisSem) {
      seen.add(c);
      done.add(c);
    }
  }
  const required = codesWhere(
    (c) =>
      (c.kind === "REGULAR" || c.kind === "SMC_SLOT") &&
      c.creditBearing &&
      c.units > 0 &&
      !p.completed.includes(c.code),
  );
  v.missingFromRoadmap = required.filter((c) => !seen.has(c));
  return { plan, v };
}

// ═════════════════════════════ 1. BACKWARD CHAINING ═════════════════════════════

describe("AUDIT 1 — Backward Chaining", () => {
  test("ANS040 already completed: status COMPLETED, excluded from remaining and from every scheduled semester", () => {
    const completed = [...YEAR12, "ANS040"];
    const r = runBackwardChaining(ANSCI_CURRICULUM, completed);
    expect(r.analysisByCourse.ANS040.status).toBe("COMPLETED");
    expect(codesOf(r.remainingRequiredCourses)).not.toContain("ANS040");
    const plan = generateAcademicSchedulePlan(ANSCI_CURRICULUM, completed, {
      currentYearLevel: 3,
      currentSemester: "FIRST",
      confidenceRatings: DEFAULT_CONF,
    });
    const scheduled = plan.semesters.flatMap((s) =>
      s.courses.map((i) => i.course.code),
    );
    expect(scheduled).not.toContain("ANS040");
  });

  test("goal-driven traversal: target ANS199 pulls ANS195 -> ANS194 -> CAS (all Y1/Y2), but not unrelated ANS040", () => {
    const r = runBackwardChaining(ANSCI_CURRICULUM, [], {
      targetCourseCodes: ["ANS199"],
    });
    const rem = codesOf(r.remainingRequiredCourses);
    expect(rem).toEqual(
      expect.arrayContaining([
        "ANS199",
        "ANS195",
        "ANS194",
        "AGR001",
        "GEN001",
      ]),
    );
    expect(rem).not.toContain("ANS040");
    expect(rem).not.toContain("ANS197");
  });

  test("completed intermediate node prunes its ancestors (D<-C<-B<-A, B completed => remaining {C, D})", () => {
    const cur = curriculumOf([
      mk("A"),
      mk("B", ["A"]),
      mk("C", ["B"]),
      mk("D", ["C"]),
    ]);
    const r = runBackwardChaining(cur, ["B"], { targetCourseCodes: ["D"] });
    expect(codesOf(r.remainingRequiredCourses)).toEqual(["C", "D"]);
    expect(codesOf(r.eligibleNowCourses)).toEqual(["C"]);
  });

  test("diamond graph: shared prerequisite visited once, multiple prerequisites all reported", () => {
    const cur = curriculumOf([
      mk("A"),
      mk("B", ["A"]),
      mk("C", ["A"]),
      mk("D", ["B", "C"]),
    ]);
    const r = runBackwardChaining(cur, [], { targetCourseCodes: ["D"] });
    expect(
      r.remainingRequiredCourses.map((c) => c.code).filter((c) => c === "A"),
    ).toHaveLength(1);
    expect(r.analysisByCourse.D.missingPrerequisites.sort()).toEqual([
      "B",
      "C",
    ]);
    expect(r.analysisByCourse.D.allMissingPrerequisiteChain.sort()).toEqual([
      "A",
      "B",
      "C",
    ]);
  });

  test("unknown target / unknown completed codes are ignored safely (no throw, no phantom courses)", () => {
    const r = runBackwardChaining(ANSCI_CURRICULUM, ["ZZZ999"], {
      targetCourseCodes: ["NOPE"],
    });
    expect(r.remainingRequiredCourses).toHaveLength(0);
    expect(r.completedCourseCodes).not.toContain("ZZZ999");
  });

  test("FINDING: unresolved source prerequisites (AGF101/AGF102) do NOT block — ANS042/043/044 are ELIGIBLE_NOW with nothing completed", () => {
    const r = runBackwardChaining(ANSCI_CURRICULUM, []);
    for (const code of ["ANS042", "ANS043", "ANS044"]) {
      expect(r.analysisByCourse[code].status).toBe("ELIGIBLE_NOW");
      expect(
        r.analysisByCourse[code].unresolvedPrerequisites.length,
      ).toBeGreaterThan(0);
    }
  });

  test('FINDING: with the app\'s default goal (Complete Program) the result equals a plain "uncompleted degree courses" filter', () => {
    const completed = YEAR1;
    const r = runBackwardChaining(ANSCI_CURRICULUM, completed);
    const filtered = codesWhere(
      (c) =>
        (c.kind === "REGULAR" || c.kind === "SMC_SLOT") &&
        !completed.includes(c.code),
    ).sort();
    expect(codesOf(r.remainingRequiredCourses)).toEqual(filtered);
  });

  test("FINDING: a cyclic curriculum does not halt backward chaining — cycle members are merely BLOCKED", () => {
    const cur = curriculumOf([mk("A", ["B"]), mk("B", ["A"]), mk("C")]);
    const r = runBackwardChaining(cur, []);
    expect(r.isValidDag).toBe(false);
    expect(r.analysisByCourse.A.status).toBe("BLOCKED");
    expect(codesOf(r.eligibleNowCourses)).toEqual(["C"]);
  });
});

// ═════════════════════════════ 2. DAG & TOPOLOGICAL SORT ═════════════════════════════

describe("AUDIT 2 — DAG validation & topological ordering", () => {
  test("linear chain A<-B<-C<-D: tiers 0..3, critical path length 4", () => {
    const t = runTopologicalSort([
      mk("D", ["C"]),
      mk("C", ["B"]),
      mk("B", ["A"]),
      mk("A"),
    ]);
    expect(t.courseTierMap).toEqual({ A: 0, B: 1, C: 2, D: 3 });
    expect(t.orderedCourseCodes).toEqual(["A", "B", "C", "D"]);
    expect(t.criticalPathCourseCodes).toEqual(["A", "B", "C", "D"]);
  });

  test("branching + multiple prerequisites use longest-path tiering (E needs A[0] and D[2] => tier 3)", () => {
    const t = runTopologicalSort([
      mk("A"),
      mk("B", ["A"]),
      mk("C", ["A"]),
      mk("D", ["B", "C"]),
      mk("E", ["A", "D"]),
    ]);
    expect(t.courseTierMap).toEqual({ A: 0, B: 1, C: 1, D: 2, E: 3 });
  });

  test("independent courses are all tier 0", () => {
    const t = runTopologicalSort([mk("X"), mk("Y"), mk("Z")]);
    expect(t.tiers).toHaveLength(1);
    expect(codesOf(t.tiers[0].courses)).toEqual(["X", "Y", "Z"]);
  });

  test("self-loop and 2-node cycles are detected", () => {
    expect(validateCurriculumDag([mk("A", ["A"])]).cycles).toEqual([
      ["A", "A"],
    ]);
    const two = validateCurriculumDag([mk("A", ["B"]), mk("B", ["A"])]);
    expect(two.isValidDag).toBe(false);
    expect(two.cycles[0]).toEqual(["A", "B", "A"]);
  });

  test("invalid reference is reported as a warning and treated as satisfied; duplicate edges are de-duplicated", () => {
    const v = validateCurriculumDag([mk("X", ["NOPE"]), mk("Y", ["X", "X"])]);
    expect(v.isValidDag).toBe(true);
    expect(
      v.unresolvedWarnings.map((w) => w.unresolvedPrerequisiteCode),
    ).toEqual(["NOPE"]);
    expect(v.graph.courseToPrerequisites.get("Y")).toEqual(["X"]);
    expect(runTopologicalSort([mk("X", ["NOPE"])]).courseTierMap.X).toBe(0);
  });

  test("graph direction is consistent: dependents map is the exact inverse of prerequisites map (official curriculum)", () => {
    const g = validateCurriculumDag(ANSCI_CURRICULUM.courses).graph;
    for (const [course, pres] of g.courseToPrerequisites) {
      for (const p of pres)
        expect(g.prerequisiteToDependents.get(p)).toContain(course);
    }
    for (const [p, deps] of g.prerequisiteToDependents) {
      for (const d of deps) expect(g.courseToPrerequisites.get(d)).toContain(p);
    }
  });

  test("official curriculum (no completions): 0 cycles and topological order respects every edge", () => {
    const r = runBackwardChaining(ANSCI_CURRICULUM, []);
    const t = runTopologicalSort(r.remainingRequiredCourses);
    expect(t.isAcyclic).toBe(true);
    const pos = new Map(t.orderedCourseCodes.map((c, i) => [c, i]));
    for (const c of r.remainingRequiredCourses) {
      for (const p of c.prerequisites) {
        if (pos.has(p)) expect(pos.get(p)!).toBeLessThan(pos.get(c.code)!);
      }
    }
  });

  test("iterative DFS cycle detector is stack-safe — does not overflow on a 20,000-node chain", () => {
    const chain: CurriculumCourse[] = [mk("N0")];
    for (let i = 1; i < 20000; i++) chain.push(mk(`N${i}`, [`N${i - 1}`]));
    expect(() => validateCurriculumDag(chain.slice().reverse())).not.toThrow();
  });
});

// ═════════════════════════════ 3. MAMDANI FIS ═════════════════════════════

describe("AUDIT 3 — Mamdani Fuzzy Inference System", () => {
  test("fuzzification matches hand-calculated membership values", () => {
    const c = fuzzifyConfidence(5);
    expect(c.LOW).toBeCloseTo(0.5, 4); // (6.5-5)/3
    expect(c.MEDIUM).toBeCloseTo(0.4286, 4); // (5-3.5)/3.5
    expect(c.HIGH).toBe(0);
    const d = fuzzifyDifficulty(7.4);
    expect(d.EASY).toBe(0);
    expect(d.MODERATE).toBeCloseTo(0.4211, 4); // (8.2-7.4)/1.9
    expect(d.HARD).toBeCloseTo(0.5, 4); // (7.4-6.6)/1.6
  });

  test("rule activation uses AND = min; overlapping HIGH outputs (R4, R7) aggregated with max", () => {
    const e = evaluateMamdaniInference(5, 7.4);
    const s = Object.fromEntries(
      e.firedRules.map((f) => [f.rule.id, f.firingStrength]),
    );
    expect(s).toEqual({ R1: 0.5, R4: 0.4211, R6: 0.4211, R7: 0.4286 });
  });

  test("R1 isolated (C=1, D=10): engine centroid matches independent integration (91.02) within 1 point", () => {
    const e = evaluateMamdaniInference(1, 10);
    expect(e.firedRules.map((f) => f.rule.id)).toEqual(["R1"]);
    const ref = referenceCentroid([{ term: "VERY_HIGH", strength: 1 }])!;
    expect(ref).toBeCloseTo(91.02, 1);
    expect(Math.abs(e.stressScore - ref)).toBeLessThanOrEqual(1);
    expect(computeRecommendedCreditLimit(e.stressScore)).toBe(12);
  });

  test("R2 isolated (C=10, D=6.3): engine centroid matches independent integration (35.33) within 1 point", () => {
    const e = evaluateMamdaniInference(10, 6.3);
    expect(e.firedRules.map((f) => f.rule.id)).toEqual(["R2"]);
    const ref = referenceCentroid([{ term: "LOW", strength: 1 }])!;
    expect(ref).toBeCloseTo(35.33, 1);
    expect(Math.abs(e.stressScore - ref)).toBeLessThanOrEqual(1);
  });

  test("centroid discretisation error vs independent integration is <= 1 point over the full input grid (1..10 step 0.5)", () => {
    let maxErr = 0;
    for (let c = 1; c <= 10; c += 0.5) {
      for (let d = 1; d <= 10; d += 0.5) {
        const e = evaluateMamdaniInference(c, d);
        const ref = referenceCentroid(
          e.firedRules.map((f) => ({
            term: f.rule.outputRisk,
            strength: f.firingStrength,
          })),
        )!;
        maxErr = Math.max(maxErr, Math.abs(e.stressScore - ref));
      }
    }
    expect(maxErr).toBeLessThanOrEqual(1);
  });

  test("FINDING: with ONLY the 2 documented rules, most inputs fire nothing and the engine returns a fabricated 50%", () => {
    const approved = MAMDANI_FUZZY_RULES.filter(
      (r) => r.provenance === "APPROVED_BY_FLOW_PDF",
    );
    const e = evaluateMamdaniInference(5, 2, approved);
    expect(e.firedRules).toHaveLength(0);
    expect(e.stressScore).toBe(50);
    let silent = 0;
    let total = 0;
    for (let c = 1; c <= 10; c += 0.5) {
      for (let d = 1; d <= 10; d += 0.5) {
        total++;
        if (evaluateMamdaniInference(c, d, approved).firedRules.length === 0)
          silent++;
      }
    }
    expect(silent / total).toBeGreaterThan(0.5);
  });

  test("FINDING: the default-profile 56% is produced solely by provisional rule R6, whose output set is centred at 56", () => {
    const y2s1 = ANSCI_CURRICULUM.courses.filter(
      (c) => c.year === 2 && c.term === "FIRST",
    );
    const w = runFuzzyWorkloadAnalysis(y2s1, DEFAULT_CONF);
    expect(w.firedRules.map((f) => f.rule.id)).toEqual(["R6"]);
    expect(w.firedRules[0].rule.provenance).toBe("PROVISIONAL_FALLBACK");
    // Plateau: any C in [6.5,7.5] x D in [5.5,6.6] yields exactly 56
    for (const c of [6.5, 6.8, 7.2, 7.5]) {
      for (const d of [5.5, 5.9, 6.3, 6.6])
        expect(evaluateMamdaniInference(c, d).stressScore).toBe(56);
    }
  });

  test("FINDING: credit recommendation is a 3-step threshold map — only {12, 15, 18} are reachable (spec example: 14)", () => {
    const reachable = new Set<number>();
    for (let c = 1; c <= 10; c += 0.25) {
      for (let d = 1; d <= 10; d += 0.25) {
        reachable.add(
          computeRecommendedCreditLimit(
            evaluateMamdaniInference(c, d).stressScore,
          ),
        );
      }
    }
    expect([...reachable].sort()).toEqual([12, 15, 18]);
  });

  test("FINDING: semester stress is independent of credit load (3 units vs 21 units of the same course => identical stress)", () => {
    const ans041 = ANSCI_CURRICULUM.courses.find((c) => c.code === "ANS041")!;
    const light = runFuzzyWorkloadAnalysis([ans041], DEFAULT_CONF);
    const heavy = runFuzzyWorkloadAnalysis(Array(7).fill(ans041), DEFAULT_CONF);
    expect(heavy.stressScore).toBe(light.stressScore);
  });

  test("evaluates both AND (min) and OR (max) connective rules per SystemArchitecture.pdf Sec 3.2", () => {
    const orRule = {
      id: "R_OR",
      confidence: "LOW" as const,
      difficulty: "HARD" as const,
      connective: "OR" as const,
      outputRisk: "VERY_HIGH" as const,
      provenance: "PROVISIONAL_FALLBACK" as const,
      description:
        "IF Confidence IS Low OR Difficulty IS Hard THEN Risk IS Very High",
    };
    const e = evaluateMamdaniInference(5, 7.4, [orRule]);
    expect(e.firedRules).toHaveLength(1);
    expect(e.firedRules[0].firingStrength).toBe(0.5);
  });

  test("outputs stay in range: stress 0..100 and credits 12..18 over the whole grid", () => {
    for (let c = 1; c <= 10; c += 0.5) {
      for (let d = 1; d <= 10; d += 0.5) {
        const s = evaluateMamdaniInference(c, d).stressScore;
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
        const cr = computeRecommendedCreditLimit(s);
        expect(cr).toBeGreaterThanOrEqual(12);
        expect(cr).toBeLessThanOrEqual(18);
      }
    }
  });
});

// ═════════════════════════════ 4. SCHEDULER ═════════════════════════════

describe("AUDIT 4 — Academic Scheduler invariants across 8 student profiles", () => {
  const results = PROFILES.map((p) => ({ p, ...checkInvariants(p) }));
  const collect = (k: keyof ReturnType<typeof checkInvariants>["v"]) =>
    results.flatMap((r) => r.v[k].map((x) => `[${r.p.name}] ${x}`));

  test("never recommends an already-completed course", () => {
    expect(collect("recommendedCompleted")).toEqual([]);
  });

  test("every scheduled course has all known prerequisites completed in an EARLIER term", () => {
    expect(collect("prereqViolations")).toEqual([]);
  });

  test("CAS-standing courses (ANS191, ANS194) are scheduled only after all Y1/Y2 regular courses", () => {
    expect(collect("casViolations")).toEqual([]);
  });

  test("no course is scheduled twice", () => {
    expect(collect("duplicates")).toEqual([]);
  });

  test("next semester respects the fuzzy credit limit", () => {
    for (const r of results) {
      expect(r.plan.nextSemester.totalUnits).toBeLessThanOrEqual(
        r.plan.nextSemester.recommendedUnitLimit,
      );
    }
  });

  test("schedules differ when inputs differ (not static)", () => {
    const sig = (pl: GeneratedAcademicPlan) =>
      pl.nextSemester.courses.map((i) => i.course.code).join(",");
    const sigs = new Set(results.map((r) => sig(r.plan)));
    expect(sigs.size).toBeGreaterThanOrEqual(5);
  });

  test("all roadmap semesters respect their recommended credit limit", () => {
    expect(collect("overCreditLimit")).toEqual([]);
  });

  test("every course is placed strictly in its curriculum offering term (FIRST, SECOND, SUMMER)", () => {
    expect(collect("termMismatches")).toEqual([]);
  });

  test("all remaining required credit-bearing courses appear in the generated roadmap", () => {
    expect(collect("missingFromRoadmap")).toEqual([]);
  });

  test("corequisites are co-scheduled in the 8 standard profiles", () => {
    expect(collect("coreqViolations")).toEqual([]);
  });

  test("GEN001 is NOT scheduled without its corequisite CHM043.1 when CHM043.1 is not yet eligible", () => {
    const p: Profile = {
      name: "CHM043 done w/o CHM033",
      completed: YEAR1.filter((c) => c !== "CHM033").concat(["CHM043"]),
      year: 2,
      term: "SECOND",
      conf: DEFAULT_CONF,
    };
    expect(checkInvariants(p).v.coreqViolations).toEqual([]);
  });

  test("SMC slots are only scheduled after at least one Specialized Major option is eligible", () => {
    const violations: string[] = [];
    for (const r of results) {
      const done = new Set(r.p.completed);
      for (const sem of r.plan.semesters) {
        for (const { course } of sem.courses) {
          if (course.kind !== "SMC_SLOT") continue;
          const anyOption = ANSCI_CURRICULUM.courses
            .filter((c) => c.kind === "SMC_OPTION")
            .some((o) =>
              o.prerequisites
                .filter((x) => CATALOG.has(x))
                .every((x) => done.has(x)),
            );
          if (!anyOption)
            violations.push(
              `[${r.p.name}] ${course.code} @${sem.semesterTitle}`,
            );
        }
        sem.courses.forEach((i) => done.add(i.course.code));
      }
    }
    expect(violations).toEqual([]);
  });

  test("isOnTrack compares remaining terms against remaining timeline (4th-yr 2nd-sem with only Y1 completed => not on track)", () => {
    const plan = planFor({
      name: "late",
      completed: YEAR1,
      year: 4,
      term: "SECOND",
      conf: DEFAULT_CONF,
    });
    expect(plan.isOnTrack).toBe(false);
  });

  test("plan exposes isValidDag and cycles when given a cyclic curriculum", () => {
    const cur = curriculumOf([mk("A", ["B"]), mk("B", ["A"]), mk("C")]);
    const plan = generateAcademicSchedulePlan(cur, [], {
      confidenceRatings: DEFAULT_CONF,
      currentYearLevel: 1,
    });
    expect(plan.isValidDag).toBe(false);
    expect(plan.cycles.length).toBeGreaterThan(0);
    const scheduled = plan.semesters.flatMap((s) =>
      s.courses.map((i) => i.course.code),
    );
    expect(scheduled).not.toContain("A");
  });

  test("FINDING: NSTP (NST001/NST002, required non-credit) is never scheduled in the roadmap", () => {
    const plan = planFor(PROFILES[0]);
    const scheduled = plan.semesters.flatMap((s) =>
      s.courses.map((i) => i.course.code),
    );
    expect(scheduled).not.toContain("NST001");
    expect(scheduled).not.toContain("NST002");
  });
});

// ═════════════════════════════ 5. END-TO-END INTEGRATION ═════════════════════════════

describe("AUDIT 5 — End-to-End Reactive Pipeline Integration", () => {
  test("updating completedCourses (0 -> Year 1 -> Year 1+2) updates backward chaining, topological sort, and schedule plan", () => {
    const bc0 = runBackwardChaining(ANSCI_CURRICULUM, []);
    const bc1 = runBackwardChaining(ANSCI_CURRICULUM, YEAR1);
    const bc2 = runBackwardChaining(ANSCI_CURRICULUM, YEAR12);

    expect(bc0.remainingRequiredCourses.length).toBeGreaterThan(
      bc1.remainingRequiredCourses.length,
    );
    expect(bc1.remainingRequiredCourses.length).toBeGreaterThan(
      bc2.remainingRequiredCourses.length,
    );

    // ANS002 (2nd Year 1st Sem, prereq ANS001) is BLOCKED at 0, ELIGIBLE_NOW after Y1, COMPLETED after Y1+Y2
    expect(bc0.analysisByCourse.ANS002.status).toBe("BLOCKED");
    expect(bc1.analysisByCourse.ANS002.status).toBe("ELIGIBLE_NOW");
    expect(bc2.analysisByCourse.ANS002.status).toBe("COMPLETED");

    // ANS041 (3rd Year 1st Sem, prereqs AGR001 + AGR004) and CAS-gated ANS191 are BLOCKED after Y1, ELIGIBLE_NOW after Y1+Y2
    expect(bc1.analysisByCourse.ANS041.status).toBe("BLOCKED");
    expect(bc2.analysisByCourse.ANS041.status).toBe("ELIGIBLE_NOW");
    expect(bc1.analysisByCourse.ANS191.status).toBe("BLOCKED");
    expect(bc2.analysisByCourse.ANS191.status).toBe("ELIGIBLE_NOW");

    const topo0 = runTopologicalSort(bc0.remainingRequiredCourses);
    const topo1 = runTopologicalSort(bc1.remainingRequiredCourses);
    expect(topo0.courseTierMap.ANS002).toBeGreaterThan(0);
    expect(topo1.courseTierMap.ANS002).toBe(0);

    const plan0 = generateAcademicSchedulePlan(ANSCI_CURRICULUM, [], {
      currentYearLevel: 1,
      currentSemester: "FIRST",
      confidenceRatings: DEFAULT_CONF,
    });
    const plan1 = generateAcademicSchedulePlan(ANSCI_CURRICULUM, YEAR1, {
      currentYearLevel: 2,
      currentSemester: "FIRST",
      confidenceRatings: DEFAULT_CONF,
    });
    const plan2 = generateAcademicSchedulePlan(ANSCI_CURRICULUM, YEAR12, {
      currentYearLevel: 3,
      currentSemester: "FIRST",
      confidenceRatings: DEFAULT_CONF,
    });

    expect(plan0.completedUnits).toBe(0);
    expect(plan1.completedUnits).toBe(49);
    expect(plan2.completedUnits).toBe(95);
    expect(plan0.completionPercentage).toBeLessThan(plan1.completionPercentage);
    expect(plan1.completionPercentage).toBeLessThan(plan2.completionPercentage);
    expect(plan1.nextSemester.courses.map((c) => c.course.code)).toContain(
      "ANS002",
    );
    expect(plan2.nextSemester.courses.map((c) => c.course.code)).toContain(
      "ABT001",
    );
  });

  test("updating confidenceRatings (ALL(1) -> DEFAULT_CONF -> ALL(10)) updates fuzzy stress score, credit limit, and next-semester load", () => {
    const lowConfPlan = generateAcademicSchedulePlan(ANSCI_CURRICULUM, YEAR1, {
      currentYearLevel: 2,
      currentSemester: "FIRST",
      confidenceRatings: ALL(1),
    });
    const midConfPlan = generateAcademicSchedulePlan(ANSCI_CURRICULUM, YEAR1, {
      currentYearLevel: 2,
      currentSemester: "FIRST",
      confidenceRatings: DEFAULT_CONF,
    });
    const highConfPlan = generateAcademicSchedulePlan(ANSCI_CURRICULUM, YEAR1, {
      currentYearLevel: 2,
      currentSemester: "FIRST",
      confidenceRatings: ALL(10),
    });

    expect(lowConfPlan.workloadAnalysis.stressScore).toBeGreaterThan(
      midConfPlan.workloadAnalysis.stressScore,
    );
    expect(midConfPlan.workloadAnalysis.stressScore).toBeGreaterThan(
      highConfPlan.workloadAnalysis.stressScore,
    );

    expect(lowConfPlan.workloadAnalysis.recommendedUnits).toBe(12);
    expect(midConfPlan.workloadAnalysis.recommendedUnits).toBe(15);
    expect(highConfPlan.workloadAnalysis.recommendedUnits).toBe(18);

    expect(lowConfPlan.nextSemester.totalUnits).toBeLessThanOrEqual(12);
    expect(midConfPlan.nextSemester.totalUnits).toBeLessThanOrEqual(15);
    expect(highConfPlan.nextSemester.totalUnits).toBeLessThanOrEqual(18);
    expect(lowConfPlan.nextSemester.totalUnits).toBeLessThan(
      highConfPlan.nextSemester.totalUnits,
    );
  });

  test("toggling a single missing prerequisite (ANS001) immediately unblocks and schedules ANS002", () => {
    const withoutAns001 = YEAR1.filter((c) => c !== "ANS001");
    const bcBlocked = runBackwardChaining(ANSCI_CURRICULUM, withoutAns001);
    const planBlocked = generateAcademicSchedulePlan(
      ANSCI_CURRICULUM,
      withoutAns001,
      {
        currentYearLevel: 2,
        currentSemester: "FIRST",
        confidenceRatings: DEFAULT_CONF,
      },
    );

    const bcUnblocked = runBackwardChaining(ANSCI_CURRICULUM, YEAR1);
    const planUnblocked = generateAcademicSchedulePlan(
      ANSCI_CURRICULUM,
      YEAR1,
      {
        currentYearLevel: 2,
        currentSemester: "FIRST",
        confidenceRatings: DEFAULT_CONF,
      },
    );

    expect(bcBlocked.analysisByCourse.ANS002.status).toBe("BLOCKED");
    expect(bcBlocked.analysisByCourse.ANS002.missingPrerequisites).toEqual([
      "ANS001",
    ]);
    expect(
      planBlocked.nextSemester.courses.map((c) => c.course.code),
    ).not.toContain("ANS002");

    expect(bcUnblocked.analysisByCourse.ANS002.status).toBe("ELIGIBLE_NOW");
    expect(
      planUnblocked.nextSemester.courses.map((c) => c.course.code),
    ).toContain("ANS002");
  });
});

// ═════════════════════════════ Performance (SystemArchitecture.pdf Sec 10: < 16 ms) ═════════════════════════════

describe("AUDIT — performance benchmark (Node/Jest, not on-device)", () => {
  function bench(fn: () => void, runs = 50) {
    for (let i = 0; i < 5; i++) fn();
    const t0 = performance.now();
    for (let i = 0; i < runs; i++) fn();
    return (performance.now() - t0) / runs;
  }

  test("graph evaluation (backward chaining + topological sort, 89 courses) and full plan generation timings", () => {
    const graphMs = bench(() => {
      const r = runBackwardChaining(ANSCI_CURRICULUM, YEAR1);
      runTopologicalSort(r.remainingRequiredCourses);
    });
    const planMs = bench(() => planFor(PROFILES[2]), 20);
    console.log(
      `[BENCH] courses=${ANSCI_CURRICULUM.courses.length} graph=${graphMs.toFixed(3)}ms fullPlan=${planMs.toFixed(3)}ms`,
    );
    expect(graphMs).toBeLessThan(16);
  });
});
