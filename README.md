# AnSciPath / CourseAdvisor 🌾
### Intelligent Academic Planning & Prerequisite Advising Engine for BS Agriculture (Major in Animal Science)

**AnSciPath** (internal package: `CourseAdvisor`) is an offline-first, mobile-first academic advising and semester schedule generator built specifically for **BS Agriculture, Major in Animal Science** students at **Mindanao State University at Naawan (MSUN)**.

Designed under **BOR Resolution No. 197-L, S. 2024** (Effectivity: SY 2025–2026, aligned with **CHED CMO No. 23, Series of 2021**), AnSciPath replaces static degree checklists with an intelligent dual-engine core: **Backward Chaining over a Directed Acyclic Graph (DAG)** and a **Mamdani Fuzzy Inference System** for personalized workload balancing.

---

## 📖 Key Features & System Workflow

The application implements 100% of the 14-stage workflow documented in `docs/Flow.pdf` and the 15 prototype screens from `docs/CourseAdvisor_UI_Design.pdf`:

1. **Welcome & Quick Start (`01_Welcome_Get_Started`)**:
   - Clear onboarding with MSUN CELS and Animal Science Student Society branding.
   - Auto-detection of existing offline plans with 1-tap restore.
2. **Student Setup (`02_Student_Setup`)**:
   - Form capturing student name, ID, year level (1st–4th Year), and current semester.
3. **Academic Goal (`03_Academic_Goal`)**:
   - Program confirmation (**BS Agriculture – Major in Animal Science**, 178 credit units) and timeline selection (4, 5, or 6 Years).
4. **Completed Course Checklist (`04`–`07_Completed_Courses_*.png`)**:
   - Logical tabbed navigation (**1st Year**, **2nd Year**, **3rd Year**, **4th Year**).
   - Features `"Complete this year"`, per-semester `"Select All"`, and individual course checkboxes.
   - Supports Specialized Major Course slots (`SMC-1`, `SMC-2`, `SMC-3`) and options (`ANS141`–`ANS153`).
5. **Confidence Rating Sliders (`08_Confidence_Rating`)**:
   - Touch-draggable (1–10) sliders across 5 key subject areas: **Mathematics**, **Science**, **Agriculture**, **Animal Science**, and **Research**.
6. **Progressive Course Analysis (`09_Analyzing_Requirements`)**:
   - Real-time animated checklist verifying DAG integrity, pruning completed courses, and building topological order.
   - Interactive breakdown tabs:
     - **Prerequisite Status**: Backward Chaining evaluation distinguishing eligible vs. blocked courses.
     - **ANS040 Graph**: Visual prerequisite tree showing `ANS040` (Anatomy & Physiology) dependent on `AGR001` (Intro to Ag) and `CRS001` (Crop Production).
     - **Course Tiers**: Kahn's topological sort tiers (`Tier 0` to `Tier 4`).
7. **Workload Analysis & Fuzzy Engine (`10_Workload_Analysis`)**:
   - Animated semicircle gauge displaying crisp semester stress ($0\text{–}100\%$).
   - Green / Amber / Red workload traffic-light indicator.
   - Recommended credit limit ($12\text{–}18$ units) and expandable **Mamdani Fuzzy Engine Inspector** (Fuzzification $\rightarrow$ IF–THEN Rule Evaluation $\rightarrow$ Centroid Defuzzification).
8. **Recommended Next-Semester Schedule (`11_Recommended_Schedule`)**:
   - Term schedule respecting prerequisite sequencing, corequisite pairing (e.g. `CHM043` + `CHM043.1`), and credit caps.
   - Per-course stress badges and expandable **"Why this course? ▼"** placement explanation cards.
9. **Your Plan & Academic Roadmap (`12_Your_Plan_Roadmap`)**:
   - Dashboard hero card with progress ring and graduation timeline projection.
   - Quick navigation shortcuts to Courses, Prerequisite Graph, and Workload settings.
   - Multi-semester roadmap from Year 1 through Year 4 (including Summer Practicum & OJT terms).
   - Tappable roadmap courses revealing placement reasons and prerequisite details.
   - Automatic **"Extended Term Required"** resolution prompt when prerequisite depth exceeds the target timeline.
10. **Course Catalog (`13_Courses_Catalog`)**:
    - Searchable course inventory with degree progress tracking.
    - Filter pills: `All`, `Completed`, `Planned`, `Available`.
    - Surfaces curriculum notices (such as legacy source codes `AGF101`/`AGF102`).
11. **Interactive Goal Path Graph (`14_Goal_Path_Prerequisite_Graph`)**:
    - Milestone spine (`ANS001` $\rightarrow$ `ANS002` $\rightarrow$ `ANS040` $\rightarrow$ `ANS197` $\rightarrow$ `ANS199` Thesis).
    - View modes: Goal Path, ANS040 Tree, and Course Ordering Tiers.
    - Zoom toggle ($100\% / 110\%$) and inspector card with 1-tap navigation to missing prerequisite courses.
12. **Settings & Data Management (`15_Settings`)**:
    - Student profile summary, planning window, recommended workload parameters.
    - Offline data privacy guarantee and 1-tap `"Start a new academic plan"` reset.

---

## 🧠 Algorithmic Core (`src/domain/algorithms/`)

All algorithms are built as pure, zero-dependency TypeScript modules adhering to Clean Architecture principles:

* **DAG Validator & Cycle Detection (`dag-validator.ts`)**:
  - Builds directed graph $G = (V, E)$ from the official curriculum.
  - Three-color DFS cycle detection ensures zero circular prerequisite loops.
* **Backward Chaining Inference Engine (`backward-chaining.ts`)**:
  - Recursively traverses prerequisite chains backward from graduation targets or capstone goals (`ANS199`).
  - Prunes completed courses and evaluates Certificate of Agricultural Science (`CAS`) standing for upper-division courses (`ANS191`, `ANS194`).
* **Topological Sort & Tier Assignment (`topological-sort.ts`)**:
  - Kahn's algorithm computes prerequisite levels (`Tier 0`: immediate, `Tier k`: depends on `Tier k-1`).
  - Determines Critical Path Length (minimum semesters physically needed by dependency chains).
* **Mamdani Fuzzy Inference System (`fuzzy-workload.ts`)**:
  - **Inputs**: Student Confidence $C \in [1, 10]$ and Course Difficulty $D \in [1, 10]$.
  - **Fuzzification**: Triangular and trapezoidal membership functions (`Low`, `Medium`/`Moderate`, `High`/`Hard`).
  - **Rule Base**: Evaluates official rules (e.g. `IF Confidence IS Low AND Difficulty IS Hard THEN Risk IS Very High`) and provisional fallback matrix.
  - **Centroid Defuzzification**: Pointwise max-aggregation and centroid integration computing crisp Stress ($0\text{–}100\%$) mapped to credit bounds ($12\text{–}18$ units).
* **Schedule & Roadmap Generator (`schedule-generator.ts`)**:
  - Pairs lecture and laboratory corequisites (`CHM033`+`CHM033.1`, `CHM043`+`CHM043.1`).
  - Generates transparent, human-readable explanations (`reason`) for every course placement.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | **React Native + Expo** | Expo SDK 58, React Native 0.88.0, React 19 |
| **Language** | **TypeScript 6.0** | Strict typing with comprehensive domain models |
| **Navigation** | **Expo Router 58** | Typed file-based routing (`src/app/`) |
| **Local Persistence** | **Expo SQLite 58** | Relational on-device SQLite database with WAL mode & migrations |
| **State Management** | **React Context + Hooks** | Unidirectional Data Flow (`src/state/planner-context.tsx`) |
| **Quality & Testing** | **Jest + Testing Library** | `jest-expo` with unit and component tests (38 tests) |
| **Build & Packaging** | **EAS Build** | Cloud & local APK generation (`preview` / `apk` profile) |

---

## 📁 Project Structure

```text
CourseAdvisor/
├── .agents/skills/              # Antigravity development skills & workflows
├── assets/                      # Application assets (logos, badges, icons, fonts)
│   ├── icons/
│   ├── images/branding/
│   └── images/illustrations/
├── docs/                        # Specifications, curriculum PDF, and UI screenshots
│   ├── ui-screenshots/          # 15 reference screenshots from UI prototype
│   ├── AnimalScienceCurriculum.pdf
│   ├── CourseAdvisor_UI_Design.pdf
│   ├── Flow.pdf
│   └── SystemArchitecture.pdf
├── src/
│   ├── app/                     # Expo Router navigation routes
│   │   ├── (tabs)/              # Main tab screens (plan, courses, graph, settings)
│   │   ├── onboarding/          # Multi-step student onboarding flow
│   │   ├── index.tsx            # Welcome screen
│   │   └── _layout.tsx          # Root layout & providers
│   ├── components/              # Reusable UI components
│   │   ├── onboarding/          # Gauges, sliders, step headers, continue cards
│   │   └── tabs/                # Tab headers, avatars, badges
│   ├── constants/               # Brand theme tokens & palettes
│   ├── db/                      # Relational SQLite schema, migrations, seeders & repository
│   ├── domain/
│   │   ├── algorithms/          # Pure DAG, Backward Chaining, FIS, Scheduler logic
│   │   └── curriculum/          # Official BS Agriculture (Animal Science) dataset
│   └── state/                   # PlannerContext bridging SQLite, algorithms, & UI
├── app.json                     # Expo application configuration (edu.msunaawan.courseadvisor)
├── eas.json                     # EAS Build configuration for APK generation
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+ recommended)
* [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
* Android Studio (for Android Emulator) or the **Expo Go** app on an Android device

### 1. Installation
```bash
git clone https://github.com/christopherelotivo-tech/ANSCI-PATH-CourseAdvisor.git
cd ANSCI-PATH-CourseAdvisor
npm install
```

### 2. Start Local Development Server
```bash
npx expo start
```
* Press `a` to open in an Android Emulator.
* Press `w` to open in a web browser.
* Scan the QR code using the **Expo Go** Android app.

---

## 🧪 Verification & Quality Gate

Run all verification suites locally before committing changes:

```bash
# Typecheck
npx tsc --noEmit

# Lint check
npx eslint .

# Unit & Component Tests (38 tests)
npm test -- --watchAll=false
```

---

## 📦 Building an Installable Android APK

The repository is pre-configured with `eas.json` for APK generation:

```bash
# Build via EAS Cloud Build (generates downloadable .apk)
npx eas-cli@latest build --platform android --profile apk

# Or build locally using Android Studio / Gradle
npx expo run:android --variant release
```

---

## 📜 Academic Integrity & Source Notes

* **Curriculum Authority**: Derived directly from Mindanao State University at Naawan (MSUN) College of Education and Liberal Sciences (CELS), School of Agriculture.
* **Source Anomalies Preserved**: Legacy course prerequisites (`AGF101`, `AGF102` printed in red on `ANS042`–`ANS044`) are surfaced transparently to students and advisors rather than silently altered.
* **Privacy & Offline First**: All student records, confidence scores, and academic plans remain strictly on-device in local SQLite storage. No personal academic data is transmitted to external servers.
