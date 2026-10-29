/**
 * Domain types for curriculum data.
 *
 * These types are framework-free (no React / Expo imports) so the algorithm
 * modules and the SQLite seed can share them.
 */

export type Term = 'FIRST' | 'SECOND' | 'SUMMER';

export type YearLevel = 1 | 2 | 3 | 4;

export type ConfidenceArea =
  | 'Mathematics'
  | 'Science'
  | 'Agriculture'
  | 'Animal Science'
  | 'Research';

/**
 * Non-course prerequisite tokens found in the official curriculum.
 * - `CAS`: Certificate of Agricultural Science, awarded after satisfactorily
 *   completing the first two (2) years (see curriculum page 2).
 */
export type StandingRequirement = 'CAS';

export type CourseKind =
  /** A specific course listed in a semester table. */
  | 'REGULAR'
  /** A "Specialized Major Course" slot in a semester table (filled by an elective option). */
  | 'SMC_SLOT'
  /** One of the Specialized Major Course options (not tied to a semester in the source). */
  | 'SMC_OPTION';

export interface CurriculumCourse {
  /** Normalized course code used as the primary key (e.g. `AGR003`). */
  code: string;
  /** Code exactly as printed in the source PDF, only when it differs from `code`. */
  sourceCode?: string;
  title: string;
  /** Units as printed. NSTP units are printed in parentheses and are non-credit. */
  units: number;
  /** False for NSTP courses whose units are printed as "(3)" and excluded from term totals. */
  creditBearing: boolean;
  /** Lecture hours/week as printed (null when the cell is blank). */
  lecHours: number | null;
  /** Lab hours/week as printed (null when the cell is blank). */
  labHours: number | null;
  /** True when hours are a total for the term (practicum / OJT: 240 hrs), not per week. */
  hoursAreTermTotal?: boolean;
  /** Curriculum placement. Null for SMC options (the source lists them without a term). */
  year: YearLevel | null;
  term: Term | null;
  kind: CourseKind;
  /** Course-code prerequisites as printed (normalized). May include unresolved codes. */
  prerequisites: string[];
  /** Non-course prerequisite tokens (e.g. CAS). */
  standingRequirements: StandingRequirement[];
  /** Course-code corequisites as printed. */
  corequisites: string[];
  /** True when the prerequisite cell is blank in the source (not "None"). */
  prerequisiteCellBlank?: boolean;
  /** Source-data remarks shown to developers / reviewers. */
  notes?: string[];
}

export interface CurriculumTermTotal {
  year: YearLevel;
  term: Term;
  /** Unit total printed at the bottom of each semester table. */
  printedUnits: number;
}

export interface Curriculum {
  programCode: string;
  programName: string;
  major: string;
  institution: string;
  boardResolution: string;
  effectivity: string;
  reference: string;
  /** Printed "Grand Total Units". */
  grandTotalUnits: number;
  /** Printed NSTP units (non-credit). */
  nstpUnits: number;
  /** Minimum number of Specialized Major Course options required. */
  smcMinimumCourses: number;
  smcMinimumUnits: number;
  courses: CurriculumCourse[];
  termTotals: CurriculumTermTotal[];
}

