This is an Expo/React Native mobile application (**CourseAdvisor / AnSciPath**) for **BS Agriculture, Major in Animal Science** students (Mindanao State University at Naawan curriculum). Prioritize mobile-first patterns, Android compatibility, offline-first persistence, and algorithmic accuracy.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npm test                    # run Jest unit & component tests
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint (`npx expo lint`), typecheck (`npx tsc --noEmit`), and unit tests (`npm test`) before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, domain logic, database, utils) outside `src/app/`.
- Import `Link`, `useRouter`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Project-Specific Rules (CourseAdvisor / AnSciPath)

1. **Technology Stack Override:**
   - Although `docs/SystemArchitecture.pdf` originally described native Kotlin / Jetpack Compose / Room DB, this project is intentionally built with **React Native + Expo + TypeScript + Expo Router + Expo SQLite**.
   - Preserve 100% of the functional requirements, Clean Architecture separation, offline-first behavior, and algorithms (DAG validation, cycle detection, Backward Chaining, Topological Sorting, Mamdani Fuzzy Inference System, and Schedule Generator).
2. **Clean Architecture Separation:**
   - `src/app/` — Screens and navigation layouts only.
   - `src/components/` — Reusable UI components.
   - `src/domain/curriculum/` — Official BS Agriculture (Animal Science) curriculum dataset and validators.
   - `src/domain/algorithms/` — Pure TypeScript algorithm modules (zero UI or database imports).
   - `src/db/` — Expo SQLite schema, migrations, and parameterized data access repositories.
   - `src/state/` — Application state context and hooks bridging `src/db/` and `src/domain/` to the UI.
3. **Academic Data Integrity:**
   - Never invent course codes, titles, units, prerequisites, or semester availability. All curriculum data must match `docs/AnimalScienceCurriculum.pdf`.
   - Preserve and surface known source-curriculum anomalies (such as unresolved prerequisite codes `AGF101` and `AGF102` printed in red in the official PDF) rather than silently hiding them.
   - Never hardcode fake schedule recommendations—always run the actual graph and fuzzy logic engines.
4. **UI & Asset Discipline:**
   - Follow the 15 official prototype screens in `docs/ui-screenshots/` (`01_Welcome_Get_Started.png` through `15_Settings.png`).
   - Implement Completed Courses year tabs in logical order: **1st Year, 2nd Year, 3rd Year, 4th Year**.
   - Implement **Plan, Courses, Graph, and Settings** as proper bottom navigation tabs (`src/app/(tabs)/`).
   - Preserve the visible `"AnSciPath"` branding from the UI prototype while keeping `"CourseAdvisor"` internal identity consistent.
   - Never import full screenshots from `docs/ui-screenshots/` as runtime UI. Keep runtime assets organized under `assets/images/backgrounds/`, `assets/images/illustrations/`, `assets/images/branding/`, `assets/icons/`, and `assets/fonts/`.
5. **Continuous Native Generation & Verification:**
   - If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
   - Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
   - Prefer recommended Expo modules over third-party libraries, and check your available skills (`.agents/skills/`) before adding dependencies.
   - Never claim a test or build passed unless the verification command actually ran and succeeded.
