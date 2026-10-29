import { ANSCI_CURRICULUM } from '@/domain/curriculum/ansci-curriculum';

describe('BS Agriculture (Animal Science) Official Curriculum Dataset', () => {
  test('matches the printed 178 credit-bearing grand total and 6 NSTP units', () => {
    const regularAndSlotCourses = ANSCI_CURRICULUM.courses.filter(
      (c) => c.kind === 'REGULAR' || c.kind === 'SMC_SLOT'
    );

    const creditUnits = regularAndSlotCourses
      .filter((c) => c.creditBearing)
      .reduce((sum, c) => sum + c.units, 0);

    const nstpUnits = regularAndSlotCourses
      .filter((c) => !c.creditBearing)
      .reduce((sum, c) => sum + c.units, 0);

    expect(creditUnits).toBe(ANSCI_CURRICULUM.grandTotalUnits);
    expect(creditUnits).toBe(178);
    expect(nstpUnits).toBe(ANSCI_CURRICULUM.nstpUnits);
    expect(nstpUnits).toBe(6);
  });

  test('matches every printed semester unit total across all 4 years and summers', () => {
    for (const termExpected of ANSCI_CURRICULUM.termTotals) {
      const termCourses = ANSCI_CURRICULUM.courses.filter(
        (c) =>
          (c.kind === 'REGULAR' || c.kind === 'SMC_SLOT') &&
          c.year === termExpected.year &&
          c.term === termExpected.term &&
          c.creditBearing
      );

      const computedUnits = termCourses.reduce((sum, c) => sum + c.units, 0);
      expect({
        year: termExpected.year,
        term: termExpected.term,
        units: computedUnits,
      }).toEqual({
        year: termExpected.year,
        term: termExpected.term,
        units: termExpected.printedUnits,
      });
    }
  });

  test('contains all 13 Specialized Major Course options (ANS141 through ANS153) and 3 SMC slots', () => {
    const smcSlots = ANSCI_CURRICULUM.courses.filter((c) => c.kind === 'SMC_SLOT');
    const smcOptions = ANSCI_CURRICULUM.courses.filter((c) => c.kind === 'SMC_OPTION');

    expect(smcSlots.map((s) => s.code)).toEqual(['SMC-1', 'SMC-2', 'SMC-3']);
    expect(smcOptions).toHaveLength(13);
    expect(smcOptions[0]?.code).toBe('ANS141');
    expect(smcOptions[12]?.code).toBe('ANS153');
  });

  test('explicitly documents unresolved AGF101 and AGF102 prerequisites from the source PDF', () => {
    const knownCodes = new Set(ANSCI_CURRICULUM.courses.map((c) => c.code));
    const unresolvedRefs: { course: string; prereq: string }[] = [];

    for (const course of ANSCI_CURRICULUM.courses) {
      for (const prereq of course.prerequisites) {
        if (!knownCodes.has(prereq)) {
          unresolvedRefs.push({ course: course.code, prereq });
        }
      }
    }

    expect(unresolvedRefs).toEqual([
      { course: 'ANS042', prereq: 'AGF101' },
      { course: 'ANS043', prereq: 'AGF101' },
      { course: 'ANS044', prereq: 'AGF101' },
      { course: 'ANS044', prereq: 'AGF102' },
    ]);
  });
});

