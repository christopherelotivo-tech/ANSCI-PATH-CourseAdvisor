# CourseAdvisor / AnSciPath — Architecture, Mapping, Database & Algorithm Implementation Plan

**Project:** CourseAdvisor (visible UI brand: **AnSciPath**)  
**Program:** BS Agriculture, Major in Animal Science (Mindanao State University at Naawan, BOR Resolution No. 197-L, S. 2024, Effectivity SY 2025–2026)  
**Target Deadline:** Friday, October 30, 2026

---

## 1. Repository & Reference Document Inspection Report

All required reference documents were located in `docs/` and verified readable:

| Reference Item                            | Actual Repository Path                                                | Pages / Count            | Verification Status                                                      |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| System Workflow & User Journey            | `docs/Flow.pdf`                                                       | 9 pages                  | **Verified & Extracted**                                                 |
| System Architecture & Algorithms          | `docs/SystemArchitecture.pdf`                                         | 4 pages                  | **Verified & Extracted**                                                 |
| Official UI Prototype PDF (`UI FLOW.pdf`) | `docs/CourseAdvisor_UI_Design.pdf`                                    | 15 pages                 | **Verified & Extracted**                                                 |
| Official Animal Science Curriculum        | `docs/AnimalScienceCurriculum.pdf`                                    | 5 pages                  | **Verified & Transcribed** (`src/domain/curriculum/ansci-curriculum.ts`) |
| Exported UI Reference Screenshots         | `docs/ui-screenshots/01_Welcome_Get_Started.png` .. `15_Settings.png` | 15 PNG files (1190×1684) | **Exported & Verified**                                                  |

### Naming Difference Flagged for Confirmation

- **UI Prototype Branding:** `"AnSciPath"` (`"PLAN YOUR ANIMAL SCIENCE DEGREE"`) on `01_Welcome_Get_Started.png`.
- **Architecture & Flow Documents:** `"CourseAdvisor"` / `"CourseAdvisor Mobile"`.
- **Action Taken:** We preserve `"AnSciPath"` in the visible UI to match the supplied design prototype while keeping `"CourseAdvisor"` as the internal package/project identifier (`courseadvisor` in `package.json` / `CourseAdvisor` in `app.json`), so both references remain consistent until final naming confirmation.

---

## 2. Kotlin Native Architecture vs. React Native (Expo) Implementation

Per Section 1 of the Master Prompt, we are intentionally implementing the system using **React Native + Expo + TypeScript** instead of the original native Kotlin/Jetpack Compose/Room stack described in `docs/SystemArchitecture.pdf`. All architectural layers and algorithmic behaviors are preserved 1-to-1:

| Subsystem / Layer             | Original Specification (`SystemArchitecture.pdf`)                              | React Native Implementation (This Repository)                                                                                                        | Behavioral Equivalence                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Presentation / UI Layer**   | Jetpack Compose + Material 3 + Custom Canvas                                   | React Native (`View`, `Text`, `Pressable`, `ScrollView`, `StyleSheet`) + `expo-image` + `react-native-svg` (for interactive graphs & gauges)         | Identical declarative component rendering derived from immutable state.                                                                                |
| **Navigation**                | Android Jetpack Navigation / Compose NavigationStack                           | **Expo Router** (`src/app/_layout.tsx`, `src/app/onboarding/*`, `src/app/(tabs)/*`)                                                                  | File-based typed routing supporting onboarding stack and 4-tab main workspace (`Plan`, `Courses`, `Graph`, `Settings`).                                |
| **State Management (UDF)**    | Kotlin ViewModel + `StateFlow` / `SharedFlow` (MVI / Unidirectional Data Flow) | React Context + Custom Hooks + Reducer/Async pipeline (`src/state/planner-context.tsx`)                                                              | User actions trigger deterministic recalculations and emit fresh immutable state to views.                                                             |
| **Domain & Algorithmic Core** | Zero-dependency Kotlin modules on `Dispatchers.Default`                        | Zero-dependency TypeScript modules in `src/domain/algorithms/*`                                                                                      | 100% pure functions for DAG validation, cycle detection, Backward Chaining, Kahn's topological sort, Mamdani Fuzzy Inference, and Schedule Generation. |
| **Local Persistence Engine**  | Room Database over SQLite with `@Relation` and recursive CTEs                  | **Expo SQLite** (`expo-sqlite` SDK 58) with WAL journal mode, foreign keys, `PRAGMA user_version` migrations, and recursive CTE support (`src/db/*`) | Identical relational SQLite storage on-device, 100% offline-first, persisting across app restarts.                                                     |
| **Automated Testing**         | JUnit + Jetpack Compose UI Tests                                               | **Jest (`jest-expo`)** + `@testing-library/react-native`                                                                                             | Unit tests for curriculum data, graph/fuzzy algorithms, SQLite repository operations, and screen rendering.                                            |
| **Build & Packaging**         | Gradle Android APK build                                                       | **EAS Build** (`eas build -p android`) / `npx expo run:android`                                                                                      | Produces installable Android APK.                                                                                                                      |

---

## 3. Screen-to-File Mapping (All 15 Official Reference Screens + System Flow Stages)

| Screenshot Filename                   | UI Screen / Stage Name                                                  | Expo Router File Path                         | Reusable Components / Modules Used                                                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `01_Welcome_Get_Started.png`          | **1. Welcome / Get Started**                                            | `src/app/index.tsx`                           | `AnSciPathBadge`, `WelcomeBottomCard`, `farm-background.png`                                                                                                                                           |
| `02_Student_Setup.png`                | **2. Student Setup** (`STEP 1 OF 3 · YOUR PROFILE`)                     | `src/app/onboarding/student-setup.tsx`        | `OnboardingHeader`, `FormField`, `SelectModalField`, `StickyContinueCard`, `cels-msun-logo.png`, `ansci-student-society-logo.png`                                                                      |
| `03_Academic_Goal.png`                | **3. Academic Goal** (`STEP 1 OF 3 · YOUR GOAL`)                        | `src/app/onboarding/academic-goal.tsx`        | `OnboardingHeader`, `GoalSelectionCard`, `TimelineSelectorPills` (`4 Years`, `5 Years`, `6 Years`), `StickyContinueCard`                                                                               |
| `04_Completed_Courses_1st_Year.png`   | **4. Completed Courses — 1st Year Tab** (`STEP 2 OF 3 · YOUR PROGRESS`) | `src/app/onboarding/completed-courses.tsx`    | `OnboardingHeader`, `YearLevelTabs` (ordered: **1st, 2nd, 3rd, 4th Year**), `SemesterCourseChecklist`, `StickyContinueCard`                                                                            |
| `05_Completed_Courses_2nd_Year.png`   | **4. Completed Courses — 2nd Year Tab**                                 | `src/app/onboarding/completed-courses.tsx`    | Same screen, active tab state = `2`                                                                                                                                                                    |
| `07_Completed_Courses_3rd_Year.png`   | **4. Completed Courses — 3rd Year Tab**                                 | `src/app/onboarding/completed-courses.tsx`    | Same screen, active tab state = `3` (logical order preserved)                                                                                                                                          |
| `06_Completed_Courses_4th_Year.png`   | **4. Completed Courses — 4th Year Tab**                                 | `src/app/onboarding/completed-courses.tsx`    | Same screen, active tab state = `4` (includes `SMC-1`, `SMC-2`, `SMC-3` slots + Specialized Major Course options)                                                                                      |
| `08_Confidence_Rating.png`            | **5. Rate Your Confidence** (`STEP 2 OF 3 · YOUR CONFIDENCE`)           | `src/app/onboarding/confidence-rating.tsx`    | `OnboardingHeader`, `ConfidenceSliderRow` (`Mathematics`, `Science`, `Agriculture`, `Animal Science`, `Research` 1–10), `StickyContinueCard`                                                           |
| `09_Analyzing_Requirements.png`       | **6. Analyzing Requirements** (`STEP 3 OF 3 · BUILDING YOUR PLAN`)      | `src/app/onboarding/analyzing.tsx`            | `OnboardingHeader`, `AnalysisStepChecklist`, `PrerequisiteAnalysisModal` (surfaces Backward Chaining & Topological Tier details per `Flow.pdf` stages 6–9), `StickyContinueCard` (`See my pathway ->`) |
| `10_Workload_Analysis.png`            | **7. Workload Analysis** (`STEP 3 OF 3 · YOUR WORKLOAD`)                | `src/app/onboarding/workload-analysis.tsx`    | `OnboardingHeader`, `StressSemicircleGauge`, `CreditLimitCard`, `FactorsConsideredList`, `StickyContinueCard`                                                                                          |
| `11_Recommended_Schedule.png`         | **8. Recommended Schedule** (`STEP 3 OF 3 · YOUR PLAN`)                 | `src/app/onboarding/recommended-schedule.tsx` | `OnboardingHeader`, `TermSummaryHeaderCard`, `RecommendedCourseRow` (with expandable `"Why this course?"` placement explanation per `Flow.pdf`), `StickyContinueCard`                                  |
| `12_Your_Plan_Roadmap.png`            | **9. Your Plan / Roadmap Tab** (`YOUR PLAN`)                            | `src/app/(tabs)/plan.tsx`                     | `MainTabHeader` (with initials avatar), `OnTrackHeroCard` (progress ring + semesters to graduation), `StressNoticeBanner`, `SemesterRoadmapCard`                                                       |
| `13_Courses_Catalog.png`              | **10. Courses Catalog Tab** (`YOUR DEGREE`)                             | `src/app/(tabs)/courses.tsx`                  | `MainTabHeader`, `CourseSearchBar`, `DegreeProgressCard` (`X of 178 credits`), `CourseFilterPills` (`All`, `Completed`, `Planned`, `Available`), `CatalogCourseRow`                                    |
| `14_Goal_Path_Prerequisite_Graph.png` | **11. Goal Path / Prerequisite Graph Tab** (`COURSE MAP`)               | `src/app/(tabs)/graph.tsx`                    | `MainTabHeader`, `GraphStatusLegend` (`Complete`, `Next up`, `Later`), `InteractivePrerequisiteGraph`, `NodeDetailCard`, `HowToReadMapCard`                                                            |
| `15_Settings.png`                     | **12. Settings Tab** (`Settings`)                                       | `src/app/(tabs)/settings.tsx`                 | `MainTabHeader`, `StudentProfileCard`, `PlanSummaryCard`, `PrivacyLocalDataCard`, `ResetPlanButton` (`Start a new academic plan`)                                                                      |

---

## 4. Database Schema & Persistence Plan (Expo SQLite)

Database filename: `courseadvisor.db`  
Managed in `src/db/schema.ts`, `src/db/database.ts`, and `src/db/repository.ts`.

### Tables & Constraints

1. **`programs`**
   - `code TEXT PRIMARY KEY NOT NULL` (`'BSA-ANSCI'`)
   - `name TEXT NOT NULL` (`'Bachelor of Science in Agriculture'`)
   - `major TEXT NOT NULL` (`'Animal Science'`)
   - `institution TEXT NOT NULL` (`'Mindanao State University at Naawan'`)
   - `effectivity TEXT NOT NULL` (`'SY 2025-2026'`)
   - `grand_total_units INTEGER NOT NULL` (`178`)
   - `nstp_units INTEGER NOT NULL` (`6`)

2. **`courses`**
   - `code TEXT PRIMARY KEY NOT NULL` (e.g., `'GEC101'`, `'AGR003'`, `'ANS040'`, `'SMC-1'`, `'ANS141'`)
   - `source_code TEXT` (e.g., `'AGROO3'` where source PDF had a typo)
   - `program_code TEXT NOT NULL REFERENCES programs(code) ON DELETE CASCADE`
   - `title TEXT NOT NULL`
   - `units INTEGER NOT NULL CHECK (units >= 0)`
   - `credit_bearing INTEGER NOT NULL DEFAULT 1 CHECK (credit_bearing IN (0, 1))`
   - `lec_hours INTEGER`
   - `lab_hours INTEGER`
   - `hours_are_term_total INTEGER NOT NULL DEFAULT 0 CHECK (hours_are_term_total IN (0, 1))`
   - `year_level INTEGER CHECK (year_level IN (1, 2, 3, 4) OR year_level IS NULL)`
   - `semester TEXT CHECK (semester IN ('FIRST', 'SECOND', 'SUMMER') OR semester IS NULL)`
   - `kind TEXT NOT NULL CHECK (kind IN ('REGULAR', 'SMC_SLOT', 'SMC_OPTION'))`
   - `standing_requirement TEXT` (`'CAS'` or `NULL`)
   - `notes_json TEXT`

3. **`course_prerequisites`** (Adjacency list for DAG & recursive CTEs)
   - `course_code TEXT NOT NULL REFERENCES courses(code) ON DELETE CASCADE`
   - `prerequisite_code TEXT NOT NULL` _(Note: not foreign-key constrained to `courses(code)` so unresolved source codes `AGF101` / `AGF102` can be stored and queried transparently with `is_unresolved = 1`)_
   - `dependency_type TEXT NOT NULL DEFAULT 'PREREQUISITE' CHECK (dependency_type IN ('PREREQUISITE', 'COREQUISITE'))`
   - `is_unresolved INTEGER NOT NULL DEFAULT 0 CHECK (is_unresolved IN (0, 1))`
   - `PRIMARY KEY (course_code, prerequisite_code, dependency_type)`

4. **`student_profile`**
   - `id INTEGER PRIMARY KEY CHECK (id = 1)` (single active profile on device)
   - `full_name TEXT NOT NULL`
   - `student_id TEXT NOT NULL`
   - `current_year_level INTEGER NOT NULL CHECK (current_year_level BETWEEN 1 AND 4)`
   - `current_semester TEXT NOT NULL CHECK (current_semester IN ('FIRST', 'SECOND', 'SUMMER'))`
   - `program_code TEXT NOT NULL REFERENCES programs(code)`
   - `goal_type TEXT NOT NULL DEFAULT 'COMPLETE_PROGRAM'`
   - `target_timeline_years INTEGER NOT NULL DEFAULT 4 CHECK (target_timeline_years IN (4, 5, 6))`
   - `onboarding_completed INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_completed IN (0, 1))`
   - `updated_at TEXT NOT NULL`

5. **`completed_courses`**
   - `course_code TEXT PRIMARY KEY NOT NULL REFERENCES courses(code) ON DELETE CASCADE`
   - `completed_at TEXT NOT NULL`

6. **`confidence_ratings`**
   - `subject_area TEXT PRIMARY KEY NOT NULL CHECK (subject_area IN ('Mathematics', 'Science', 'Agriculture', 'Animal Science', 'Research'))`
   - `rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10)`
   - `updated_at TEXT NOT NULL`

7. **`generated_plans`**
   - `id INTEGER PRIMARY KEY CHECK (id = 1)`
   - `stress_score INTEGER NOT NULL CHECK (stress_score BETWEEN 0 AND 100)`
   - `stress_label TEXT NOT NULL CHECK (stress_label IN ('Balanced', 'Moderate', 'Challenging', 'Overload Risk'))`
   - `recommended_credit_limit INTEGER NOT NULL CHECK (recommended_credit_limit BETWEEN 12 AND 23)`
   - `semesters_remaining INTEGER NOT NULL`
   - `completion_percentage INTEGER NOT NULL`
   - `plan_json TEXT NOT NULL` (serialized roadmap & explanations for rapid reload)
   - `generated_at TEXT NOT NULL`

8. **`recommended_schedule_items`**
   - `id INTEGER PRIMARY KEY AUTOINCREMENT`
   - `semester_index INTEGER NOT NULL` (`0` = Next Semester, `1..N` = subsequent roadmap terms)
   - `year_level INTEGER NOT NULL`
   - `semester TEXT NOT NULL`
   - `course_code TEXT NOT NULL REFERENCES courses(code)`
   - `units INTEGER NOT NULL`
   - `placement_reason TEXT NOT NULL`
   - `tier INTEGER NOT NULL`

---

## 5. Algorithm Implementation Plan (`src/domain/algorithms/`)

1. **`dag-validator.ts`**
   - Builds the directed prerequisite graph $G = (V, E)$ from `ANSCI_CURRICULUM`.
   - Runs three-color DFS cycle detection and Kahn's in-degree verification to guarantee zero circular loops.
   - Identifies unresolved prerequisite references (`AGF101`, `AGF102` on `ANS042`, `ANS043`, `ANS044`) as explicit diagnostic warnings without crashing traversal.

2. **`backward-chaining.ts`**
   - Accepts a target goal (default: all graduation-required courses in `BSA-ANSCI`, or a specific target course such as `ANS199` Thesis / `ANS040`) and the student's `completedCourseCodes` set.
   - Recursively walks prerequisite and corequisite chains backward from target nodes, pruning any node already in `completedCourseCodes`.
   - Evaluates `CAS` standing (Certificate of Agricultural Science = all 1st & 2nd Year courses completed) for `ANS191` and `ANS194`.
   - Outputs: `remainingRequiredCourses`, `eligibleNowCourses`, `blockedCourses` (with exact missing prerequisites), and `goalPathNodes` for the Goal Path graph screen.

3. **`topological-sort.ts`**
   - Runs Kahn's topological sorting over the remaining required courses subgraph.
   - Assigns each course to its prerequisite depth tier (`Tier 0` = no unsatisfied prerequisites; `Tier k` = depends on at least one course in `Tier k - 1`).
   - Computes the critical path length (minimum number of terms physically required by prerequisite chains) to check against the student's selected timeline (`4`, `5`, or `6` years).

4. **`fuzzy-workload.ts`**
   - Implements the Mamdani Fuzzy Inference System:
     - **Inputs:** Student Confidence $C \in [1, 10]$ (from the 5 subject sliders) and Course Difficulty $D \in [1, 10]$.
     - **Fuzzification:** Triangular/trapezoidal membership functions for `Low`, `Medium`/`Moderate`, and `High`/`Hard`.
     - **Rule Base:** Implements the two explicitly documented rules from `Flow.pdf` & `SystemArchitecture.pdf`:
       1. `IF Confidence IS Low AND Difficulty IS Hard THEN Risk IS Very High`
       2. `IF Confidence IS High AND Difficulty IS Moderate THEN Risk IS Low`
          Plus a clearly flagged, configurable provisional rule matrix for the remaining combinations (documented below in Section 6).
     - **Aggregation & Centroid Defuzzification:** Integrates the aggregated output membership function over $[0, 100]$ to compute the crisp **Semester Stress Score ($0\text{–}100\%$)** and maps it to the **Recommended Credit Limit ($12\text{–}18$ units)**.

5. **`schedule-generator.ts`**
   - Combines Backward Chaining eligibility, Topological Tiers, semester offerings (`FIRST`, `SECOND`, `SUMMER`), corequisite pairing (`CHM033`+`CHM033.1`, `CHM043`+`CHM043.1`, `GEN001`+`CHM043.1`), and the Fuzzy credit limit to build both the **Next Semester Recommended Schedule** and the multi-semester **Academic Roadmap**.
   - Generates a human-readable explanation for every scheduled course (e.g., _"Required 2nd Year 1st Semester course; prerequisite CHM033 satisfied; unlocks GEN001"_).

---

## 6. Missing / Ambiguous Academic Requirements Identified in Source Documents

In strict compliance with Sections 2, 7, 8, and 10 of the Master Prompt (**"Do not invent missing requirements and present them as approved"**), the following source-document gaps were identified during inspection:

1. **Unresolved Prerequisite Codes `AGF101` and `AGF102` (`docs/AnimalScienceCurriculum.pdf`, Page 3):**
   - In the official curriculum PDF, `ANS042` (_Animal Health and Diseases_) and `ANS043` (_Principles and Practices of Animal Breeding_) list `AGF101` (printed in red ink) as their prerequisite, and `ANS044` (_Forage and Pasture Management_) lists `AGF101, AGF102` (printed in red ink).
   - Neither `AGF101` nor `AGF102` exists anywhere in the BS Agriculture (Animal Science) curriculum tables. (They appear to be legacy course codes from an older curriculum revision for `ANS001`/`ANS040`/`CRS001`).
   - **Handling Plan:** Recorded faithfully in `src/domain/curriculum/ansci-curriculum.ts` with diagnostic notes. The DAG validator flags them as unresolved source prerequisites so the student is informed transparently rather than silently deadlocking 3rd-year Animal Science courses.

2. **Biochemistry Corequisite Reference (`CHM043` and `CHM043.1`, Page 2):**
   - Both `CHM043` (_General Biochemistry_, 2nd Year 1st Sem) and `CHM043.1` (_General Biochemistry Laboratory_, 2nd Year 1st Sem) list prerequisite `CHM033` and corequisite `CHM033.1` (which is 1st Year Organic Chemistry Lab). In `GEN001` (2nd Year 2nd Sem), `CHM043` is the prerequisite and `CHM043.1` is the corequisite.
   - **Handling Plan:** Preserved as printed in `ansci-curriculum.ts` with a note flagging that `CHM043` and `CHM043.1` are co-scheduled in 2nd Year 1st Semester (as shown in screenshot `11_Recommended_Schedule.png`).

3. **Typo in Course Code `AGROO3` (Page 2):**
   - _Methods of Agricultural Research_ is printed as `AGROO3` (with capital letter `O`s) on page 2 of `AnimalScienceCurriculum.pdf`, while the UI prototype (`05_Completed_Courses_2nd_Year.png`, `11_Recommended_Schedule.png`, `12_Your_Plan_Roadmap.png`) normalizes it to `AGR003`.
   - **Handling Plan:** Stored with normalized primary code `AGR003` and `sourceCode: 'AGROO3'`.

4. **Missing Course Difficulty Values ($1\text{–}10$) and Subject Area Mapping:**
   - `Flow.pdf` (pages 8–9) and `SystemArchitecture.pdf` (page 2) state that the system retrieves a course's difficulty ($1\text{–}10$) and compares it with the student's confidence rating ($1\text{–}10$) in 5 areas (`Mathematics`, `Science`, `Agriculture`, `Animal Science`, `Research`). However, `AnimalScienceCurriculum.pdf` only provides course codes, titles, units, lecture/lab hours, prerequisites, and corequisites—it does not include a column for course difficulty ($1\text{–}10$).
   - **Handling Plan:** In Milestone 4 (Fuzzy Workload Engine), we will derive transparent baseline difficulty values from objective curriculum attributes (lecture/lab hour intensity, prerequisite depth, and course prefix mapping: `GEC104`->Math, `CHM`/`GEN`/`ABT`->Science, `AGR`/`CRS`/`SSC`/`CRP`/`ABE`/`AEC`/`AEX`/`ABM`/`HAL`->Agriculture, `ANS`->Animal Science, `AGR003`/`ANS191`–`ANS199`->Research) and clearly mark this mapping as a configurable heuristic awaiting final faculty difficulty tables.

5. **Incomplete Mamdani Fuzzy Rule Table (`Flow.pdf`, Page 9):**
   - `Flow.pdf` explicitly notes: _"The project documents explicitly provide the two rules above as examples. They do not provide a complete rule table. Therefore, the full IF–THEN rule base should not be invented yet; it should be defined and approved by the group/project requirements before implementing the complete fuzzy engine."_
   - **Handling Plan:** The fuzzy engine will separate the 2 official approved rules from the configurable fallback rules required to evaluate all 9 (`Low`/`Medium`/`High` × `Easy`/`Moderate`/`Hard`) cells, and clearly label the provisional rules in code and documentation for group approval.

---

## 7. Prioritized Development Checklist

- [x] **Milestone 1 (Priority 1 — Current Task):**
  - [x] Inspect entire repository and verify all 4 PDFs (`Flow.pdf`, `SystemArchitecture.pdf`, `CourseAdvisor_UI_Design.pdf`, `AnimalScienceCurriculum.pdf`).
  - [x] Export and inspect all 15 UI reference screenshots in `docs/ui-screenshots/`.
  - [x] Set up asset directories (`assets/images/backgrounds/`, `assets/images/illustrations/`, `assets/images/branding/`, `assets/icons/`, `assets/fonts/`) and `ASSET_INVENTORY.md`.
  - [x] Create the 4 project Antigravity skills in `.agents/skills/` (`react-native-ui`, `courseadvisor-architecture`, `algorithm-implementation`, `testing-debugging`) and update `AGENTS.md`.
  - [x] Transcribe and unit-test the complete BS Agriculture (Animal Science) curriculum (`src/domain/curriculum/`).
  - [x] Establish Expo SQLite database schema, migrations, and curriculum seeding (`src/db/`).
  - [x] Implement the application navigation shell and the **Welcome Screen (`01_Welcome_Get_Started.png`)** (`src/app/index.tsx`).
  - [x] Run `npx tsc --noEmit`, `npx expo lint`, and `npm test` to verify Milestone 1.
- [x] **Milestone 2 (Priority 2 — Student Onboarding & Completed Courses):**
  - [x] Implement `02_Student_Setup.png` (`src/app/onboarding/student-setup.tsx`) with local SQLite persistence.
  - [x] Implement `03_Academic_Goal.png` (`src/app/onboarding/academic-goal.tsx`) with 4/5/6-year timeline selection.
  - [x] Implement `04`–`07_Completed_Courses_*.png` (`src/app/onboarding/completed-courses.tsx`) with 1st, 2nd, 3rd, and 4th Year tabs in logical order, per-semester `Select All`, `Complete this year`, and SQLite persistence.
  - [x] Implement `08_Confidence_Rating.png` (`src/app/onboarding/confidence-rating.tsx`) with 5 subject-area sliders (`1–10`) and SQLite persistence.
- [x] **Milestone 3 (Priority 3 — Prerequisite Graph, Backward Chaining & Topological Sort):**
  - [x] Implement and unit-test `dag-validator.ts`, `backward-chaining.ts`, and `topological-sort.ts`.
  - [x] Implement `09_Analyzing_Requirements.png` (`src/app/onboarding/analyzing.tsx`) connected to the real prerequisite analysis pipeline.
- [x] **Milestone 4 (Priority 4 — Mamdani Fuzzy Workload Engine & Schedule Generator):**
  - [x] Implement and unit-test `fuzzy-workload.ts` and `schedule-generator.ts`.
  - [x] Implement `10_Workload_Analysis.png` (`src/app/onboarding/workload-analysis.tsx`) with dynamic semicircle stress gauge and recommended credit limit.
  - [x] Implement `11_Recommended_Schedule.png` (`src/app/onboarding/recommended-schedule.tsx`) with placement explanations.
- [x] **Milestone 5 (Priority 5 — Main Application Tabs):**
  - [x] Implement `12_Your_Plan_Roadmap.png` (`src/app/(tabs)/plan.tsx`).
  - [x] Implement `13_Courses_Catalog.png` (`src/app/(tabs)/courses.tsx`) with search and `All / Completed / Planned / Available` filters.
  - [x] Implement `14_Goal_Path_Prerequisite_Graph.png` (`src/app/(tabs)/graph.tsx`) with interactive node visualization.
  - [x] Implement `15_Settings.png` (`src/app/(tabs)/settings.tsx`) with profile summary and `"Start a new academic plan"` reset workflow.
- [x] **Milestone 6 (Priority 6 — End-to-End QA & APK Build Readiness):**
  - [x] Full end-to-end persistence and edge-case testing.
  - [x] Configure `eas.json` for installable Android APK (`preview` / `apk` build profile) and verify build readiness before Friday, October 30, 2026.

---

## 8. Running the Application & Building the Android APK

### Local Development
```bash
npx expo start
```
- Press `w` to launch in a desktop web browser.
- Press `a` to open on an Android emulator (Android Studio).
- Scan the QR code using the **Expo Go** app on an Android device.

### Quality Verification Gate
```bash
npx tsc --noEmit
npx eslint .
npm test -- --watchAll=false
```

### Building an Installable Android `.apk` (EAS Build)
`eas.json` is pre-configured with `"buildType": "apk"` under the `preview` and `apk` profiles:
```bash
npx eas-cli@latest build --platform android --profile apk
```
Or to build locally with Android Studio / Gradle:
```bash
npx expo run:android --variant release
```
