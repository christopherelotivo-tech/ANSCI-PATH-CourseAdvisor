---
name: react-native-ui
description: >-
  Use this skill when implementing, styling, or reviewing React Native screens
  and reusable UI components for CourseAdvisor / AnSciPath. Ensures fidelity to
  the 15 UI prototype screenshots, consistent agricultural green theme tokens,
  responsive Android layouts, and safe fallback handling for missing assets.
---

# React Native UI Implementation Skill (`react-native-ui`)

## Responsibilities
1. **Follow the Official UI Prototype:** Match the 15 exported reference screens in `docs/ui-screenshots/` (`01_Welcome_Get_Started.png` through `15_Settings.png`).
2. **Preserve Visual Branding:** Keep the visible `"AnSciPath"` branding on the Welcome screen while maintaining internal `"CourseAdvisor"` architectural consistency.
3. **Maintain Design Tokens:** Centralize colors, typography, spacing, border radii, and elevation shadows in `src/constants/theme.ts`.
4. **Build Reusable Components:** Place shared UI building blocks outside `src/app/` under `src/components/`:
   - Onboarding header with progress bar (`STEP X OF 3`), dual institutional logos, and back button
   - Floating bottom CTA card (`Continue ->`, helper caption, rounded white card container)
   - Year-level selector pills (`1st Year`, `2nd Year`, `3rd Year`, `4th Year` in logical order)
   - Course row item with checkbox, course code, title, and unit count
   - Subject confidence slider (`1`–`10`) with numeric badge
   - Semicircle workload stress gauge and status badge
   - Prerequisite graph node and edge canvas
5. **Android Responsiveness & Safe Areas:**
   - Wrap screens properly with `SafeAreaView` from `react-native-safe-area-context` or safe area insets.
   - Use `ScrollView` / `FlatList` with bottom padding (`contentContainerStyle`) so sticky bottom CTA cards never obscure content on smaller Android viewports.
   - Use `StyleSheet.create` for all styling.
6. **Asset Discipline:**
   - Never import screenshots from `docs/ui-screenshots/` into runtime code.
   - Use available assets from `assets/images/backgrounds/` and `assets/images/branding/`.
   - When an asset listed in `ASSET_INVENTORY.md` is missing, use a clean vector/native component placeholder with matching dimensions.

## Reference Color Palette (Sampled from Prototype)
- **Primary Brand Green (Buttons / Active Pills / Hero Cards):** `#196B45` / `#1B5F3A`
- **Accent Leaf Green (Logo & Checkmarks):** `#248A3F` / `#28954A`
- **Soft Mint Header Gradient / Tint:** `#D9EEDD` -> `#F4FAF5` -> `#FFFFFF`
- **Light Green Info Banner:** `#E4F5E8`
- **Primary Text:** `#0F301B` / `#14261C`
- **Secondary Text:** `#5C6B62` / `#60646C`
- **Input / Card Surface:** `#F8F9F8` with `#E2E8E4` border
- **Stress Amber (Moderate):** `#F39828` (pill background `#FDF3E3`)
- **Avatar Coral:** `#DF7E58`

## Verification Steps
1. Compare the implemented screen layout, copy, spacing, and interactive states against the corresponding screenshot in `docs/ui-screenshots/`.
2. Run `npx tsc --noEmit` and `npx expo lint` to confirm zero type or lint issues.
3. Run component unit tests via `npm test`.

