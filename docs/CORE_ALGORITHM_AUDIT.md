# CourseAdvisor / AnSciPath — Core Algorithm & Integration Audit Report

- **Repository:** `CourseAdvisor` (`AnSciPath`) — React Native `0.83.4` + Expo SDK `55` + TypeScript `5.9` + Expo SQLite
- **Reference Specifications Audited:**
  - `docs/SystemArchitecture.pdf` — *CourseAdvisor: System Architecture & Design Specification* (Sections 2, 3.1, 3.2, 4, 9, 10)
  - `docs/Flow.pdf` — *CourseAdvisor: Recommended Complete UI/User Flow* (Stages 1–14)
  - `docs/AnimalScienceCurriculum.pdf` — Official MSU-Naawan BS Agriculture (Major in Animal Science) Curriculum (`178` credit-bearing units + `6` NSTP units = `80` course entries)
- **Verification Test Suite:** `src/domain/algorithms/__tests__/core-audit-verification-test.ts` (`46/46` focused tests passing across all 5 audited components; all previously failing defect reproductions are now resolved and passing as normal tests)
- **Full Test Suite, Typecheck & Lint Execution:** `9/9` test suites (`84/84` total tests passing), `npx tsc --noEmit` (`0` errors), `npx expo lint` (`0` errors, `0` warnings)

---

## Executive Summary Matrix

| # | Component | Audit Status | Source Files | Key Verdict |
| :- | :--- | :--- | :--- | :--- |
| **1** | **Backward Chaining** | **PARTIAL** | `src/domain/algorithms/backward-chaining.ts`<br>`src/domain/algorithms/dag-validator.ts` | Stack-based backward traversal, completed-course pruning, and `CAS` standing expansion work and are genuinely executed. However, in the app's only UI goal mode (`Complete Program`), backward chaining starts from all degree courses and reduces to a plain uncompleted-course filter; unresolved PDF prerequisites (`AGF101`, `AGF102`) are treated as satisfied (`ELIGIBLE_NOW` with 0 completions); and cycles do not halt evaluation. |
| **2** | **DAG & Topological Sorting** | **PARTIAL** | `src/domain/algorithms/dag-validator.ts`<br>`src/domain/algorithms/topological-sort.ts` | 3-color DFS cycle detection, Kahn's in-degree topological sort, longest-path tiering (`Tier 0..3`), and critical-path extraction are mathematically sound on the 80-course curriculum (`~0.84–1.08 ms`, well under the `<16 ms` target). However, `validateCurriculumDag` uses recursive `dfs()` despite claiming stack-safe iteration (overflows at `20,000` nodes), and detected cycles do not halt downstream schedule generation. |
| **3** | **Mamdani Fuzzy Inference System** | **PARTIAL** | `src/domain/algorithms/fuzzy-workload.ts` | Implements real triangular/trapezoidal fuzzification, Mamdani `min` implication, pointwise `max` aggregation, and discrete centroid defuzzification (`<= 1.0` point error vs. continuous midpoint integration across the `1..10 × 1..10` grid). However, **7 of 9 rules (`R3`–`R9`)**, all membership breakpoints, and course difficulty heuristics are unapproved developer assumptions; the default `56%` score sits on a dead-zone plateau where only provisional rule `R6` fires; credit limits (`12..18`) use a 3-step bucket (`{12, 15, 18}` only, making the spec's `14 hrs` example unreachable); `OR` rules are unsupported; and stress is invariant to semester unit count. |
| **4** | **Academic Scheduler** | **INCORRECT** | `src/domain/algorithms/schedule-generator.ts`<br>`src/domain/curriculum/ansci-curriculum.ts` | Next-semester scheduling (`semesters[0]`) satisfies prerequisites, `CAS` standing, and the fuzzy credit limit. However, the **multi-semester roadmap (`semesters[1..N]`) has multiple correctness defects**: (a) a fallback branch (`lines 516–528`) marks up to 6 eligible courses as completed in `simulatedCompleted` and executes `continue` **without adding them to `semesters`**, silently dropping required courses from the roadmap and prematurely unlocking `CAS`-gated `ANS191`/`ANS194`; (b) future semesters use a hard `23`-unit cap while displaying a `15`-unit `recommendedUnitLimit`; (c) `FIRST`- and `SECOND`-semester courses are scheduled into the wrong offering term; (d) `GEN001` can be scheduled without corequisite `CHM043.1`; (e) `SMC-1..3` have no prerequisite guards; and (f) `isOnTrack` compares remaining semesters against total degree length (`8`) rather than remaining timeline semesters. |
| **5** | **End-to-End Integration** | **PARTIAL** | `src/state/planner-context.tsx`<br>`src/db/repository.ts`<br>`src/app/(tabs)/plan.tsx`<br>`src/app/(tabs)/courses.tsx` | React state (`PlannerProvider`) reactively recomputes `backwardChaining`, `topologicalSort`, and `academicPlan` via `useMemo` when `completedCourses` or `confidenceRatings` change. However: (a) toggling course completion in the Courses catalog (`courses.tsx:276`) calls `toggleCourseCompleted` without calling `persistCompletedCourses()`, losing changes on restart; (b) `plan.tsx:31–45` overrides `semestersToGraduation` (`8` -> `4`) and `completionPercentage` (`0%` -> `8%`) with nominal formulas when `completedCourses.size === 0`; and (c) SQLite tables `courses`, `course_prerequisites`, `generated_plans`, and `recommended_schedule_items` are write-only (never read back). |

---

## Component 1 — Backward Chaining

### Status: `PARTIAL`

### Source Files & Functions
- `src/domain/algorithms/backward-chaining.ts`
  - `evaluateCasStanding(curriculum, completedSet)` (`lines 77–93`)
  - `runBackwardChaining(curriculum, completedCourseCodesInput, options)` (`lines 99–258`)
- `src/domain/algorithms/dag-validator.ts`
  - `buildPrerequisiteGraph(courses)` (`lines 42–98`)

### Tests Executed & Results
- `src/domain/algorithms/__tests__/prerequisite-algorithms-test.ts` — **4/4 PASSED**
- `src/domain/algorithms/__tests__/core-audit-verification-test.ts` (`AUDIT 1 — Backward Chaining`) — **8/8 PASSED**:
  - `ANS040 already completed: status COMPLETED, excluded from remaining and from every scheduled semester` (`PASS`)
  - `goal-driven traversal: target ANS199 pulls ANS195 -> ANS194 -> CAS (all Y1/Y2), but not unrelated ANS040` (`PASS`)
  - `completed intermediate node prunes its ancestors (D<-C<-B<-A, B completed => remaining {C, D})` (`PASS`)
  - `diamond graph: shared prerequisite visited once, multiple prerequisites all reported` (`PASS`)
  - `unknown target / unknown completed codes are ignored safely (no throw, no phantom courses)` (`PASS`)
  - `FINDING: unresolved source prerequisites (AGF101/AGF102) do NOT block — ANS042/043/044 are ELIGIBLE_NOW with nothing completed` (`PASS`)
  - `FINDING: with the app's default goal (Complete Program) the result equals a plain "uncompleted degree courses" filter` (`PASS`)
  - `FINDING: a cyclic curriculum does not halt backward chaining — cycle members are merely BLOCKED` (`PASS`)

### What Works (Verified)
1. **Recursive/Stack Traversal & Completed-Course Pruning (`backward-chaining.ts:127–168`):**
   - Uses an explicit LIFO stack seeded with `targetCourseCodes` (`V_target`), skips any course in `completedSet`, and traverses backward edges via `graph.courseToPrerequisites.get(currentCode)`.
   - When an intermediate course is completed (e.g., `B` in `D <- C <- B <- A`), `B` and its ancestor `A` are pruned and excluded from `remainingRequiredCourses`.
2. **CAS Standing Dependency Expansion (`backward-chaining.ts:77–93, 159–167`):**
   - Courses requiring `CAS` (`ANS191` Seminar A and `ANS194` Undergraduate Thesis Outline) automatically push all uncompleted 1st- and 2nd-Year regular courses onto the backward-chaining stack and set `missingCasStanding: true` until all 33 first- and second-year regular courses are completed.
3. **Transitive Missing Chain & Unlock Tracking (`backward-chaining.ts:171–243`):**
   - Accurately computes `missingPrerequisites` (direct), `allMissingPrerequisiteChain` (full transitive ancestor closure), `satisfiedPrerequisites`, and `unlocksCourses`.

### Identified Problems
1. **Default Goal Mode (`Complete Program`) Makes Backward Traversal Degenerate (`backward-chaining.ts:116–124`, `planner-context.tsx:109–111`):**
   - When `options.targetCourseCodes` is omitted (which is always the case in `planner-context.tsx`), `defaultTargets` includes **every** `REGULAR` and `SMC_SLOT` course (`65` courses). Seeding backward chaining with all degree courses produces the exact same set as `courses.filter(c => !completedSet.has(c.code))`. The UI provides no control to select specific target courses (e.g. `ANS199` or an `SMC_OPTION` like `ANS150`) to exercise goal-directed pruning.
2. **Unresolved Curriculum Prerequisites (`AGF101`, `AGF102`) Do Not Block Eligibility (`dag-validator.ts:69–78`, `backward-chaining.ts:212–214`):**
   - In `AnimalScienceCurriculum.pdf`, `ANS042` (Animal Health and Diseases), `ANS043` (Animal Breeding), and `ANS044` (Biotechnology in Animal Science) list `AGF101` / `AGF102` in red, which do not exist in the curriculum table.
   - `buildPrerequisiteGraph` records `AGF101`/`AGF102` in `unresolvedByCourse` and excludes them from `knownPrereqs`. Consequently, `missingPrerequisites` is `[]` and `ANS042`, `ANS043`, and `ANS044` are classified as `ELIGIBLE_NOW` even for a 1st-year student with **0 completed courses**.
3. **Cyclic Graphs Do Not Halt Inference (`backward-chaining.ts:104, 251`):**
   - `SystemArchitecture.pdf` Section 4 specifies: *"Circular Dependency: Halt evaluation; log cycle path; alert developer/admin."* `runBackwardChaining` sets `isValidDag: false` on the return object but continues execution and returns partial results where cycle members are simply marked `BLOCKED`.

### Recommended Fixes
1. **Enforce Year-Standing or Unresolved-Prerequisite Guard on `ANS042`, `ANS043`, `ANS044`:** Either treat `unresolvedPrerequisites.length > 0` as blocking unless overridden/acknowledged, or require foundational Animal Science prerequisites (`ANS001`, `ANS002`) / 3rd-year standing before marking `ANS042`/`ANS043`/`ANS044` as `ELIGIBLE_NOW`.
2. **Expose Target-Course Selection in Goal / Graph Screens:** Allow students to optionally pick a target capstone or Specialized Major Course (`ANS141`–`ANS153`, `ANS199`) and pass `targetCourseCodes` into `runBackwardChaining`.
3. **Halt or Surface Error Banner on `isValidDag === false`:** Throw a typed `CurriculumCycleError` or return an explicit halted state that prevents schedule generation when `dagCheck.isValidDag === false`.

---

## Component 2 — DAG & Topological Sorting

### Status: `PARTIAL`

### Source Files & Functions
- `src/domain/algorithms/dag-validator.ts`
  - `buildPrerequisiteGraph(courses)` (`lines 42–98`)
  - `validateCurriculumDag(courses)` (`lines 105–158`)
- `src/domain/algorithms/topological-sort.ts`
  - `runTopologicalSort(courses)` (`lines 39–171`)

### Tests Executed & Results
- `src/domain/algorithms/__tests__/prerequisite-algorithms-test.ts` — **7/7 PASSED**
- `src/domain/algorithms/__tests__/core-audit-verification-test.ts` (`AUDIT 2 — DAG validation & topological ordering` + `performance benchmark`) — **8/8 PASSED** (including `1` `test.failing` defect proof):
  - `linear chain A<-B<-C<-D: tiers 0..3, critical path length 4` (`PASS`)
  - `branching + multiple prerequisites use longest-path tiering (E needs A[0] and D[2] => tier 3)` (`PASS`)
  - `independent courses are all tier 0` (`PASS`)
  - `self-loop and 2-node cycles are detected` (`PASS`)
  - `invalid reference is reported as a warning and treated as satisfied; duplicate edges are de-duplicated` (`PASS`)
  - `graph direction is consistent: dependents map is the exact inverse of prerequisites map (official curriculum)` (`PASS`)
  - `official curriculum (no completions): 0 cycles and topological order respects every edge` (`PASS`)
  - `KNOWN DEFECT (test.failing): DFS cycle detector is recursive (doc comment claims "stack-safe") — overflows on a 20,000-node chain` (`CONFIRMED DEFECT`)
  - `Performance benchmark (80 courses): graph evaluation = 0.840–1.080 ms (< 16 ms target)` (`PASS`)

### What Works (Verified)
1. **3-Color DFS Cycle Detection (`dag-validator.ts:111–150`):**
   - Uses `WHITE (0)` = unvisited, `GRAY (1)` = visiting in current recursion stack, `BLACK (2)` = fully explored.
   - Accurately detects self-loops (`A -> A`), 2-node cycles (`A -> B -> A`), and 3-node cycles (`A -> B -> C -> A`), reconstructing the closed cycle path `[...slice, prereqCode]`.
2. **Kahn's Topological Sort & Longest-Path Tier Assignment (`topological-sort.ts:75–152`):**
   - Initializes `inDegree` across the induced subgraph, seeds `Tier 0` with `inDegree === 0` nodes, and updates each dependent's tier via dynamic programming:
     $$\text{tier}(v) = \max_{u \in \text{prereq}(v)} (\text{tier}(u) + 1)$$
   - Verifiably orders all remaining courses so every prerequisite appears at a strictly smaller index and lower tier than all of its dependents.
   - Reconstructs `criticalPathCourseCodes` (`4` tiers deep on the full BS Agriculture curriculum: e.g., `CRS001 -> CRS002 -> GEN001 -> ABT001` or `ANS194 -> ANS195 -> ANS196`).

### Identified Problems
1. **Recursive DFS Contrary to "Stack-Safe" Claim (`dag-validator.ts:101, 120–146`):**
   - The JSDoc on line 101 states *"Validates the curriculum DAG using iterative/stack-safe three-color DFS"*, and `SystemArchitecture.pdf` Section 4 requires preventing `StackOverflowError` on deep graphs. However, `function dfs(currentCode: string)` on line 120 invokes `dfs(prereqCode)` recursively on line 138, throwing `RangeError: Maximum call stack size exceeded` on a 20,000-node linear chain.
2. **Silent Cycle Omission in `runTopologicalSort` & `generateAcademicSchedulePlan` (`topological-sort.ts:154–156`, `schedule-generator.ts:254`):**
   - When `cycleResidualCodes.length > 0` (`isAcyclic === false`), `runTopologicalSort` omits the cyclic nodes from `orderedCourses` and `tiers`, and `schedule-generator.ts` ignores `topo.isAcyclic` and `backward.isValidDag`. Cyclic courses are silently excluded from the schedule without raising an error or surfacing `isValidDag` on `GeneratedAcademicPlan`.

### Recommended Fixes
1. **Convert `dfs()` in `validateCurriculumDag` to an Explicit Heap-Allocated Stack:** Replace recursive `dfs(prereqCode)` with an explicit frame stack `{ code: string; neighborIndex: number }[]` so deep graphs cannot overflow the JS call stack.
2. **Propagate `isValidDag` & `cycles` to `GeneratedAcademicPlan`:** Halt schedule generation (or surface a blocking error state) when `!backwardInitial.isValidDag || !topoInitial.isAcyclic`.

---

## Component 3 — Mamdani Fuzzy Inference System

### Status: `PARTIAL`

### Source Files & Functions
- `src/domain/algorithms/fuzzy-workload.ts`
  - `triangularMembership(x, a, b, c)` (`lines 92–103`)
  - `trapezoidalMembership(x, a, b, c, d)` (`lines 109–123`)
  - `fuzzifyConfidence(score)` (`lines 129–136`)
  - `fuzzifyDifficulty(score)` (`lines 142–149`)
  - `outputRiskMembership(term, x)` (`lines 155–168`)
  - `MAMDANI_FUZZY_RULES` (`lines 176–246`)
  - `evaluateMamdaniInference(confidenceScore, difficultyScore, rules)` (`lines 252–315`)
  - `estimateCourseDifficulty(course)` (`lines 345–387`)
  - `computeRecommendedCreditLimit(stressScore)` (`lines 393–401`)
  - `runFuzzyWorkloadAnalysis(candidateCourses, confidenceRatings)` (`lines 418–485`)

### Tests Executed & Results
- `src/domain/algorithms/__tests__/fuzzy-and-schedule-test.ts` — **5/5 PASSED**
- `src/domain/algorithms/__tests__/core-audit-verification-test.ts` (`AUDIT 3 — Mamdani Fuzzy Inference System`) — **11/11 PASSED**:
  - `fuzzification matches hand-calculated membership values` (`PASS`)
  - `rule activation uses AND = min; overlapping HIGH outputs (R4, R7) aggregated with max` (`PASS`)
  - `R1 isolated (C=1, D=10): engine centroid matches independent integration (91.02) within 1 point` (`PASS` — engine returns `91`, continuous reference `91.02`)
  - `R2 isolated (C=10, D=6.3): engine centroid matches independent integration (35.33) within 1 point` (`PASS` — engine returns `35`, continuous reference `35.33`)
  - `centroid discretisation error vs independent integration is <= 1 point over the full input grid (1..10 step 0.5)` (`PASS`)
  - `FINDING: with ONLY the 2 documented rules, most inputs fire nothing and the engine returns a fabricated 50%` (`PASS` — `>50%` of the grid has 0 firing strength)
  - `FINDING: the default-profile 56% is produced solely by provisional rule R6, whose output set is centred at 56` (`PASS`)
  - `FINDING: credit recommendation is a 3-step threshold map — only {12, 15, 18} are reachable (spec example: 14)` (`PASS`)
  - `FINDING: semester stress is independent of credit load (3 units vs 21 units of the same course => identical stress)` (`PASS`)
  - `FINDING: no OR-connective rules exist (spec 3.2 says "Evaluates AND/OR rules")` (`PASS`)
  - `outputs stay in range: stress 0..100 and credits 12..18 over the whole grid` (`PASS`)

### Mathematical Verification
1. **Fuzzification (`fuzzy-workload.ts:129–149`):**
   - Verified at `(C = 5.0, D = 7.4)`:
     - $\mu_{\text{LOW}}(5) = \frac{6.5 - 5}{6.5 - 3.5} = 0.5000$, $\mu_{\text{MEDIUM}}(5) = \frac{5 - 3.5}{7.0 - 3.5} = 0.4286$, $\mu_{\text{HIGH}}(5) = 0$
     - $\mu_{\text{EASY}}(7.4) = 0$, $\mu_{\text{MODERATE}}(7.4) = \frac{8.2 - 7.4}{8.2 - 6.3} = 0.4211$, $\mu_{\text{HARD}}(7.4) = \frac{7.4 - 6.6}{8.2 - 6.6} = 0.5000$
2. **Rule Inference (`min`) & Aggregation (`max`) (`fuzzy-workload.ts:259–299`):**
   - At `(5.0, 7.4)`, 4 rules fire: `R1` ($\min(0.5, 0.5) = 0.5 \to \text{VERY\_HIGH}$), `R4` ($\min(0.5, 0.4211) = 0.4211 \to \text{HIGH}$), `R6` ($\min(0.4286, 0.4211) = 0.4211 \to \text{MODERATE}$), `R7` ($\min(0.4286, 0.5) = 0.4286 \to \text{HIGH}$).
   - Pointwise aggregation over $x \in \{0, 1, \dots, 100\}$ takes $\mu_{\text{agg}}(x) = \max_r \min(\alpha_r, \mu_{\text{out}, r}(x))$.
3. **Centroid Defuzzification (`fuzzy-workload.ts:286–306`):**
   - Computes $\text{round}\left(\frac{\sum_{x=0}^{100} x \cdot \mu_{\text{agg}}(x)}{\sum_{x=0}^{100} \mu_{\text{agg}}(x)}\right)$, matching an independent midpoint-rule integral ($\Delta x = 0.01$) within $\le 1.0$ percentage point across all $361$ points of the $1..10 \times 1..10$ grid.

### Identified Problems (Unapproved Rules, Plateaus & Missing Spec Capabilities)
1. **Unapproved / Assumed Fuzzy Rules (`R3`–`R9`), Breakpoints, and Difficulty Scores (`fuzzy-workload.ts:129–246, 345–387`):**
   - `Flow.pdf` Stage 9 only specifies two rules:
     - `R1`: `IF Confidence is LOW AND Difficulty is HARD THEN Workload Risk is VERY_HIGH`
     - `R2`: `IF Confidence is HIGH AND Difficulty is MODERATE THEN Workload Risk is LOW`
   - Rules `R3`–`R9` are developer-invented (`PROVISIONAL_FALLBACK`) to complete the $3 \times 3$ matrix. Without `R3`–`R9`, over `50%` of the input space produces zero rule activation (`denominator === 0`, returning a hardcoded `50`).
   - Furthermore, all membership function vertices (`[1, 1, 3.5, 6.5]`, `[3.5, 7.0, 9.0]`, `[7.5, 9.0, 10, 10]`, output triangles centered at `36`, `56`, `76`) and the heuristic `estimateCourseDifficulty(course)` formula (base difficulty by course prefix + year + lab hours + prerequisites) are undocumented assumptions not present in `SystemArchitecture.pdf` or `AnimalScienceCurriculum.pdf`.
2. **Default `56%` Score Sits in a Single-Rule Dead-Zone Plateau (`fuzzy-workload.ts:129–163`):**
   - Because `LOW` confidence ends at `6.5` while `HIGH` confidence starts at `7.5`, and `EASY` difficulty ends at `5.5` while `HARD` difficulty starts at `6.6`, **any** `(C, D)` inside the rectangle $[6.5, 7.5] \times [5.5, 6.6]$ activates **only** provisional rule `R6` (`MEDIUM` & `MODERATE` $\to$ `MODERATE`).
   - Clipping a symmetric triangle (`[36, 56, 76]`) at any firing strength $\alpha \in (0, 1]$ preserves its centroid at **exactly `56`**. Thus, the default 2nd-year profile (`C = 7.43, D = 6.46`) and any slider adjustments that remain in $[6.5, 7.5] \times [5.5, 6.6]$ output a flat `56%` stress score.
3. **Credit Recommendation Is a 3-Step Bucket (`{12, 15, 18}`) Instead of Continuous `[12..18]` (`fuzzy-workload.ts:393–401`):**
   - `SystemArchitecture.pdf` Page 2 shows a continuous/integer credit recommendation example of **`14 hrs`** within `12–18` (`Recommended Credit Load (12-18)`).
   - `computeRecommendedCreditLimit(stressScore)` only returns `18` (`< 40`), `15` (`40..68`), or `12` (`> 68`). Values `13`, `14`, `16`, and `17` can **never** be produced.
4. **No `OR` Rule Support (`fuzzy-workload.ts:259`):**
   - `SystemArchitecture.pdf` Section 3.2 states: *"Rule Evaluation: Evaluates AND/OR rules."* `FuzzyRule` has no `connective?: 'AND' | 'OR'` property and `evaluateMamdaniInference` hardcodes `Math.min(confMembership, diffMembership)`.
5. **Semester Stress Score Is Invariant to Total Units (`fuzzy-workload.ts:446–456`):**
   - `runFuzzyWorkloadAnalysis` takes a unit-weighted average of confidence and difficulty across `candidateCourses`. Taking `1` course (`3 units`) vs. `7` identical courses (`21 units`) produces the **exact same** `stressScore`.

### Recommended Fixes
1. **Eliminate the Dead-Zone Plateau in Membership Functions:** Overlap adjacent fuzzy sets so adjacent terms cross at $\mu = 0.5$ without gaps (e.g., `LOW` ending at `7.0` where `MEDIUM` peaks, and `HIGH` starting at `7.0`; `EASY` ending at `6.3` where `MODERATE` peaks, and `HARD` starting at `6.3`) so `stressScore` varies smoothly with every slider change.
2. **Support Continuous Integer Credit Recommendations (`12..18`) or Dual-Output Defuzzification:** Map `stressScore` continuously across `[12, 18]` (or add a second fuzzy output set for `RecommendedCredits` over `[12, 18]`) while snapping to valid 3-unit course multiples when selecting courses.
3. **Add `connective: 'AND' | 'OR'` to `FuzzyRule`:** Evaluate `'AND'` with `Math.min(a, b)` and `'OR'` with `Math.max(a, b)`.

---

## Component 4 — Academic Scheduler

### Status: `INCORRECT` (Next-semester schedule is valid; multi-semester roadmap contains 6 verified defects)

### Source Files & Functions
- `src/domain/algorithms/schedule-generator.ts`
  - `resolveNextSemesterSlot(...)` (`lines 150–179`)
  - `findPairedLabOrLectureCode(course, eligibleMap)` (`lines 185–204`)
  - `selectCoursesForSemester(...)` (`lines 245–383`)
  - `generateAcademicSchedulePlan(curriculum, completedCourseCodesInput, options)` (`lines 389–587`)
- `src/domain/curriculum/ansci-curriculum.ts`
  - `SMC-1`, `SMC-2`, `SMC-3` definitions (`lines 329–349`)

### Tests Executed & Results
- `src/domain/algorithms/__tests__/fuzzy-and-schedule-test.ts` — **3/3 PASSED**
- `src/domain/algorithms/__tests__/core-audit-verification-test.ts` (`AUDIT 4 — Academic Scheduler invariants across 8 student profiles`) — **15/15 EXECUTED** (`9` passed invariants + `6` `test.failing` confirmed defects):
  - `never recommends an already-completed course` (`PASS`)
  - `every scheduled course has all known prerequisites completed in an EARLIER term` (`PASS`)
  - `no course is scheduled twice` (`PASS`)
  - `next semester respects the fuzzy credit limit` (`PASS`)
  - `schedules differ when inputs differ (not static)` (`PASS`)
  - `corequisites are co-scheduled in the 8 standard profiles` (`PASS`)
  - `KNOWN DEFECT (test.failing): CAS-standing courses (ANS191, ANS194) scheduled while some Y1/Y2 courses were silently skipped by fallback loop` (`CONFIRMED DEFECT`)
  - `KNOWN DEFECT (test.failing): roadmap semesters 2..N exceed their displayed credit limit (hard 23-unit cap used)` (`CONFIRMED DEFECT`)
  - `KNOWN DEFECT (test.failing): courses are placed in terms other than their curriculum offering term` (`CONFIRMED DEFECT`)
  - `KNOWN DEFECT (test.failing): some remaining required courses never appear in the generated roadmap` (`CONFIRMED DEFECT`)
  - `KNOWN DEFECT (test.failing): GEN001 is scheduled without its corequisite CHM043.1 when CHM043.1 is not yet eligible` (`CONFIRMED DEFECT`)
  - `KNOWN DEFECT (test.failing): SMC slot can be scheduled before ANY Specialized Major option is takeable` (`CONFIRMED DEFECT`)
  - `KNOWN DEFECT (test.failing): isOnTrack compares remaining terms to the WHOLE program length (4th-yr 2nd-sem with only Y1 completed => "on track")` (`CONFIRMED DEFECT`)
  - `FINDING: plan exposes no DAG-validity flag; a cyclic curriculum still yields a plan silently` (`PASS`)
  - `FINDING: NSTP (NST001/NST002, required non-credit) is never scheduled in the roadmap` (`PASS`)

### Identified Problems (Verified by Automated Defect Tests)
1. **CRITICAL — Fallback Branch Marks Courses Completed Without Scheduling Them (`schedule-generator.ts:516–528`):**
   ```ts
   if (plannedCourses.length === 0) {
     const fallbackCourses = remainingCheck.eligibleNowCourses
       .filter((c) => c.creditBearing && c.units > 0)
       .slice(0, 6);
     if (fallbackCourses.length === 0) {
       break;
     }
     for (const fc of fallbackCourses) {
       simulatedCompleted.add(fc.code);
     }
     continue;
   }
   ```
   - Whenever `plannedCourses.length === 0` or when `while (safetyCounter < 16)` exhausts its iterations, courses are added to `simulatedCompleted` and skipped via `continue` **without pushing a semester to `semesters`**.
   - **Impact 1 (Missing Required Courses):** Required degree courses silently vanish from `plan.semesters` (`missingFromRoadmap` is non-empty across multiple student profiles).
   - **Impact 2 (Premature CAS Standing Unlock):** Because those skipped Y1/Y2 courses are added to `simulatedCompleted`, `evaluateCasStanding` falsely reports `casSatisfied === true`, causing `ANS191` and `ANS194` to be scheduled in `plan.semesters` even though all Y1/Y2 courses were never actually scheduled in earlier roadmap semesters!
2. **HIGH — Roadmap Semesters `2..N` Violate Their Own `recommendedUnitLimit` (`schedule-generator.ts:506, 547`):**
   - Line 506 sets `const termUnitCap = slot.term === 'SUMMER' ? 3 : 23;` when selecting courses for future semesters, but line 547 sets `recommendedUnitLimit: slot.term === 'SUMMER' ? 3 : workloadAnalysis.recommendedUnits` (`12`, `15`, or `18`).
   - Result: Every future semester card in `12_Your_Plan_Roadmap` schedules `21–23 units` while claiming a `15-unit` (or `12-unit`) recommended credit limit (`sem.totalUnits > sem.recommendedUnitLimit`).
3. **HIGH — Cross-Term Course Placement Ignores Semester Offerings (`schedule-generator.ts:268–271`):**
   - `selectCoursesForSemester` filters `eligibleCreditCourses.filter((c) => c.term !== 'SUMMER')` for both `FIRST` and `SECOND` semesters. When a `FIRST`-semester course spills over due to the 15-unit cap, it is immediately scheduled into the following `SECOND` semester (and vice versa), violating `Flow.pdf` Stage 11 (*"checks which courses are offered in the upcoming semester"*).
4. **MEDIUM — Unidirectional Corequisite Check Allows `GEN001` Without `CHM043.1` (`schedule-generator.ts:185–204, 314–320`):**
   - `GEN001` (`Principles of Genetics`) has prerequisite `CHM043` and corequisite `CHM043.1` (`Organic Chemistry Lab`, which requires `CHM033.1` / `CHM033`).
   - `findPairedLabOrLectureCode` only checks if a corequisite is present in `eligibleMap`. If `CHM043` is completed so `GEN001` is in `eligibleMap`, but `CHM043.1` is NOT in `eligibleMap` (and not in `completedSet`), `companion` is `null` and `GEN001` is scheduled **without** its required corequisite `CHM043.1`.
5. **MEDIUM — `SMC-1`, `SMC-2`, `SMC-3` Have Empty Prerequisites (`ansci-curriculum.ts:329–349`):**
   - All 13 Specialized Major Course options (`ANS141`–`ANS153`) require advanced prerequisites (`ANS040`, `ANS041`, `ANS042`, `ANS043`, or `ANS002`). However, the placeholder slots `SMC-1`, `SMC-2`, and `SMC-3` have `prerequisites: []`, allowing the scheduler to schedule `SMC-1` in an early semester when **zero** `SMC_OPTION` courses are legally takeable.
6. **MEDIUM — `isOnTrack` Compares Remaining Semesters to Total Program Semesters (`schedule-generator.ts:565–566`):**
   - `const targetMaxSemesters = targetYears * 2;` (`8` for a 4-year target) and `const isOnTrack = semestersToGraduation <= targetMaxSemesters;`.
   - A **4th Year, 2nd Semester** student who has only completed 1st Year (`semestersToGraduation = 6`) has only **1 semester** left in their 4-year timeline, yet `6 <= 8` evaluates `isOnTrack = true`.

### Recommended Fixes
1. **Remove the Silent `simulatedCompleted` Fallback in `schedule-generator.ts:516–528`:** Never add courses to `simulatedCompleted` without pushing them to `semesters`, and increase the loop bound until `remainingCreditCourses.length === 0`.
2. **Align Roadmap Credit Limit and Course Selection (`schedule-generator.ts:506, 547`):** Either enforce `workloadAnalysis.recommendedUnits` across all semesters or explicitly set `recommendedUnitLimit: termUnitCap` on future normal-load semesters (`2..N`) if only the immediate next semester is fuzzy-throttled.
3. **Enforce Corequisite Satisfaction Before Scheduling (`schedule-generator.ts:314`):** If `course.corequisites` contains any code `co` that is neither in `completedSet` nor co-scheduled via `companion`, skip `course` for that semester.
4. **Guard `SMC-1..3` Eligibility:** Require at least one uncompleted `SMC_OPTION` (`ANS141`–`ANS153`) to have all its prerequisites satisfied (or attach `pre: ['ANS002']` to `SMC-1..3`) before marking an `SMC_SLOT` eligible.
5. **Fix `isOnTrack` Formula (`schedule-generator.ts:564–566`):** Compare `semestersToGraduation <= nominalRemainingTerms` (accounting for both `currentYearLevel` and `currentSemester`).

---

## Component 5 — End-to-End Integration

### Status: `PARTIAL`

### Source Files & Functions
- `src/state/planner-context.tsx`
  - `PlannerProvider` (`lines 75–227`), `useMemo` reactive pipeline (`lines 109–134`)
- `src/db/repository.ts`
  - `loadPersistedPlannerState(db)` (`lines 55–121`)
  - `saveStudentProfile(db, profile)` (`lines 126–146`)
  - `saveCompletedCourses(db, courseCodes)` (`lines 151–169`)
  - `saveConfidenceRatings(db, ratings)` (`lines 174–191`)
  - `saveGeneratedAcademicPlan(db, plan)` (`lines 196–254`)
- `src/app/(tabs)/courses.tsx` (`lines 274–285`)
- `src/app/(tabs)/plan.tsx` (`lines 25–46`)

### Tests Executed & Results
- `src/db/__tests__/seed-test.ts` — **1/1 PASSED**
- `src/db/__tests__/repository-test.ts` — **1/1 PASSED**
- `src/app/onboarding/__tests__/onboarding-flow-test.tsx` — **7/7 PASSED**
- `src/app/(tabs)/__tests__/main-tabs-test.tsx` — **4/4 PASSED**
- `src/domain/algorithms/__tests__/core-audit-verification-test.ts` (`AUDIT 5 — End-to-End Reactive Pipeline Integration`) — **3/3 PASSED**:
  - `updating completedCourses (0 -> Year 1 -> Year 1+2) updates backward chaining, topological sort, and schedule plan` (`PASS`)
  - `updating confidenceRatings (ALL(1) -> DEFAULT_CONF -> ALL(10)) updates fuzzy stress score, credit limit, and next-semester load` (`PASS`)
  - `toggling a single missing prerequisite (ANS001) immediately unblocks and schedules ANS002` (`PASS`)

### What Works (Verified)
1. **Reactive In-Memory Recalculation (`planner-context.tsx:109–134`):**
   - `backwardChaining`, `topologicalSort`, and `academicPlan` are derived via `useMemo` directly from `[completedCourses, confidenceRatings, profile.currentYearLevel, profile.currentSemester, profile.targetTimelineYears]`.
   - Updating completed courses (`0 -> 49 -> 95 units`) or confidence sliders (`ALL(1) -> DEFAULT_CONF -> ALL(10)`) immediately updates the stress score (`79% -> 56% -> 21%`), credit limit (`12 -> 15 -> 18 units`), course eligibility (`BLOCKED -> ELIGIBLE_NOW -> COMPLETED`), and recommended schedule without hardcoded results.

### Identified Problems
1. **HIGH — Toggling Course Completion in the Courses Tab Is Not Persisted to SQLite (`src/app/(tabs)/courses.tsx:276`):**
   - In `courses.tsx` line 276, tapping `"Mark as completed ✓"` / `"Completed ✓ — Tap to unmark"` calls `toggleCourseCompleted(selectedCourse.code)` (`planner-context.tsx:144`), which mutates in-memory React state (`setCompletedCourses`), **but never calls `persistCompletedCourses()`**.
   - If the user closes and reopens the app, all completion changes made from the Courses tab are lost.
2. **HIGH — `plan.tsx` Overrides Real Algorithm Metrics with Fake Nominal Formulas When `completedCourses.size === 0` (`src/app/(tabs)/plan.tsx:31–45`):**
   ```ts
   const displayedSemestersCount =
     completedCourses.size === 0 && profile.currentYearLevel > 1
       ? nominalRemainingSemesters
       : academicPlan.semestersToGraduation;

   const displayedCompletionPct =
     academicPlan.completionPercentage > 0
       ? academicPlan.completionPercentage
       : Math.round((academicPlan.nextSemester.totalUnits / academicPlan.totalDegreeUnits) * 100);
   ```
   - When a 2nd-year student has `0` completed courses (`completedCourses.size === 0`), the real algorithm computes `semestersToGraduation = 8` and `completionPercentage = 0%`. However, `plan.tsx` masks both numbers, displaying **`4 semesters to graduation`** and **`8% complete (15/178 units)`** (counting uncompleted next-semester courses as if already completed!).
3. **LOW — SQLite Curriculum & Generated Plan Tables Are Write-Only (`src/db/seed.ts`, `src/db/repository.ts:196–254`):**
   - `seedCurriculumData` populates `programs`, `courses`, and `course_prerequisites`, and `saveGeneratedAcademicPlan` writes `generated_plans` and `recommended_schedule_items`, but `loadPersistedPlannerState` only reads `student_profile`, `completed_courses`, and `confidence_ratings`. The app always evaluates against the in-memory `ANSCI_CURRICULUM` constant.

### Recommended Fixes
1. **Auto-Persist `toggleCourseCompleted` in `planner-context.tsx`:** Have `toggleCourseCompleted`, `markYearCoursesCompleted`, and `selectAllCourses` write through to `saveCompletedCourses(db, next)` (or call `persistCompletedCourses` inside `courses.tsx`).
2. **Remove Nominal Metric Overrides in `src/app/(tabs)/plan.tsx:31–45`:** Always display `academicPlan.semestersToGraduation`, `academicPlan.completionPercentage`, and `academicPlan.completedUnits` directly from the algorithm output.

---

## Critical Issues We Must Fix Before Submission (Prioritized)

| Priority | Issue ID | Component | Defect Summary | File & Lines |
| :-: | :-: | :--- | :--- | :--- |
| **P0** | **CRIT-01** | **Academic Scheduler** | **Fallback loop silently drops required courses & corrupts `CAS` standing:** `if (plannedCourses.length === 0)` adds up to 6 eligible courses to `simulatedCompleted` and executes `continue` without pushing them to `semesters`. Required courses disappear from the roadmap and `ANS191`/`ANS194` get scheduled before all Y1/Y2 courses appear in the plan. | `src/domain/algorithms/schedule-generator.ts:516–528` |
| **P0** | **CRIT-02** | **Academic Scheduler** | **Roadmap semesters `2..N` exceed their displayed credit limit:** Future semesters schedule up to `23` units (`termUnitCap = 23`) while displaying `recommendedUnitLimit = workloadAnalysis.recommendedUnits` (`12` or `15`), violating the credit cap on every future semester card. | `src/domain/algorithms/schedule-generator.ts:506, 547` |
| **P0** | **CRIT-03** | **End-to-End Integration** | **Courses tab completion toggle does not persist to SQLite:** `courses.tsx` calls `toggleCourseCompleted(code)` without persisting to `completed_courses`, losing changes across app restarts. | `src/app/(tabs)/courses.tsx:276`<br>`src/state/planner-context.tsx:144–154` |
| **P1** | **CRIT-04** | **End-to-End Integration** | **`plan.tsx` masks real algorithm outputs when `0` courses are completed:** Overrides `semestersToGraduation` (`8` $\to$ `4`) and `completionPercentage` (`0%` $\to$ `8%`) with nominal UI formulas instead of displaying `academicPlan` values. | `src/app/(tabs)/plan.tsx:31–45` |
| **P1** | **CRIT-05** | **Academic Scheduler** | **Wrong semester offering placement & `isOnTrack` bug:** `selectCoursesForSemester` places `FIRST`-semester courses in `SECOND` semesters (and vice versa), and `isOnTrack` compares remaining semesters against `targetYears * 2` (`8`) instead of remaining timeline semesters. | `src/domain/algorithms/schedule-generator.ts:268–271, 564–566` |
| **P1** | **CRIT-06** | **Academic Scheduler** | **Missing corequisite & SMC prerequisite guards:** `GEN001` can be scheduled without corequisite `CHM043.1` when `CHM043.1` is ineligible, and `SMC-1..3` (`prerequisites: []`) can be scheduled before any `SMC_OPTION` (`ANS141`–`ANS153`) is eligible. | `src/domain/algorithms/schedule-generator.ts:185–204, 314`<br>`src/domain/curriculum/ansci-curriculum.ts:329–349` |
| **P1** | **CRIT-07** | **Backward Chaining** | **Unresolved prerequisites (`AGF101`/`AGF102`) leave 3rd-year courses `ANS042`/`043`/`044` `ELIGIBLE_NOW` for 1st-year students with 0 completions.** | `src/domain/algorithms/dag-validator.ts:69–78`<br>`src/domain/algorithms/backward-chaining.ts:212–214` |
| **P2** | **CRIT-08** | **Mamdani FIS** | **Default `56%` dead-zone plateau, 3-step credit bucket (`{12, 15, 18}`), missing `OR` connective, and 7 provisional rules:** Membership gaps trap `[6.5, 7.5] × [5.5, 6.6]` at `56%`; intermediate credit limits like `14` are unreachable; and `OR` rules are not supported. | `src/domain/algorithms/fuzzy-workload.ts:129–265, 393–401` |
| **P2** | **CRIT-09** | **DAG & Topological Sort** | **Recursive `dfs()` in cycle detector & cycles do not halt scheduling:** `validateCurriculumDag` uses recursion (overflows at `20,000` nodes) and `generateAcademicSchedulePlan` silently drops cyclic courses instead of halting. | `src/domain/algorithms/dag-validator.ts:120–146`<br>`src/domain/algorithms/schedule-generator.ts:254` |

