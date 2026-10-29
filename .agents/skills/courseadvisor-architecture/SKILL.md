---
name: courseadvisor-architecture
description: >-
  Use this skill when designing or modifying project directory structure, navigation
  routes, state management, or Expo SQLite persistence in CourseAdvisor / AnSciPath.
  Enforces Clean Architecture separation between UI, domain algorithms, and local SQLite storage.
---

# CourseAdvisor Architecture Skill (`courseadvisor-architecture`)

## Responsibilities
1. **Maintain Clean Layered Structure:**
   - `src/app/` — **Expo Router screens and layouts only.** No raw SQL queries or heavy algorithm implementations inside route files.
   - `src/components/` — Reusable presentational and interactive UI components.
   - `src/domain/` — Pure TypeScript domain models, official curriculum dataset (`src/domain/curriculum/`), and academic planning algorithms (`src/domain/algorithms/`). Zero React Native or SQLite dependencies.
   - `src/db/` — Expo SQLite connection, schema migrations, parameterized repositories, and curriculum seeding.
   - `src/state/` (or `src/context/`) — Unidirectional state management connecting SQLite persistence and domain algorithms to React components via hooks.
   - `src/constants/` — Design tokens and static configuration.
2. **Follow Approved Navigation Flow (`docs/Flow.pdf` & `docs/CourseAdvisor_UI_Design.pdf`):**
   - **Onboarding Stack:**
     1. Welcome (`/`)
     2. Student Setup (`/onboarding/student-setup`)
     3. Academic Goal (`/onboarding/academic-goal`)
     4. Completed Courses (`/onboarding/completed-courses` — 1st, 2nd, 3rd, 4th Year tabs in logical order)
     5. Confidence Rating (`/onboarding/confidence-rating`)
     6. Analyzing Requirements (`/onboarding/analyzing` — executes DAG + Backward Chaining + Topological Sort + Fuzzy Workload + Schedule Solver pipeline, with access to Prerequisite Analysis / Course Ordering details)
     7. Workload Analysis (`/onboarding/workload-analysis`)
     8. Recommended Schedule (`/onboarding/recommended-schedule`)
   - **Main App Tabs (`/(tabs)`):**
     1. Plan / Roadmap (`/(tabs)/plan`)
     2. Courses Catalog (`/(tabs)/courses`)
     3. Goal Path / Prerequisite Graph (`/(tabs)/graph`)
     4. Settings (`/(tabs)/settings` — includes `"Start a new academic plan"` reset/re-plan action)
3. **Offline-First Local Persistence (Expo SQLite):**
   - Persist student profile, academic goal, completed courses, confidence ratings, and generated plan locally on device.
   - Do not add online authentication/login screens unless explicitly requested.
   - Use `PRAGMA foreign_keys = ON`, `PRAGMA user_version` migrations, and parameterized queries (`runAsync`, `getFirstAsync`, `getAllAsync`).

## Verification Steps
1. Confirm `src/domain/` contains zero imports from `react`, `react-native`, `expo-*`, or `src/db/`.
2. Confirm all database mutations use parameterized statements and survive app restarts.
3. Verify route transitions match `docs/Flow.pdf` and pass `npx tsc --noEmit` and `npm test`.

