/**
 * SQLite Relational Schema for CourseAdvisor / AnSciPath.
 *
 * Implements the Local Storage Engine specification from `docs/SystemArchitecture.pdf`
 * (Adjacency List & Junction Table structure for prerequisite DAG lookups + local
 * student profile, completed courses, confidence ratings, and generated schedule).
 */

export const DATABASE_NAME = "courseadvisor.db";
export const DATABASE_VERSION = 1;

export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS programs (
  code TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  major TEXT NOT NULL,
  institution TEXT NOT NULL,
  board_resolution TEXT NOT NULL,
  effectivity TEXT NOT NULL,
  reference TEXT NOT NULL,
  grand_total_units INTEGER NOT NULL,
  nstp_units INTEGER NOT NULL,
  smc_minimum_courses INTEGER NOT NULL,
  smc_minimum_units INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  code TEXT PRIMARY KEY NOT NULL,
  source_code TEXT,
  program_code TEXT NOT NULL REFERENCES programs(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  units INTEGER NOT NULL CHECK (units >= 0),
  credit_bearing INTEGER NOT NULL DEFAULT 1 CHECK (credit_bearing IN (0, 1)),
  lec_hours INTEGER,
  lab_hours INTEGER,
  hours_are_term_total INTEGER NOT NULL DEFAULT 0 CHECK (hours_are_term_total IN (0, 1)),
  year_level INTEGER CHECK (year_level IN (1, 2, 3, 4) OR year_level IS NULL),
  semester TEXT CHECK (semester IN ('FIRST', 'SECOND', 'SUMMER') OR semester IS NULL),
  kind TEXT NOT NULL CHECK (kind IN ('REGULAR', 'SMC_SLOT', 'SMC_OPTION')),
  standing_requirement TEXT,
  prerequisite_cell_blank INTEGER NOT NULL DEFAULT 0 CHECK (prerequisite_cell_blank IN (0, 1)),
  notes_json TEXT
);

CREATE TABLE IF NOT EXISTS course_prerequisites (
  course_code TEXT NOT NULL REFERENCES courses(code) ON DELETE CASCADE,
  prerequisite_code TEXT NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'PREREQUISITE' CHECK (dependency_type IN ('PREREQUISITE', 'COREQUISITE')),
  is_unresolved INTEGER NOT NULL DEFAULT 0 CHECK (is_unresolved IN (0, 1)),
  PRIMARY KEY (course_code, prerequisite_code, dependency_type)
);

CREATE INDEX IF NOT EXISTS idx_course_prereq_course ON course_prerequisites(course_code);
CREATE INDEX IF NOT EXISTS idx_course_prereq_target ON course_prerequisites(prerequisite_code);

CREATE TABLE IF NOT EXISTS student_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  current_year_level INTEGER NOT NULL CHECK (current_year_level BETWEEN 1 AND 4),
  current_semester TEXT NOT NULL CHECK (current_semester IN ('FIRST', 'SECOND', 'SUMMER')),
  program_code TEXT NOT NULL REFERENCES programs(code),
  goal_type TEXT NOT NULL DEFAULT 'COMPLETE_PROGRAM',
  target_timeline_years INTEGER NOT NULL DEFAULT 4 CHECK (target_timeline_years IN (4, 5, 6)),
  onboarding_completed INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_completed IN (0, 1)),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS completed_courses (
  course_code TEXT PRIMARY KEY NOT NULL REFERENCES courses(code) ON DELETE CASCADE,
  completed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS confidence_ratings (
  subject_area TEXT PRIMARY KEY NOT NULL CHECK (
    subject_area IN ('Mathematics', 'Science', 'Agriculture', 'Animal Science', 'Research')
  ),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generated_plans (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  stress_score INTEGER NOT NULL CHECK (stress_score BETWEEN 0 AND 100),
  stress_label TEXT NOT NULL CHECK (
    stress_label IN ('Low', 'Balanced', 'Moderate', 'High', 'Challenging', 'Very High', 'Overload Risk')
  ),
  recommended_credit_limit INTEGER NOT NULL CHECK (recommended_credit_limit BETWEEN 12 AND 23),
  semesters_remaining INTEGER NOT NULL,
  completion_percentage INTEGER NOT NULL,
  plan_json TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recommended_schedule_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_index INTEGER NOT NULL,
  year_level INTEGER NOT NULL,
  semester TEXT NOT NULL,
  course_code TEXT NOT NULL REFERENCES courses(code),
  units INTEGER NOT NULL,
  placement_reason TEXT NOT NULL,
  tier INTEGER NOT NULL
);
`;
