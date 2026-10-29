# Asset Inventory — CourseAdvisor / AnSciPath

This inventory catalogs every visual, branding, icon, and font asset identified across the 15 official UI reference screens (`docs/CourseAdvisor_UI_Design.pdf` / `docs/ui-screenshots/`), along with its current availability in the repository and fallback strategy.

> **Important Rule:** UI reference screenshots reside strictly in `docs/ui-screenshots/` for visual comparison and are **never** imported as runtime UI substitutes. Missing assets use clean native vector/SVG or layout components that preserve exact dimensions and functionality without broken imports.

---

## 1. Summary Table

| # | Asset Name | Screen(s) Where Used | Suggested Filename | Destination Path | Current Availability | Required / Optional |
|---|---|---|---|---|---|---|
| 1 | Welcome Farm Landscape Background | `01_Welcome_Get_Started` | `farm-background.png` | `assets/images/backgrounds/farm-background.png` | **Available** (1080×1920 PNG) | Required |
| 2 | College of Environment and Life Sciences (MSU-Naawan) Seal | `02_Student_Setup`, `03_Academic_Goal` | `cels-msun-logo.png` | `assets/images/branding/cels-msun-logo.png` | **Available** (relocated from `assets/images/logos/LOGO.png`) | Required |
| 3 | Animal Science Student Society (2022) Seal | `02_Student_Setup`, `03_Academic_Goal` | `ansci-student-society-logo.png` | `assets/images/branding/ansci-student-society-logo.png` | **Available** (relocated from `assets/images/logos/ansci-student-society.png`) | Required |
| 4 | AnSciPath Circular Badge & Crest Mark | `01_Welcome_Get_Started` | `anscipath-crest-badge.png` (or `.svg`) | `assets/images/branding/anscipath-crest-badge.png` | **Missing** (Rendered via native vector/View badge matching the 4-pin crest and dashed circular ring) | Required (Native/SVG fallback active) |
| 5 | Analyzing Requirements Stacked Progress Illustration | `09_Analyzing_Requirements` | `analyzing-progress-illustration.png` | `assets/images/illustrations/analyzing-progress-illustration.png` | **Missing** (Rendered via native styled progress bars & botanical accents) | Optional (Native vector fallback) |
| 6 | Workload Stress Semicircle Gauge Graphic | `10_Workload_Analysis` | `workload-gauge.svg` | `assets/images/illustrations/workload-gauge.svg` | **Missing as static file** (Dynamic component required; rendered via `react-native-svg` / native arc) | Required as dynamic component |
| 7 | Goal Path Dotted Canvas & Node Connectors | `14_Goal_Path_Prerequisite_Graph` | `graph-grid-pattern.png` | `assets/images/backgrounds/graph-grid-pattern.png` | **Missing as static file** (Rendered programmatically for pan/zoom graph) | Optional (Programmatic SVG/View) |
| 8 | Form & Action UI Icons (User, ID Card, List, Calendar, Leaf, Target, Lightbulb, Signal/Chart, Node/Graph, Gear, Book, Search, Check, Warning, Arrow, Chevron) | `01` through `15` (all screens) | `icon-*.svg` / vector icon set | `assets/icons/` | **Missing as standalone files** (Rendered using custom SVG/vector icon component matching stroke weight and `#1B6B45` palette) | Required (Vector icon implementation) |
| 9 | Bottom Navigation Tab Icons (`Plan`, `Courses`, `Graph`, `Settings`) | `12_Your_Plan_Roadmap`, `13_Courses_Catalog`, `14_Goal_Path_Prerequisite_Graph`, `15_Settings` | `tab-plan.png`, `tab-courses.png`, `tab-graph.png`, `tab-settings.png` | `assets/icons/` | **Missing as custom PNGs** (Default Expo template icons exist in `assets/images/tabIcons/`; custom vector icons used in tab bar) | Optional (Vector icons preferred for crisp scaling) |
| 10 | Primary Sans-Serif Font Family (`Poppins` / `Plus Jakarta Sans` / `Inter` Geometric Sans) | All screens (`01`–`15`) | `PlusJakartaSans-Regular.ttf`, `-Medium.ttf`, `-SemiBold.ttf`, `-Bold.ttf` | `assets/fonts/` | **Missing** (System geometric sans-serif fallback active until font `.ttf` files are placed in `assets/fonts/`) | Optional (Recommended for 1:1 typography match) |
| 11 | Android App Icon (AnSciPath / CourseAdvisor Branded) | Android Launcher | `icon.png`, `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png` | `assets/images/` | **Placeholder only** (Default blue Expo starter icons currently in `assets/images/`; needs AnSciPath green crest artwork) | Required for final APK release |
| 12 | Splash Screen Artwork (AnSciPath / CourseAdvisor Branded) | App Launch | `splash-icon.png` | `assets/images/splash-icon.png` | **Placeholder only** (Default Expo splash icon currently in `assets/images/`; background updated to `#1B6B45`) | Required for final APK release |

---

## 2. Screen-by-Screen Asset Breakdown

### `01_Welcome_Get_Started.png`
- **Background:** `assets/images/backgrounds/farm-background.png` — **Present**. Full-bleed green agricultural pasture illustration with barn, cow silhouette, and rooster silhouette.
- **Centerpiece Badge:** White circular medallion with subtle outer glow, inner dashed border ring (`#949B94`), dark-green stylized pouch/crest icon topped with four colored pinheads (`#28954A` green, `#E59E03` yellow-gold, `#EE7C0E` orange, `#C2372C` red) and a white wave tilde, title `"AnSciPath"` (`AnSci` in `#288A43`, `Path` in `#0F301B`), and subtitle `"PLAN YOUR ANIMAL SCIENCE DEGREE"`.
  - *Status:* Missing standalone PNG/SVG export in `assets/images/branding/`. Implemented as a high-precision native component (`AnSciPathBadge`) so layout, colors, and typography render crisply at any pixel density and can swap in `assets/images/branding/anscipath-crest-badge.png` when supplied.

### `02_Student_Setup.png` & `03_Academic_Goal.png`
- **Header Logos:**
  1. `assets/images/branding/cels-msun-logo.png` — **Present** (College of Environment and Life Sciences, Mindanao State University at Naawan).
  2. `assets/images/branding/ansci-student-society-logo.png` — **Present** (Animal Science Student Society 2022).
- **Icons:** Back chevron, User outline, ID badge outline, Document/list outline, Calendar outline, Leaf outline, Flag/program icon, Target/bullseye icon, Checkmark circle, Right arrow.

### `04`–`07_Completed_Courses_*.png`
- **Visual Elements:** Pure UI layout (progress bar, year-tab pills, course checkboxes, unit badges, sticky bottom action card). No external bitmap illustrations required.

### `08_Confidence_Rating.png`
- **Visual Elements:** Custom green range sliders (`1–10`), circular numeric value pills, lightbulb tip banner icon.

### `09_Analyzing_Requirements.png`
- **Checklist Icons:** Solid green circular checkmarks (`#1FA750`).
- **Bottom Illustration:** Stacked horizontal green progress blocks with light-green cloud/foliage outlines (`assets/images/illustrations/analyzing-progress-illustration.png` — **Missing**, implemented with native vector shapes).

### `10_Workload_Analysis.png`
- **Gauge:** Semicircular stress meter (`56%`, `#F39828` amber arc over `#ECEFED` track) — dynamic data visualization component.
- **Factor Icons:** Book/credit icon, signal bars icon, target icon, prerequisite node-link icon.

### `11_Recommended_Schedule.png`
- **Course Category Badges:** Soft green circular icon badges containing a target icon or leaf icon.

### `12_Your_Plan_Roadmap.png`, `13_Courses_Catalog.png`, `14_Goal_Path_Prerequisite_Graph.png`, `15_Settings.png`
- **Avatar Badge:** Terracotta circle (`#DF7E58`) with student initials (`JD`).
- **Progress Ring (`12`):** Circular progress indicator (`8% complete`) inside the dark-green hero card.
- **Prerequisite Graph (`14`):** Dotted canvas background, rounded course node cards (`Complete`, `Next up`, `Later`), connecting edges, zoom control pill.
- **Bottom Tab Bar (`12`–`15`):** 4 tabs (`Plan`, `Courses`, `Graph`, `Settings`) with rounded active pill indicator (`#E3F2E8`).

---

## 3. Assets to Provide Later (Non-Blocking for Logic, Recommended for Final APK)

1. **`assets/images/branding/anscipath-crest-badge.png`** — Official exported crest logo if the design team has the original vector/PNG from Figma.
2. **`assets/images/icon.png` & `assets/images/android-icon-*.png`** — Final branded Android adaptive icon (currently using the default Expo blue icon).
3. **`assets/images/splash-icon.png`** — Final branded splash screen emblem.
4. **`assets/fonts/*.ttf`** — Font files if offline custom font embedding is desired.

