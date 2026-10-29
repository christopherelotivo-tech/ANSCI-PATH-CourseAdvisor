import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getInitials,
  TabScreenHeader,
} from '@/components/tabs/tab-screen-header';
import { BrandTheme, MaxContentWidth } from '@/constants/theme';
import { usePlanner } from '@/state/planner-context';

/**
 * Screen 15 — Settings (`15_Settings.png`)
 *
 * Displays:
 * - Student profile card ("Juan Dela Cruz", "BS Agriculture · Animal Science")
 * - PLAN SUMMARY card ("Planning window" & "Recommended workload")
 * - PRIVACY card ("Local data only", "✓ Everything is saved automatically")
 * - "Start a new academic plan" reset button
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { profile, completedCourses, academicPlan, resetAcademicPlan } =
    usePlanner();

  const nominalRemainingSemesters = Math.max(
    1,
    (profile.targetTimelineYears - profile.currentYearLevel) * 2
  );
  const displayedSemestersCount =
    completedCourses.size === 0 && profile.currentYearLevel > 1
      ? nominalRemainingSemesters
      : academicPlan.semestersToGraduation;

  const initials = getInitials(profile.fullName);

  const handleStartNewPlan = async () => {
    await resetAcademicPlan();
    router.push('/onboarding/student-setup');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.mainColumn}>
        <TabScreenHeader title="Settings" fullName={profile.fullName} />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Student Profile Card */}
          <View style={styles.profileCard} testID="settings-profile-card">
            <View style={styles.profileAvatarCircle}>
              <Text style={styles.profileAvatarText} allowFontScaling={false}>
                {initials}
              </Text>
            </View>
            <View style={styles.profileTextColumn}>
              <Text style={styles.profileNameText} testID="settings-student-name">
                {profile.fullName}
              </Text>
              <Text style={styles.profileProgramText}>
                BS Agriculture · Animal Science
              </Text>
            </View>
          </View>

          {/* PLAN SUMMARY Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionEyebrow}>PLAN SUMMARY</Text>

            <View style={styles.groupedCard}>
              <Pressable
                accessibilityRole="button"
                testID="settings-planning-window-row"
                onPress={() => router.push('/onboarding/academic-goal')}
                style={styles.cardRow}>
                <View style={styles.rowIconTile} aria-hidden>
                  <View style={styles.calendarIconBox}>
                    <View style={styles.calendarTopBar} />
                  </View>
                </View>

                <View style={styles.rowTextColumn}>
                  <Text style={styles.rowTitleText}>Planning window</Text>
                  <Text
                    style={styles.rowSubtitleText}
                    testID="settings-planning-window-summary">
                    {`${displayedSemestersCount} ${
                      displayedSemestersCount === 1 ? 'semester' : 'semesters'
                    } remaining · ${profile.targetTimelineYears}-year timeline`}
                  </Text>
                </View>

                <Text style={styles.chevronText} allowFontScaling={false}>
                  ›
                </Text>
              </Pressable>

              <View style={styles.rowDivider} />

              <Pressable
                accessibilityRole="button"
                testID="settings-recommended-workload-row"
                onPress={() => router.push('/onboarding/confidence-rating')}
                style={styles.cardRow}>
                <View style={styles.rowIconTile} aria-hidden>
                  <View style={styles.barsRow}>
                    <View style={[styles.barItem, { height: 4 }]} />
                    <View style={[styles.barItem, { height: 7 }]} />
                    <View style={[styles.barItem, { height: 10 }]} />
                    <View style={[styles.barItem, { height: 13 }]} />
                  </View>
                </View>

                <View style={styles.rowTextColumn}>
                  <Text style={styles.rowTitleText}>Recommended workload</Text>
                  <Text
                    style={styles.rowSubtitleText}
                    testID="settings-workload-summary">
                    {`${academicPlan.workloadAnalysis.recommendedUnits}-credit maximum · ${academicPlan.workloadAnalysis.stressScore}% stress`}
                  </Text>
                </View>

                <Text style={styles.chevronText} allowFontScaling={false}>
                  ›
                </Text>
              </Pressable>
            </View>
          </View>

          {/* PRIVACY Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionEyebrow}>PRIVACY</Text>

            <View style={styles.groupedCard}>
              <Pressable
                accessibilityRole="button"
                testID="settings-local-data-row"
                onPress={() => router.push('/onboarding/completed-courses')}
                style={styles.cardRow}>
                <View style={styles.rowIconTile} aria-hidden>
                  <View style={styles.gearOuterRing}>
                    <View style={styles.gearInnerRing} />
                  </View>
                </View>

                <View style={styles.rowTextColumn}>
                  <Text style={styles.rowTitleText}>Local data only</Text>
                  <Text style={styles.rowSubtitleText}>
                    Your profile and plan stay on this device
                  </Text>
                </View>

                <Text style={styles.chevronText} allowFontScaling={false}>
                  ›
                </Text>
              </Pressable>
            </View>

            <View style={styles.savedAutoRow}>
              <Text style={styles.savedAutoCheck} allowFontScaling={false}>
                ✓
              </Text>
              <Text style={styles.savedAutoText}>
                Everything is saved automatically
              </Text>
            </View>
          </View>

          {/* Start a New Academic Plan Reset Button */}
          <Pressable
            accessibilityRole="button"
            testID="start-new-academic-plan-button"
            onPress={handleStartNewPlan}
            style={({ pressed }) => [
              styles.startNewPlanButton,
              pressed && styles.startNewPlanButtonPressed,
            ]}>
            <Text style={styles.startNewPlanButtonText}>
              Start a new academic plan
            </Text>
          </Pressable>
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 28,
    gap: 22,
  },
  profileCard: {
    backgroundColor: '#EAF5EE',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DF7E58',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  profileTextColumn: {
    flex: 1,
    gap: 3,
  },
  profileNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
  },
  profileProgramText: {
    fontSize: 12,
    fontWeight: '500',
    color: BrandTheme.textSecondary,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#6E7D75',
  },
  groupedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DEE7E1',
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#EFF3F0',
  },
  rowIconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIconBox: {
    width: 15,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.6,
    borderColor: BrandTheme.primaryGreen,
    overflow: 'hidden',
  },
  calendarTopBar: {
    width: '100%',
    height: 3.5,
    backgroundColor: BrandTheme.primaryGreen,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barItem: {
    width: 2.2,
    borderRadius: 1,
    backgroundColor: BrandTheme.primaryGreen,
  },
  gearOuterRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.6,
    borderColor: BrandTheme.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearInnerRing: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.4,
    borderColor: BrandTheme.primaryGreen,
  },
  rowTextColumn: {
    flex: 1,
    gap: 3,
  },
  rowTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
  },
  rowSubtitleText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: BrandTheme.textSecondary,
  },
  chevronText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#88968E',
  },
  savedAutoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  savedAutoCheck: {
    fontSize: 11,
    fontWeight: '800',
    color: '#73827A',
  },
  savedAutoText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#73827A',
  },
  startNewPlanButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DDD7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  startNewPlanButtonPressed: {
    backgroundColor: '#FAF5F4',
  },
  startNewPlanButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#9A3E2D',
  },
});

