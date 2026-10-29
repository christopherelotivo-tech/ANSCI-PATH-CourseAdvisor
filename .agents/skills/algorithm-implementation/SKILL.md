---
name: algorithm-implementation
description: >-
  Use this skill when implementing or updating the academic planning algorithms:
  Directed Acyclic Graph (DAG) validation and cycle detection, Backward Chaining
  inference, Kahn's topological sorting and tier assignment, Mamdani Fuzzy Inference
  System, and the semester schedule generator.
---

# Algorithm Implementation Skill (`algorithm-implementation`)

## Responsibilities
All algorithms live in `src/domain/algorithms/` as pure, deterministic, zero-dependency TypeScript modules with full unit test coverage.

### 1. Directed Acyclic Graph (DAG) & Cycle Detection
- Represent courses as vertices $V$ and prerequisite dependencies as directed edges $E$.
- Detect circular prerequisite dependencies using deterministic cycle detection (Kahn's in-degree residual check and/or Tarjan's/DFS three-color marking) and report the exact cycle path without throwing a stack overflow.
- Flag unresolved prerequisite course codes (such as `AGF101` and `AGF102` printed in red in `docs/AnimalScienceCurriculum.pdf`) distinctly from normal unsatisfied prerequisites so the user and UI receive transparent diagnostics.

### 2. Backward Chaining Inference Engine
- Given a target goal (full program completion or a specific target course $V_{\text{target}}$) and the set of completed course codes:
  - Traverse prerequisite edges backward from the target set.
  - Ignore courses already present in the completed transcript set.
  - Identify all remaining required courses, immediate eligible courses, blocked courses, and missing prerequisite chains.
  - Evaluate non-course standing requirements (`CAS` — Certificate of Agricultural Science, satisfied when all 1st Year and 2nd Year courses are completed) and corequisite pairings (e.g., `CHM033` + `CHM033.1`, `GEN001` + `CHM043.1`).

### 3. Topological Sorting & Prerequisite Tiering
- Compute valid course sequencing using Kahn's algorithm so no course is ever scheduled before its prerequisites.
- Group remaining required courses into topological prerequisite tiers:
  - **Tier 0:** Courses with no pending prerequisites.
  - **Tier $N$:** Courses whose prerequisites are satisfied by Tier $\le N-1$.
- Compute critical path length to detect if a student's remaining dependency chain exceeds their target timeline ("Extended Term Required").

### 4. Mamdani Fuzzy Inference System (Workload Scoring)
- **Inputs:** Student Confidence $C \in [1, 10]$ and Course/Subject Difficulty $D \in [1, 10]$.
- **Pipeline:**
  1. **Fuzzification:** Triangular/trapezoidal membership functions for Low, Medium/Moderate, and High/Hard linguistic terms.
  2. **Rule Evaluation:** Evaluate documented IF-THEN rules (`IF Confidence IS Low AND Difficulty IS Hard THEN Risk IS Very High`; `IF Confidence IS High AND Difficulty IS Moderate THEN Risk IS Low`) and clearly document any provisional rules needed to span the full $3 \times 3$ matrix until approved by the project team.
  3. **Aggregation & Centroid Defuzzification:** Compute crisp Semester Stress Score ($0\text{–}100\%$) and Recommended Credit Limit ($12\text{–}18$ units).

### 5. Schedule Generator
- Generate semester-by-semester recommendations respecting:
  - Completed courses
  - Prerequisite satisfaction and topological order
  - Corequisite pairing
  - Semester availability (`FIRST`, `SECOND`, `SUMMER`)
  - Fuzzy-calculated recommended credit limit
- Attach a transparent human-readable placement explanation (`reason`) to every recommended course.

## Verification Steps
1. Never hardcode recommendation outputs—always compute from curriculum + student state.
2. Run Jest unit tests (`npm test`) covering normal transcripts, empty transcripts, completed transcripts, synthetic cycle graphs, and unresolved prerequisite warnings.

