import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TabScreenHeader } from "@/components/tabs/tab-screen-header";
import { BrandTheme, MaxContentWidth } from "@/constants/theme";
import { usePlanner } from "@/state/planner-context";

export default function PlanRoadmapScreen() {
  const router = useRouter();
  const { profile, completedCourses, academicPlan, updateAcademicGoal } =
    usePlanner();
  const { workloadAnalysis, nextSemester, semesters } = academicPlan;

  const [showAllNextSemester, setShowAllNextSemester] = useState(false);
  const [expandedSemesterIndices, setExpandedSemesterIndices] = useState<
    Record<number, boolean>
  >({ 1: true });
  const [selectedRoadmapCourseKey, setSelectedRoadmapCourseKey] = useState<
    string | null
  >(null);

  // Compute displayed semesters to graduation and completion percentage
  const nominalRemainingSemesters = Math.max(
    1,
    (profile.targetTimelineYears - profile.currentYearLevel) * 2,
  );
  const displayedSemestersCount =
    completedCourses.size === 0 && profile.currentYearLevel > 1
      ? nominalRemainingSemesters
      : academicPlan.semestersToGraduation;
  const isDisplayedOnTrack =
    displayedSemestersCount <= profile.targetTimelineYears * 2;

  const plannedOrCompletedUnits =
    academicPlan.completedUnits > 0
      ? academicPlan.completedUnits
      : nextSemester.totalUnits;
  const displayedCompletionPercent = Math.min(
    100,
    Math.round((plannedOrCompletedUnits / academicPlan.totalDegreeUnits) * 100),
  );

  const stressHeadline =
    workloadAnalysis.stressLabel === "Low"
      ? "Next semester workload looks well balanced"
      : workloadAnalysis.stressLabel === "Moderate"
        ? "Next semester looks moderately stressful"
        : "Next semester looks highly demanding";

  const visibleNextCourses = showAllNextSemester
    ? nextSemester.courses
    : nextSemester.courses.slice(0, 4);

  const toggleSemesterCard = (semesterIndex: number) => {
    setExpandedSemesterIndices((prev) => ({
      ...prev,
      [semesterIndex]: !prev[semesterIndex],
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mainColumn}>
        <TabScreenHeader
          eyebrow="YOUR PLAN"
          title="Your plan"
          fullName={profile.fullName}
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard} testID="plan-hero-card">
            <View style={styles.heroLeft}>
              <View style={styles.onTrackBadgeRow}>
                <View style={styles.miniBranchIcon} aria-hidden>
                  <View style={styles.miniBranchDotTop} />
                  <View style={styles.miniBranchLine} />
                  <View style={styles.miniBranchDotBottom} />
                </View>
                <Text style={styles.onTrackText}>
                  {isDisplayedOnTrack ? "YOU'RE ON TRACK" : "EXTENDED TIMELINE"}
                </Text>
              </View>

              <Text
                style={styles.heroTitle}
                testID="plan-semesters-to-graduation"
              >
                {`${displayedSemestersCount} ${
                  displayedSemestersCount === 1 ? "semester" : "semesters"
                } to\ngraduation`}
              </Text>

              <Text
                style={styles.heroSubtitle}
                testID="plan-credits-timeline-summary"
              >
                {`${nextSemester.totalUnits} credits planned · ${profile.targetTimelineYears}-year timeline`}
              </Text>
            </View>

            <View
              style={styles.progressRingOuter}
              testID="plan-completion-ring"
            >
              <View style={styles.progressRingHighlight} />
              <Text style={styles.progressPercentText} allowFontScaling={false}>
                {`${displayedCompletionPercent}%`}
              </Text>
              <Text
                style={styles.progressCompleteLabel}
                allowFontScaling={false}
              >
                complete
              </Text>
            </View>
          </View>

          <View
            style={styles.dashboardShortcutsRow}
            testID="dashboard-shortcuts-row"
          >
            <Pressable
              accessibilityRole="button"
              testID="dashboard-shortcut-courses"
              onPress={() => router.push("/(tabs)/courses")}
              style={styles.shortcutCard}
            >
              <Text style={styles.shortcutEyebrow}>DEGREE</Text>
              <Text style={styles.shortcutTitle}>Courses</Text>
              <Text style={styles.shortcutSub}>
                {`${plannedOrCompletedUnits}/${academicPlan.totalDegreeUnits} cr`}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              testID="dashboard-shortcut-graph"
              onPress={() => router.push("/(tabs)/graph")}
              style={styles.shortcutCard}
            >
              <Text style={styles.shortcutEyebrow}>COURSE MAP</Text>
              <Text style={styles.shortcutTitle}>Goal Path</Text>
              <Text style={styles.shortcutSub}>Prerequisites</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              testID="dashboard-shortcut-workload"
              onPress={() => router.push("/onboarding/confidence-rating")}
              style={styles.shortcutCard}
            >
              <Text style={styles.shortcutEyebrow}>WORKLOAD</Text>
              <Text style={styles.shortcutTitle}>Confidence</Text>
              <Text style={styles.shortcutSub}>
                {`${workloadAnalysis.recommendedUnits} units max`}
              </Text>
            </Pressable>
          </View>

          {!isDisplayedOnTrack && (
            <View
              style={styles.extendedTermCard}
              testID="extended-term-resolution-card"
            >
              <View style={styles.extendedTermTop}>
                <Text style={styles.extendedTermBadge}>
                  EXTENDED TERM REQUIRED
                </Text>
                <Text style={styles.extendedTermDescription}>
                  {academicPlan.extendedTermReason ??
                    `Your remaining prerequisite chain requires ${displayedSemestersCount} semesters, which exceeds your ${profile.targetTimelineYears}-year target timeline.`}
                </Text>
              </View>
              {profile.targetTimelineYears < 6 && (
                <Pressable
                  accessibilityRole="button"
                  testID="resolve-extended-term-button"
                  onPress={() =>
                    updateAcademicGoal(
                      profile.targetTimelineYears === 4 ? 5 : 6,
                    )
                  }
                  style={styles.resolveTimelineButton}
                >
                  <Text style={styles.resolveTimelineButtonText}>
                    {`Extend timeline to ${
                      profile.targetTimelineYears === 4 ? 5 : 6
                    } Years →`}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={styles.roadmapHeaderBlock}>
            <Text style={styles.roadmapHeading}>Your roadmap</Text>
            <Text style={styles.roadmapSubheading}>
              Tap a semester or course to see placement details
            </Text>
          </View>

          <View style={styles.stressAlertCard} testID="plan-stress-alert-card">
            <View style={styles.alertExclamationBadge}>
              <Text
                style={styles.alertExclamationText}
                allowFontScaling={false}
              >
                !
              </Text>
            </View>
            <View style={styles.alertTextColumn}>
              <Text style={styles.alertTitle}>{stressHeadline}</Text>
              <Text style={styles.alertSubtitle}>
                {`${workloadAnalysis.stressScore}% projected stress · ${workloadAnalysis.recommendedUnits}-unit recommended limit`}
              </Text>
            </View>
          </View>

          <View style={styles.semesterCard} testID="roadmap-semester-card-1">
            <Pressable
              accessibilityRole="button"
              testID="roadmap-semester-header-1"
              onPress={() => toggleSemesterCard(1)}
              style={styles.semesterCardHeader}
            >
              <View style={styles.semesterHeaderLeft}>
                <View style={styles.semesterNumberPill}>
                  <Text style={styles.semesterNumberText}>01</Text>
                </View>
                <View style={styles.semesterHeaderTitles}>
                  <Text style={styles.startHereEyebrow}>
                    {`START HERE · ${nextSemester.semesterTitle.toUpperCase()}`}
                  </Text>
                  <Text style={styles.semesterCardTitle}>Next Semester</Text>
                </View>
              </View>
              <Text style={styles.creditMaxLabel}>
                {`${nextSemester.recommendedUnitLimit} cr max`}
              </Text>
            </Pressable>

            {expandedSemesterIndices[1] !== false && (
              <View style={styles.semesterCoursesBody}>
                {visibleNextCourses.map((item) => {
                  const unitStr =
                    item.course.units === 1
                      ? "1 unit"
                      : `${item.course.units} units`;
                  const courseKey = `1-${item.course.code}`;
                  const isCourseSelected =
                    selectedRoadmapCourseKey === courseKey;

                  return (
                    <Pressable
                      key={item.course.code}
                      accessibilityRole="button"
                      testID={`plan-next-course-${item.course.code}`}
                      onPress={() =>
                        setSelectedRoadmapCourseKey((prev) =>
                          prev === courseKey ? null : courseKey,
                        )
                      }
                    >
                      <View style={styles.roadmapCourseRow}>
                        <Text style={styles.roadmapCourseCode}>
                          {item.course.code}
                        </Text>
                        <Text
                          style={styles.roadmapCourseTitle}
                          numberOfLines={1}
                        >
                          {item.course.title}
                        </Text>
                        <Text style={styles.roadmapCourseUnits}>{unitStr}</Text>
                      </View>
                      {isCourseSelected && (
                        <View
                          style={styles.roadmapCourseDetailBox}
                          testID={`roadmap-course-detail-${item.course.code}`}
                        >
                          <Text style={styles.roadmapCourseDetailText}>
                            {item.reason}
                          </Text>
                          <Text style={styles.roadmapCourseDetailMeta}>
                            {`${item.subjectArea} · ${item.courseStressLabel} Workload (${item.courseStressScore}% stress)`}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}

                <Pressable
                  accessibilityRole="button"
                  testID="view-all-recommended-courses-button"
                  onPress={() => setShowAllNextSemester((prev) => !prev)}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllButtonText}>
                    {showAllNextSemester
                      ? "Show fewer courses"
                      : "View all recommended courses"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {semesters.slice(1).map((sem) => {
            const isExpanded = Boolean(
              expandedSemesterIndices[sem.semesterIndex],
            );
            const numLabel = String(sem.semesterIndex).padStart(2, "0");
            const isSummer = sem.term === "SUMMER";

            return (
              <View
                key={`${sem.semesterIndex}-${sem.semesterTitle}`}
                style={styles.semesterCard}
                testID={`roadmap-semester-card-${sem.semesterIndex}`}
              >
                <Pressable
                  accessibilityRole="button"
                  testID={`roadmap-semester-header-${sem.semesterIndex}`}
                  onPress={() => toggleSemesterCard(sem.semesterIndex)}
                  style={styles.semesterCardHeader}
                >
                  <View style={styles.semesterHeaderLeft}>
                    <View
                      style={[
                        styles.semesterNumberPill,
                        isSummer && styles.summerNumberPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.semesterNumberText,
                          isSummer && styles.summerNumberText,
                        ]}
                      >
                        {numLabel}
                      </Text>
                    </View>
                    <View style={styles.semesterHeaderTitles}>
                      <Text style={styles.startHereEyebrow}>
                        {isSummer ? "SUMMER PRACTICUM / OJT" : "UPCOMING TERM"}
                      </Text>
                      <Text style={styles.semesterCardTitle}>
                        {sem.semesterTitle}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.creditMaxLabel}>
                    {`${sem.totalUnits} units`}
                  </Text>
                </Pressable>

                {isExpanded && (
                  <View style={styles.semesterCoursesBody}>
                    {sem.courses.map((item) => {
                      const unitStr =
                        item.course.units === 1
                          ? "1 unit"
                          : `${item.course.units} units`;
                      const courseKey = `${sem.semesterIndex}-${item.course.code}`;
                      const isCourseSelected =
                        selectedRoadmapCourseKey === courseKey;

                      return (
                        <Pressable
                          key={item.course.code}
                          accessibilityRole="button"
                          testID={`roadmap-course-row-${sem.semesterIndex}-${item.course.code}`}
                          onPress={() =>
                            setSelectedRoadmapCourseKey((prev) =>
                              prev === courseKey ? null : courseKey,
                            )
                          }
                        >
                          <View style={styles.roadmapCourseRow}>
                            <Text style={styles.roadmapCourseCode}>
                              {item.course.code}
                            </Text>
                            <Text
                              style={styles.roadmapCourseTitle}
                              numberOfLines={1}
                            >
                              {item.course.title}
                            </Text>
                            <Text style={styles.roadmapCourseUnits}>
                              {unitStr}
                            </Text>
                          </View>
                          {isCourseSelected && (
                            <View style={styles.roadmapCourseDetailBox}>
                              <Text style={styles.roadmapCourseDetailText}>
                                {item.reason}
                              </Text>
                              <Text style={styles.roadmapCourseDetailMeta}>
                                {`${item.subjectArea} · ${item.courseStressLabel} Workload`}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FCF9",
    alignItems: "center",
  },
  mainColumn: {
    flex: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    backgroundColor: "#F9FCF9",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 110,
    gap: 16,
  },
  heroCard: {
    backgroundColor: "#1E7D4E",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0E3F26",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 12,
    gap: 8,
  },
  onTrackBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniBranchIcon: {
    width: 12,
    height: 12,
    justifyContent: "space-between",
  },
  miniBranchDotTop: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#BCEAD0",
  },
  miniBranchLine: {
    width: 6,
    height: 4,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#BCEAD0",
    marginLeft: 1,
  },
  miniBranchDotBottom: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#BCEAD0",
    alignSelf: "flex-end",
  },
  onTrackText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.9,
    color: "#D6F5E3",
  },
  heroTitle: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#CBEAD8",
  },
  progressRingOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 6,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingHighlight: {
    position: "absolute",
    top: -6,
    right: 12,
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  progressPercentText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  progressCompleteLabel: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#D6F5E3",
    marginTop: -1,
  },
  roadmapHeaderBlock: {
    marginTop: 6,
    gap: 3,
  },
  roadmapHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: BrandTheme.textPrimary,
    letterSpacing: -0.3,
  },
  roadmapSubheading: {
    fontSize: 12.5,
    fontWeight: "500",
    color: BrandTheme.textSecondary,
  },
  stressAlertCard: {
    backgroundColor: "#FDF8EE",
    borderWidth: 1,
    borderColor: "#F3DFBE",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  alertExclamationBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F5DFB8",
    alignItems: "center",
    justifyContent: "center",
  },
  alertExclamationText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#9C5C12",
  },
  alertTextColumn: {
    flex: 1,
    gap: 3,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: BrandTheme.textPrimary,
  },
  alertSubtitle: {
    fontSize: 11.5,
    fontWeight: "500",
    color: BrandTheme.textSecondary,
  },
  semesterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE8E0",
    overflow: "hidden",
  },
  semesterCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF4F1",
  },
  semesterHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  semesterNumberPill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E5F4EB",
    alignItems: "center",
    justifyContent: "center",
  },
  semesterNumberText: {
    fontSize: 12,
    fontWeight: "800",
    color: BrandTheme.primaryGreen,
  },
  semesterHeaderTitles: {
    gap: 2,
  },
  startHereEyebrow: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: "#73827A",
  },
  semesterCardTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: BrandTheme.textPrimary,
  },
  creditMaxLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: BrandTheme.textSecondary,
  },
  semesterCoursesBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  roadmapCourseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F2",
    gap: 10,
  },
  roadmapCourseCode: {
    width: 68,
    fontSize: 11.5,
    fontWeight: "800",
    color: "#1A5E3B",
  },
  roadmapCourseTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: BrandTheme.textSecondary,
  },
  roadmapCourseUnits: {
    fontSize: 11.5,
    fontWeight: "600",
    color: BrandTheme.textSecondary,
  },
  viewAllButton: {
    paddingTop: 13,
    paddingBottom: 2,
  },
  viewAllButtonText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: BrandTheme.primaryGreen,
  },
  dashboardShortcutsRow: {
    flexDirection: "row",
    gap: 10,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE8E0",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 2,
  },
  shortcutEyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: BrandTheme.primaryGreen,
  },
  shortcutTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: BrandTheme.textPrimary,
  },
  shortcutSub: {
    fontSize: 10.5,
    fontWeight: "600",
    color: BrandTheme.textSecondary,
  },
  extendedTermCard: {
    backgroundColor: "#FFF5EB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3D2B0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  extendedTermTop: {
    gap: 4,
  },
  extendedTermBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#B55B0C",
  },
  extendedTermDescription: {
    fontSize: 11.5,
    lineHeight: 16,
    color: "#6E451B",
    fontWeight: "500",
  },
  resolveTimelineButton: {
    alignSelf: "flex-start",
    backgroundColor: BrandTheme.primaryGreen,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  resolveTimelineButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  summerNumberPill: {
    backgroundColor: "#FBF0D9",
  },
  summerNumberText: {
    color: "#A9620E",
  },
  roadmapCourseDetailBox: {
    backgroundColor: "#F3FAF5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#D6EBE0",
    gap: 3,
  },
  roadmapCourseDetailText: {
    fontSize: 11,
    lineHeight: 15,
    color: "#2A593E",
    fontWeight: "500",
  },
  roadmapCourseDetailMeta: {
    fontSize: 10,
    color: BrandTheme.textSecondary,
    fontWeight: "600",
  },
});
