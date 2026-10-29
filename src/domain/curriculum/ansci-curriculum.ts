import type { Curriculum, CurriculumCourse, StandingRequirement, Term, YearLevel } from './types';

interface CourseInput {
  units: number;
  lec: number | null;
  lab: number | null;
  pre?: string[];
  co?: string[];
  standing?: StandingRequirement[];
  creditBearing?: boolean;
  hoursAreTermTotal?: boolean;
  prerequisiteCellBlank?: boolean;
  sourceCode?: string;
  notes?: string[];
}

function course(
  year: YearLevel,
  term: Term,
  code: string,
  title: string,
  input: CourseInput,
  kind: CurriculumCourse['kind'] = 'REGULAR'
): CurriculumCourse {
  return {
    code,
    title,
    units: input.units,
    creditBearing: input.creditBearing ?? true,
    lecHours: input.lec,
    labHours: input.lab,
    year,
    term,
    kind,
    prerequisites: input.pre ?? [],
    standingRequirements: input.standing ?? [],
    corequisites: input.co ?? [],
    ...(input.sourceCode ? { sourceCode: input.sourceCode } : {}),
    ...(input.hoursAreTermTotal ? { hoursAreTermTotal: true } : {}),
    ...(input.prerequisiteCellBlank ? { prerequisiteCellBlank: true } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  };
}

function smcSlot(year: YearLevel, term: Term, code: string): CurriculumCourse {
  return course(
    year,
    term,
    code,
    'Specialized Major Course',
    {
      units: 3,
      lec: 2,
      lab: 3,
      notes: [
        'Slot code (SMC-n) is the label used in the UI prototype; the source PDF prints no course number.',
        'Filled by one of the Specialized Major Course options (ANS141-ANS153).',
      ],
    },
    'SMC_SLOT'
  );
}

function smcOption(code: string, title: string, pre: string[]): CurriculumCourse {
  return {
    code,
    title,
    units: 3,
    creditBearing: true,
    lecHours: 2,
    labHours: 3,
    year: null,
    term: null,
    kind: 'SMC_OPTION',
    prerequisites: pre,
    standingRequirements: [],
    corequisites: [],
  };
}

const NSTP_NOTE = 'NSTP units are printed in parentheses "(3)" and are excluded from the printed term total.';
const AGF_NOTE =
  'AGF101/AGF102 are printed in RED in the official PDF and do not appear anywhere else in the curriculum. Unresolved — requires confirmation from the department.';

const courses: CurriculumCourse[] = [
  // 1st Year, 1st Semester
  course(1, 'FIRST', 'GEC101', 'Understanding the Self', { units: 3, lec: 3, lab: 0 }),
  course(1, 'FIRST', 'GEC102', 'Purposive Communication', { units: 3, lec: 3, lab: 0 }),
  course(1, 'FIRST', 'CHM033', 'Organic Chemistry', { units: 2, lec: 2, lab: 0, co: ['CHM033.1'] }),
  course(1, 'FIRST', 'CHM033.1', 'Organic Chemistry Laboratory', { units: 1, lec: 0, lab: 3, co: ['CHM033'] }),
  course(1, 'FIRST', 'AGR001', 'Introduction to Agriculture', { units: 3, lec: 3, lab: 0 }),
  course(1, 'FIRST', 'CRS001', 'Principles of Crop Production', { units: 3, lec: 2, lab: 3 }),
  course(1, 'FIRST', 'SSC001', 'Principles of Soil Science', { units: 3, lec: 2, lab: 3 }),
  course(1, 'FIRST', 'FPE101', 'Fundamentals of Peace Education', { units: 3, lec: 3, lab: 0 }),
  course(1, 'FIRST', 'PED011', 'Movement Competency Training', {
    units: 2,
    lec: 2,
    lab: 0,
    prerequisiteCellBlank: true,
    notes: ['Prerequisite and corequisite cells are blank in the source (not "None"). Treated as no prerequisite.'],
  }),
  course(1, 'FIRST', 'NST001', 'National Service Training Program 1', {
    units: 3,
    lec: 3,
    lab: 0,
    creditBearing: false,
    notes: [NSTP_NOTE],
  }),

  // 1st Year, 2nd Semester
  course(1, 'SECOND', 'GEC103', 'The Contemporary World', { units: 3, lec: 3, lab: 0 }),
  course(1, 'SECOND', 'GEC104', 'Mathematics in the Modern World', { units: 3, lec: 3, lab: 0 }),
  course(1, 'SECOND', 'ANS001', 'Introduction to Animal Science', { units: 3, lec: 2, lab: 3 }),
  course(1, 'SECOND', 'CRP001', 'Principles of Crop Protection', { units: 3, lec: 2, lab: 3 }),
  course(1, 'SECOND', 'SSC002', 'Soil Fertility, Conservation and Management', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['SSC001'],
  }),
  course(1, 'SECOND', 'CRS002', 'Practices of Crop Science and Management', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['CRS001'],
  }),
  course(1, 'SECOND', 'GEC110', 'History of Filipino Muslim & Indigenous People of MINSUPALA', {
    units: 3,
    lec: 3,
    lab: 0,
  }),
  course(1, 'SECOND', 'PED012', 'Exercise-based Fitness Activities', { units: 2, lec: 2, lab: 0, pre: ['PED011'] }),
  course(1, 'SECOND', 'NST002', 'National Service Training Program 2', {
    units: 3,
    lec: 3,
    lab: 0,
    pre: ['NST001'],
    creditBearing: false,
    notes: [NSTP_NOTE],
  }),

  // 1st Year, Summer
  course(1, 'SUMMER', 'ANS097', 'Practicum skills and Development in Animal Science (In-Campus)', {
    units: 3,
    lec: null,
    lab: 240,
    hoursAreTermTotal: true,
    pre: ['CRS001', 'CRS002', 'SSC001', 'SSC002', 'CRP001', 'ANS001'],
  }),

  // 2nd Year, 1st Semester
  course(2, 'FIRST', 'CHM043', 'General Biochemistry', {
    units: 2,
    lec: 2,
    lab: 0,
    pre: ['CHM033'],
    co: ['CHM033.1'],
    notes: ['Corequisite printed as CHM033.1 (a 1st-year course). Possibly intended CHM043.1 — needs confirmation.'],
  }),
  course(2, 'FIRST', 'CHM043.1', 'General Biochemistry Laboratory', {
    units: 1,
    lec: 0,
    lab: 3,
    pre: ['CHM033'],
    co: ['CHM033.1'],
    notes: ['Corequisite printed as CHM033.1 (a 1st-year course). Possibly intended CHM043 — needs confirmation.'],
  }),
  course(2, 'FIRST', 'AGR002', 'Introduction to Organic Agriculture', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['SSC002', 'CRS002'],
    notes: ['Prerequisite printed as "SSC002 & CRS002" (both required).'],
  }),
  course(2, 'FIRST', 'AGR003', 'Methods of Agricultural Research', {
    units: 3,
    lec: 2,
    lab: 3,
    sourceCode: 'AGROO3',
    notes: ['Printed as "AGROO3" (letter O) in the source; normalized to AGR003 as used in the UI prototype.'],
  }),
  course(2, 'FIRST', 'ANS002', 'Introduction to Livestock and Poultry Production', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['ANS001'],
  }),
  course(2, 'FIRST', 'CRP002', 'Approaches and Practices in Pest Management', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['CRP001'],
  }),
  course(2, 'FIRST', 'GEC105', 'Reading in Philippine History', { units: 3, lec: 3, lab: 0 }),
  course(2, 'FIRST', 'GEC120', 'Wika at Kultura sa Mapayapang Lipunan', { units: 3, lec: 3, lab: 0 }),
  course(
    2,
    'FIRST',
    'PED013',
    'Choice of Individual – Dual Sports, Recreational Games, Traditional Games, Dance, Martial Arts, and Group Exercise',
    { units: 2, lec: 2, lab: 0, pre: ['PED012'] }
  ),

  // 2nd Year, 2nd Semester
  course(2, 'SECOND', 'GEC106', 'Art Appreciation', { units: 3, lec: 3, lab: 0 }),
  course(2, 'SECOND', 'GEC107', 'Ethics', { units: 3, lec: 3, lab: 0 }),
  course(2, 'SECOND', 'AEX001', 'Principles of Agricultural Extension and Communication', {
    units: 3,
    lec: 3,
    lab: 0,
  }),
  course(2, 'SECOND', 'GEN001', 'Principles of Genetics', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['CHM043'],
    co: ['CHM043.1'],
  }),
  course(2, 'SECOND', 'ABE001', 'Basic Farm Machineries, Mechanization and Water Mgt.', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['CRS002'],
  }),
  course(2, 'SECOND', 'AGR004', 'Natural Resource and Environmental Mgt. for Agriculture', {
    units: 3,
    lec: 2,
    lab: 3,
  }),
  course(2, 'SECOND', 'GEC130', 'Ekokritisismo at Pagpapahalaga sa Kalikasan', { units: 3, lec: 3, lab: 0 }),
  course(2, 'SECOND', 'PED014', 'Choice of Team Sports, Outdoor and Adventure Activities', {
    units: 2,
    lec: 2,
    lab: 0,
    pre: ['PED012'],
  }),

  // 3rd Year, 1st Semester
  course(3, 'FIRST', 'AGR005', 'General Physiology and Toxicology', { units: 3, lec: 2, lab: 3, pre: ['CRP002'] }),
  course(3, 'FIRST', 'ABT001', 'Agricultural Biotechnology', { units: 3, lec: 2, lab: 3, pre: ['GEN001'] }),
  course(3, 'FIRST', 'CRS003', 'Post-Harvest Handling & Seed Technology', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['CRS002'],
  }),
  course(3, 'FIRST', 'ABM001', 'Principles of Agricultural Entrepreneurship and Enterprise Development', {
    units: 3,
    lec: 3,
    lab: 0,
  }),
  course(3, 'FIRST', 'ANS040', 'Anatomy and Physiology of Farm Animals', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['AGR001', 'CRS001'],
  }),
  course(3, 'FIRST', 'ANS041', 'Animal Nutrition and Feeding Management', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['AGR001', 'AGR004'],
  }),
  course(3, 'FIRST', 'GEC133', 'Living in the IT Era', { units: 3, lec: 2, lab: 3, pre: ['CRS002'] }),
  course(3, 'FIRST', 'ANS191', 'Seminar A', { units: 1, lec: 1, lab: 0, standing: ['CAS'] }),

  // 3rd Year, 2nd Semester
  course(3, 'SECOND', 'HAL101', 'Fundamentals of Halal', { units: 3, lec: 3, lab: 0 }),
  course(3, 'SECOND', 'AGR006', 'Beneficial Arthropods and Micro-organisms', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['CRP001'],
  }),
  course(3, 'SECOND', 'ANS003', 'Slaughter of Animals and Animal Product Processing', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['ANS002'],
  }),
  course(3, 'SECOND', 'ANS042', 'Animal Health and Diseases', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['AGF101'],
    notes: [AGF_NOTE],
  }),
  course(3, 'SECOND', 'ANS043', 'Principles and Practices of Animal Breeding', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['AGF101'],
    notes: [AGF_NOTE],
  }),
  course(3, 'SECOND', 'ANS044', 'Forage and Pasture Management', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['AGF101', 'AGF102'],
    notes: [AGF_NOTE],
  }),
  course(3, 'SECOND', 'ANS192', 'Seminar B', { units: 1, lec: 1, lab: 0, pre: ['ANS191'] }),
  course(3, 'SECOND', 'ANS194', 'Undergraduate Thesis: Technical Writing for Thesis Outline', {
    units: 1,
    lec: 1,
    lab: 0,
    standing: ['CAS'],
  }),

  // 3rd Year, Summer
  course(3, 'SUMMER', 'ANS197', 'On-the-Job Training (Off-Campus)', {
    units: 3,
    lec: null,
    lab: 240,
    hoursAreTermTotal: true,
    pre: ['ANS003', 'ANS040', 'ANS041', 'ANS042', 'ANS043', 'ANS044'],
  }),

  // 4th Year, 1st Semester
  course(4, 'FIRST', 'GEC123', 'Gender and Society', { units: 3, lec: 3, lab: 0 }),
  course(4, 'FIRST', 'AGR007', 'Principles and Practices of Halal Agriculture', {
    units: 3,
    lec: 2,
    lab: 3,
    pre: ['ANS002', 'CRS002', 'HAL101'],
    notes: ['Prerequisite printed as "HAL 101" (with a space); normalized to HAL101.'],
  }),
  course(4, 'FIRST', 'GEC108', 'Science, Technology and Society', { units: 3, lec: 3, lab: 0 }),
  course(4, 'FIRST', 'AEC001', 'Principles of Agricultural Economics', { units: 3, lec: 2, lab: 3 }),
  course(4, 'FIRST', 'GEC109', 'Life and Works of Rizal', { units: 3, lec: 3, lab: 0 }),
  course(4, 'FIRST', 'ANS195', 'Undergraduate Thesis: Experimental Conduct', {
    units: 2,
    lec: 0,
    lab: 2,
    pre: ['ANS194'],
  }),
  smcSlot(4, 'FIRST', 'SMC-1'),

  // 4th Year, 2nd Semester
  course(4, 'SECOND', 'GEC131', 'People and Earth’s Ecosystem', { units: 3, lec: 3, lab: 0 }),
  course(4, 'SECOND', 'AEX002', 'Introduction to Agricultural Policy and Development', {
    units: 3,
    lec: 3,
    lab: 0,
  }),
  course(4, 'SECOND', 'ABM002', 'Introduction to Agricultural Commodity System and Marketing', {
    units: 3,
    lec: 3,
    lab: 0,
  }),
  course(4, 'SECOND', 'ANS199', 'Undergraduate Thesis: Manuscript Writing and Oral Defense', {
    units: 3,
    lec: 3,
    lab: 0,
    pre: ['ANS195'],
  }),
  smcSlot(4, 'SECOND', 'SMC-2'),
  smcSlot(4, 'SECOND', 'SMC-3'),

  // Specialized Major Courses
  smcOption('ANS141', 'Poultry Production', ['ANS041', 'ANS042', 'ANS043']),
  smcOption('ANS142', 'Goat and Sheep Production', ['ANS041', 'ANS042', 'ANS043', 'ANS044']),
  smcOption('ANS143', 'Swine Production', ['ANS002']),
  smcOption('ANS144', 'Dairy Production', ['ANS041', 'ANS042', 'ANS043', 'ANS044']),
  smcOption('ANS145', 'Beef and Buffalo Production', ['ANS041', 'ANS042', 'ANS043', 'ANS044']),
  smcOption('ANS146', 'Dairy Technology', ['ANS003', 'ANS041', 'ANS042']),
  smcOption('ANS147', 'Rabbit Production', ['ANS003', 'ANS041', 'ANS042']),
  smcOption('ANS148', 'Comminuted Meat Products', ['ANS003', 'ANS041', 'ANS042']),
  smcOption('ANS149', 'Climatology and Animal Behavior', ['ANS041', 'ANS042']),
  smcOption('ANS150', 'Physiology of Reproduction in Farm Animals', ['ANS040']),
  smcOption('ANS151', 'Physiology of Lactation', ['ANS040', 'ANS041']),
  smcOption('ANS152', 'Non-Ruminant Nutrition', ['ANS041', 'ANS042', 'ANS044']),
  smcOption('ANS153', 'Ruminant Nutrition', ['ANS041', 'ANS042', 'ANS044']),
];

export const ANSCI_CURRICULUM: Curriculum = {
  programCode: 'BSA-ANSCI',
  programName: 'Bachelor of Science in Agriculture',
  major: 'Animal Science',
  institution: 'Mindanao State University at Naawan',
  boardResolution: 'BOR Resolution No. 197-L, S. 2024',
  effectivity: 'SY 2025-2026',
  reference: 'CMO No. 23 Series of 2021',
  grandTotalUnits: 178,
  nstpUnits: 6,
  smcMinimumCourses: 3,
  smcMinimumUnits: 9,
  courses,
  termTotals: [
    { year: 1, term: 'FIRST', printedUnits: 23 },
    { year: 1, term: 'SECOND', printedUnits: 23 },
    { year: 1, term: 'SUMMER', printedUnits: 3 },
    { year: 2, term: 'FIRST', printedUnits: 23 },
    { year: 2, term: 'SECOND', printedUnits: 23 },
    { year: 3, term: 'FIRST', printedUnits: 22 },
    { year: 3, term: 'SECOND', printedUnits: 20 },
    { year: 3, term: 'SUMMER', printedUnits: 3 },
    { year: 4, term: 'FIRST', printedUnits: 20 },
    { year: 4, term: 'SECOND', printedUnits: 18 },
  ],
};

