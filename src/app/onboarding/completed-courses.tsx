import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding/onboarding-header';
import { StickyContinueCard } from '@/components/onboarding/sticky-continue-card';
import { BrandTheme, MaxContentWidth } from '@/constants/theme';
import { ANSCI_CURRICULUM } from '@/domain/curriculum/ansci-curriculum';
import type { CurriculumCourse, Term, YearLevel } from '@/domain/curriculum/types';
import { usePlanner } from '@/state/planner-context';

const YEAR_TABS: { year: YearLevel; label: string; ordinal: string }[] = [
  { year: 1, label: '1st Year', ordinal: '1st' },
  { year: 2, label: '2nd Year', ordinal: '2nd' },
  { year: 3, label: '3rd Year', ordinal: '3rd' },
  { year: 4, label: '4th Year', ordinal: '4th' },
];

const TERM_SECTIONS: { term: Term; label: string }[] = [
  { term: 'FIRST', label: '1st Semester' },
  { term: 'SECOND', label: '2nd Semester' },
  { term: 'SUMMER', label: 'Summer Term' },
];

export default function CompletedCoursesScreen() {
  const router = useRouter();
  const {
    completedCourses,
    toggleCourseCompleted,
    setCoursesCompletedBulk,
    clearAllCompletedCourses,
    persistCompletedCourses,
  } = usePlanner();

  const [activeYear, setActiveYear] = useState<YearLevel>(1);

  const activeYearMeta =
    YEAR_TABS.find((t) => t.year === activeYear) ?? YEAR_TABS[0];

  const coursesForActiveYear = useMemo(
    () =>
      ANSCI_CURRICULUM.courses.filter(
        (c) =>
          (c.kind === 'REGULAR' || c.kind === 'SMC_SLOT') && c.year === activeYear
      ),
    [activeYear]
  );

  const semesterGroups = useMemo(() => {
    return TERM_SECTIONS.map((section) => {
      const items = coursesForActiveYear.filter((c) => c.term === section.term);
      return {
        term: section.term,
        title: `${activeYearMeta.ordinal} Year · ${section.label}`,
        courses: items,
      };
    }).filter((group) => group.courses.length > 0);
  }, [coursesForActiveYear, activeYearMeta.ordinal]);

  const totalCompletedCount = completedCourses.size;

  const allInYearCompleted =
    coursesForActiveYear.length > 0 &&
    coursesForActiveYear.every((c) => completedCourses.has(c.code));

  const handleCompleteThisYear = () => {
    const codes = coursesForActiveYear.map((c) => c.code);
    setCoursesCompletedBulk(codes, !allInYearCompleted);
  };

  const handleToggleSemesterAll = (courses: CurriculumCourse[]) => {
    const codes = courses.map((c) => c.code);
    const allSelected = codes.every((code) => completedCourses.has(code));
    setCoursesCompletedBulk(codes, !allSelected);
  };

  const handleContinue = async () => {
    await persistCompletedCourses();
    router.push('/onboarding/confidence-rating');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.mainColumn}>
        <OnboardingHeader
          stepText="STEP 2 OF 3"
          sectionText="YOUR PROGRESS"
          progressPercent={62}
          title="Completed Courses"
          subtitle={'Select the courses you have already\ncompleted.'}
        />

        {/* Logical Year-Level Tabs: 1st, 2nd, 3rd, 4th Year */}
        <View style={styles.yearTabsWrapper}>
          <View style={styles.yearTabsRow}>
            {YEAR_TABS.map((tab) => {
              const isActive = tab.year === activeYear;
              return (
                <Pressable
                  key={tab.year}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  testID={`year-tab-${tab.year}`}
                  onPress={() => setActiveYear(tab.year)}
                  style={[
                    styles.yearTabButton,
                    isActive ? styles.yearTabActive : styles.yearTabInactive,
                  ]}>
                  <Text
                    style={[
                      styles.yearTabText,
                      isActive ? styles.yearTabTextActive : styles.yearTabTextInactive,
                    ]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Completed Counter & "Complete this year" Bar */}
          <View style={styles.summaryBar}>
            <Text style={styles.completedCountText} testID="completed-courses-counter">
              {`${totalCompletedCount} completed ${
                totalCompletedCount === 1 ? 'course' : 'courses'
              }`}
            </Text>

            <View style={styles.summaryActionsRow}>
              {totalCompletedCount > 0 && (
                <Pressable
                  accessibilityRole="button"
                  testID="clear-completed-courses-button"
                  onPress={clearAllCompletedCourses}
                  hitSlop={8}>
                  <Text style={styles.clearAllActionText}>Clear all</Text>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                testID="complete-this-year-button"
                onPress={handleCompleteThisYear}
                hitSlop={8}>
                <Text style={styles.completeYearActionText}>
                  {allInYearCompleted ? 'Unselect this year' : 'Complete this year'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Semester Course Checklists */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {semesterGroups.map((group) => {
            const allSemSelected =
              group.courses.length > 0 &&
              group.courses.every((c) => completedCourses.has(c.code));

            return (
              <View key={group.term} style={styles.semesterBlock}>
                <View style={styles.semesterHeaderRow}>
                  <Text style={styles.semesterTitle}>{group.title}</Text>

                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: allSemSelected }}
                    testID={`select-all-${activeYear}-${group.term}`}
                    onPress={() => handleToggleSemesterAll(group.courses)}
                    hitSlop={6}
                    style={styles.selectAllButton}>
                    <View
                      style={[
                        styles.smallCheckbox,
                        allSemSelected && styles.checkboxChecked,
                      ]}>
                      {allSemSelected && (
                        <Text style={styles.smallCheckMark} allowFontScaling={false}>
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text style={styles.selectAllLabel}>Select All</Text>
                  </Pressable>
                </View>

                <View style={styles.courseRowsContainer}>
                  {group.courses.map((course) => {
                    const isChecked = completedCourses.has(course.code);
                    const unitDisplay = course.creditBearing
                      ? String(course.units)
                      : `(${course.units})`;

                    return (
                      <Pressable
                        key={course.code}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isChecked }}
                        accessibilityLabel={`${course.code} ${course.title}, ${unitDisplay} units`}
                        testID={`course-row-${course.code}`}
                        onPress={() => toggleCourseCompleted(course.code)}
                        style={styles.courseRow}>
                        <View
                          style={[
                            styles.courseCheckbox,
                            isChecked && styles.checkboxChecked,
                          ]}>
                          {isChecked && (
                            <Text style={styles.courseCheckMark} allowFontScaling={false}>
                              ✓
                            </Text>
                          )}
                        </View>

                        <Text style={styles.courseCode} numberOfLines={1}>
                          {course.code}
                        </Text>

                        <Text style={styles.courseTitle} numberOfLines={1}>
                          {course.title}
                        </Text>

                        <Text style={styles.courseUnits}>{unitDisplay}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <StickyContinueCard
          caption="Tap a course to mark it done."
          testID="completed-courses-continue"
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  mainColumn: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: '#FFFFFF',
  },
  yearTabsWrapper: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  yearTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  yearTabButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearTabActive: {
    backgroundColor: BrandTheme.primaryGreen,
  },
  yearTabInactive: {
    backgroundColor: '#EFF4F0',
  },
  yearTabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  yearTabTextActive: {
    color: '#FFFFFF',
  },
  yearTabTextInactive: {
    color: '#3F5447',
  },
  summaryBar: {
    backgroundColor: '#ECF5EE',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedCountText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#465D4F',
  },
  summaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearAllActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B83228',
  },
  completeYearActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: BrandTheme.primaryGreen,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 20,
  },
  semesterBlock: {
    gap: 6,
  },
  semesterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F2',
  },
  semesterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallCheckbox: {
    width: 15,
    height: 15,
    borderRadius: 4,
    borderWidth: 1.3,
    borderColor: '#C5D0C9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallCheckMark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  selectAllLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#738278',
  },
  courseRowsContainer: {
    gap: 2,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  courseCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.4,
    borderColor: '#CBD4CE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: BrandTheme.primaryGreen,
    borderColor: BrandTheme.primaryGreen,
  },
  courseCheckMark: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  courseCode: {
    width: 74,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E3326',
  },
  courseTitle: {
    flex: 1,
    fontSize: 12.5,
    color: '#637369',
    paddingRight: 10,
  },
  courseUnits: {
    width: 28,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#46584D',
    textAlign: 'right',
  },
});

