---
name: testing-debugging
description: >-
  Use this skill when validating code quality, running TypeScript typechecks, ESLint,
  Jest unit and component tests, verifying SQLite migrations and queries, or diagnosing
  Expo / Android build issues.
---

# Testing & Debugging Skill (`testing-debugging`)

## Responsibilities
1. **Static Analysis Gate:**
   - Run `npx tsc --noEmit` to verify strict TypeScript compilation across the project.
   - Run `npx expo lint` to catch React Hooks, Expo Router, and code style issues.
2. **Automated Unit & Component Tests (`jest-expo`):**
   - Place tests in `__tests__/` directories or `*-test.ts(x)` files.
   - Test curriculum integrity (`src/domain/curriculum/__tests__/`): verify course counts, semester unit totals, and grand total (178 credit units + 6 NSTP units).
   - Test algorithms (`src/domain/algorithms/__tests__/`): verify DAG cycle detection, backward chaining, topological tiers, fuzzy membership/centroid defuzzification, and schedule generation.
   - Test UI screens and components using `@testing-library/react-native`.
   - Test SQLite repository logic using deterministic mocks or in-memory adapters for Jest while keeping real `expo-sqlite` integration on device.
3. **Dependency & Config Health:**
   - Always install packages via `npx expo install <package>` so versions match Expo SDK 58.
   - Run `npx expo-doctor` when dependencies or `app.json` change.
4. **Truthful Reporting:**
   - Never claim a test, lint check, or build passed unless the command was actually executed in the terminal and exited with code `0`.
   - Clearly report any unverified runtime behavior (e.g., physical Android device gestures) vs. automated test verification.

## Standard Verification Sequence
```bash
npx tsc --noEmit
npx expo lint
npm test -- --watchAll=false
```

