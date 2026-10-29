import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabScreenHeader } from '@/components/tabs/tab-screen-header';
import { BrandTheme, MaxContentWidth } from '@/constants/theme';
import { ANSCI_CURRICULUM } from '@/domain/curriculum/ansci-curriculum';
import { usePlanner } from '@/state/planner-context';

export type CourseFilterTab = 'All' | 'Completed' | 'Planned' | 'Available';

const FILTER_TABS: readonly CourseFilterTab[] = [
  'All',
  'Completed',
  'Planned',
  'Available',
];

/**
 * Screen 13 — Courses Catalog (`13_Courses_Catalog.png`)
 *
 * Displays:
 * - Search bar filtering by course code or title
 * - Degree progress bar ("15 of 178 credits" / completed credits)
 * - Filter tabs: All, Completed, Planned, Available
 * - Interactive course rows with status badges and expandable prerequisite details
 */
export default function CoursesCatalogScreen() {
  const {
    profile,
    completedCourses,
    backwardChaining,
    academicPlan,
    toggleCourseCompleted,
  } = usePlanner();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CourseFilterTab>('All');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const plannedCodeSet = useMemo(
    () => new Set(academicPlan.nextSemester.courses.map((c) => c.course.code)),
    [academicPlan.nextSemester.courses]
  );

  const displayedCredits =
    academicPlan.completedUnits > 0
      ? academicPlan.completedUnits
      : academicPlan.nextSemester.totalUnits;

  const progressFraction = Math.min(
    1,
    displayedCredits / academicPlan.totalDegreeUnits
  );

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return ANSCI_CURRICULUM.courses.filter((course) => {
      if (query.length > 0) {
        const matchesCode = course.code.toLowerCase().includes(query);
        const matchesSource =
          course.sourceCode?.toLowerCase().includes(query) ?? false;
        const matchesTitle = course.title.toLowerCase().includes(query);
        if (!matchesCode && !matchesSource && !matchesTitle) {
          return false;
        }
      }

      const analysis = backwardChaining.analysisByCourse[course.code];
      const isCompleted = completedCourses.has(course.code);
      const isPlanned = plannedCodeSet.has(course.code);
      const isAvailable = analysis?.status === 'ELIGIBLE_NOW';

      switch (activeFilter) {
        case 'Completed':
          return isCompleted;
        case 'Planned':
          return isPlanned && !isCompleted;
        case 'Available':
          return isAvailable && !isCompleted;
        case 'All':
        default:
          return true;
      }
    });
  }, [searchQuery, activeFilter, backwardChaining.analysisByCourse, completedCourses, plannedCodeSet]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.mainColumn}>
        <TabScreenHeader
          eyebrow="YOUR DEGREE"
          title="Courses"
          fullName={profile.fullName}
        />

        <View style={styles.topControls}>
          {/* Search Input */}
          <View style={styles.searchBox}>
            <View style={styles.searchLensIcon} aria-hidden>
              <View style={styles.searchLensCircle} />
              <View style={styles.searchLensHandle} />
            </View>
            <TextInput
              testID="courses-search-input"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search all courses"
              placeholderTextColor="#9BA6A0"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Degree Progress Banner */}
          <View style={styles.progressBanner} testID="courses-degree-progress-card">
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressLabel}>Degree progress</Text>
              <Text style={styles.progressCreditsText} testID="courses-degree-credits">
                {`${displayedCredits} of ${academicPlan.totalDegreeUnits} credits`}
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.max(4, Math.round(progressFraction * 100))}%` },
                ]}
              />
            </View>
          </View>

          {/* Filter Pills Row */}
          <View style={styles.filterPillsRow}>
            {FILTER_TABS.map((tab) => {
              const isSelected = activeFilter === tab;
              return (
                <Pressable
                  key={tab}
                  accessibilityRole="button"
                  testID={`courses-filter-${tab}`}
                  onPress={() => setActiveFilter(tab)}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextActive,
                    ]}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {filteredCourses.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateText}>
                No courses match your current filter.
              </Text>
            </View>
          ) : (
            filteredCourses.map((course) => {
              const analysis = backwardChaining.analysisByCourse[course.code];
              const isCompleted = completedCourses.has(course.code);
              const isPlanned = plannedCodeSet.has(course.code) && !isCompleted;
              const isAvailable =
                analysis?.status === 'ELIGIBLE_NOW' && !isCompleted;
              const isExpanded = expandedCode === course.code;

              let statusText = 'Available';
              let pillBg = '#EEF0F6';
              let pillColor = '#5E6A85';

              if (isCompleted) {
                statusText = 'Completed';
                pillBg = '#E1F3E7';
                pillColor = BrandTheme.primaryGreen;
              } else if (isPlanned) {
                statusText = 'Planned';
                pillBg = '#E4F0FB';
                pillColor = '#215B8A';
              } else if (!isAvailable) {
                const missingList = analysis?.missingPrerequisites ?? [];
                statusText =
                  missingList.length > 0
                    ? `Needs ${missingList.join(', ')}`
                    : analysis?.missingCasStanding
                      ? 'Needs CAS (2nd Yr)'
                      : 'Available';
                if (statusText !== 'Available') {
                  pillBg = '#FBF1E1';
                  pillColor = '#9B6016';
                }
              }

              return (
                <Pressable
                  key={course.code}
                  accessibilityRole="button"
                  testID={`catalog-course-row-${course.code}`}
                  onPress={() =>
                    setExpandedCode((prev) =>
                      prev === course.code ? null : course.code
                    )
                  }
                  style={styles.courseRowCard}>
                  <View style={styles.courseRowTop}>
                    <View style={styles.courseDocBadge} aria-hidden>
                      <View style={styles.courseDocOutline}>
                        <View style={styles.courseDocLineShort} />
                        <View style={styles.courseDocLineLong} />
                      </View>
                    </View>

                    <View style={styles.courseTextCol}>
                      <Text style={styles.courseCodeText}>{course.code}</Text>
                      <Text style={styles.courseTitleText}>{course.title}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: pillBg },
                        ]}>
                        <Text
                          style={[styles.statusBadgeText, { color: pillColor }]}>
                          {statusText}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {isExpanded && (
                    <View
                      style={styles.expandedDetailsBox}
                      testID={`catalog-course-details-${course.code}`}>
                      <Text style={styles.detailMetaText}>
                        {`Credits: ${
                          course.creditBearing
                            ? `${course.units} units`
                            : `(${course.units}) non-credit NSTP`
                        }${
                          course.year && course.term
                            ? ` · Year ${course.year} (${course.term})`
                            : ' · Specialized Major Course'
                        }`}
                      </Text>

                      {analysis && analysis.unresolvedPrerequisites.length > 0 && (
                        <Text style={styles.unresolvedWarningText}>
                          {`Curriculum Notice: Source PDF lists "${analysis.unresolvedPrerequisites.join(
                            ', '
                          )}" in red ink (unresolved legacy code).`}
                        </Text>
                      )}

                      <Pressable
                        accessibilityRole="button"
                        testID={`catalog-toggle-complete-${course.code}`}
                        onPress={() => toggleCourseCompleted(course.code)}
                        style={styles.toggleCompleteButton}>
                        <Text style={styles.toggleCompleteButtonText}>
                          {isCompleted
                            ? 'Mark as not completed'
                            : 'Mark as completed ✓'}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FCF9',
    alignItems: 'center',
  },
  mainColumn: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: '#F9FCF9',
  },
  topControls: {
    paddingHorizontal: 22,
    gap: 12,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE7E1',
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchLensIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchLensCircle: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1.8,
    borderColor: '#98A49D',
  },
  searchLensHandle: {
    width: 5,
    height: 1.8,
    backgroundColor: '#98A49D',
    position: 'absolute',
    bottom: 1,
    right: 1,
    transform: [{ rotate: '45deg' }],
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: BrandTheme.textPrimary,
    paddingVertical: 0,
  },
  progressBanner: {
    backgroundColor: '#EAF5EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: BrandTheme.textPrimary,
  },
  progressCreditsText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: BrandTheme.primaryGreen,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D5E7DC',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: BrandTheme.primaryGreen,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5DF',
  },
  filterPillActive: {
    backgroundColor: BrandTheme.primaryGreen,
    borderColor: BrandTheme.primaryGreen,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A4D42',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  emptyStateBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: BrandTheme.textSecondary,
  },
  courseRowCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2EE',
  },
  courseRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  courseDocBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  courseDocOutline: {
    width: 14,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#78877F',
    padding: 2,
    justifyContent: 'space-around',
  },
  courseDocLineShort: {
    width: 4,
    height: 1.4,
    backgroundColor: '#78877F',
  },
  courseDocLineLong: {
    width: 7,
    height: 1.4,
    backgroundColor: '#78877F',
  },
  courseTextCol: {
    flex: 1,
    gap: 3,
    alignItems: 'flex-start',
  },
  courseCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
  },
  courseTitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: BrandTheme.textSecondary,
  },
  statusBadge: {
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  expandedDetailsBox: {
    marginTop: 10,
    marginLeft: 48,
    backgroundColor: '#F3FAF5',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D6EBE0',
    gap: 6,
  },
  detailMetaText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2B543D',
  },
  unresolvedWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A35812',
    lineHeight: 15,
  },
  toggleCompleteButton: {
    alignSelf: 'flex-start',
    backgroundColor: BrandTheme.primaryGreen,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 2,
  },
  toggleCompleteButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

