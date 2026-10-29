export type Term = "FIRST" | "SECOND" | "SUMMER";

export type YearLevel = 1 | 2 | 3 | 4;

export type ConfidenceArea =
  | "Mathematics"
  | "Science"
  | "Agriculture"
  | "Animal Science"
  | "Research";

export type StandingRequirement = "CAS";

export type CourseKind = "REGULAR" | "SMC_SLOT" | "SMC_OPTION";

export interface CurriculumCourse {
  code: string;
  sourceCode?: string;
  title: string;
  units: number;
  creditBearing: boolean;
  lecHours: number | null;
  labHours: number | null;
  hoursAreTermTotal?: boolean;
  year: YearLevel | null;
  term: Term | null;
  kind: CourseKind;
  prerequisites: string[];
  standingRequirements: StandingRequirement[];
  corequisites: string[];
  prerequisiteCellBlank?: boolean;
  notes?: string[];
}

export interface CurriculumTermTotal {
  year: YearLevel;
  term: Term;
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
  grandTotalUnits: number;
  nstpUnits: number;
  smcMinimumCourses: number;
  smcMinimumUnits: number;
  courses: CurriculumCourse[];
  termTotals: CurriculumTermTotal[];
}
