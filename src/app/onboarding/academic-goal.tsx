import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding/onboarding-header';
import { StickyContinueCard } from '@/components/onboarding/sticky-continue-card';
import { BrandTheme, MaxContentWidth } from '@/constants/theme';
import type { TargetTimelineYears } from '@/db/repository';
import { usePlanner } from '@/state/planner-context';

const TIMELINE_OPTIONS: { years: TargetTimelineYears; label: string }[] = [
  { years: 4, label: '4 Years' },
  { years: 5, label: '5 Years' },
  { years: 6, label: '6 Years' },
];

export default function AcademicGoalScreen() {
  const router = useRouter();
  const { profile, updateAcademicGoal } = usePlanner();

  const [timelineOverride, setTimeline] = useState<TargetTimelineYears | null>(null);
  const timeline = timelineOverride ?? profile.targetTimelineYears;

  const handleContinue = async () => {
    await updateAcademicGoal(timeline);
    router.push('/onboarding/completed-courses');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.mainColumn}>
        <OnboardingHeader
          showLogos
          stepText="STEP 1 OF 3"
          sectionText="YOUR GOAL"
          progressPercent={36}
          title="Academic Goal"
          subtitle="Select your program and goal."
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Program Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Program</Text>

            <View style={styles.selectedCard} testID="program-card">
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardLeftRow}>
                  <View style={styles.leafIconWrapper} aria-hidden>
                    <View style={styles.leafShape} />
                  </View>
                  <View style={styles.cardTextGroup}>
                    <Text style={styles.cardTitle}>BS Agriculture</Text>
                    <Text style={styles.cardSubtitle}>Major in Animal Science</Text>
                  </View>
                </View>

                <View style={styles.checkCircle} aria-hidden>
                  <Text style={styles.checkMark} allowFontScaling={false}>
                    ✓
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Your Goal Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Your Goal</Text>

            <View style={styles.selectedCard} testID="goal-card">
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardLeftRow}>
                  <View style={styles.flagIconWrapper} aria-hidden>
                    <View style={styles.flagBannerShape} />
                  </View>
                  <View style={styles.cardTextGroup}>
                    <Text style={styles.cardTitle}>Complete Program</Text>
                    <Text style={styles.cardSubtitle}>Choose your target timeline</Text>
                  </View>
                </View>

                <View style={styles.checkCircle} aria-hidden>
                  <Text style={styles.checkMark} allowFontScaling={false}>
                    ✓
                  </Text>
                </View>
              </View>

              {/* Timeline Selector Pills */}
              <View style={styles.timelineRow}>
                {TIMELINE_OPTIONS.map((option) => {
                  const isSelected = option.years === timeline;
                  return (
                    <Pressable
                      key={option.years}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      testID={`timeline-option-${option.years}`}
                      onPress={() => setTimeline(option.years)}
                      style={[
                        styles.timelinePill,
                        isSelected ? styles.timelinePillActive : styles.timelinePillInactive,
                      ]}>
                      <Text
                        style={[
                          styles.timelinePillText,
                          isSelected
                            ? styles.timelinePillTextActive
                            : styles.timelinePillTextInactive,
                        ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Curriculum Institution Info Banner */}
          <View style={styles.curriculumBanner}>
            <View style={styles.targetIconCircle} aria-hidden>
              <View style={styles.targetInnerDot} />
            </View>
            <Text style={styles.bannerText}>
              {'This curriculum is based on\n'}
              <Text style={styles.bannerTextStrong}>Mindanao State University</Text>
              {'\nat Naawan AY 2025–2026.'}
            </Text>
          </View>
        </ScrollView>

        <StickyContinueCard
          caption={`Planning for a ${timeline}-year completion timeline.`}
          testID="academic-goal-continue"
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    gap: 20,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BrandTheme.textPrimary,
  },
  selectedCard: {
    backgroundColor: '#F3FAF5',
    borderRadius: 16,
    borderWidth: 1.3,
    borderColor: '#73AE8E',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  leafIconWrapper: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leafShape: {
    width: 18,
    height: 18,
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 3,
    borderWidth: 2,
    borderColor: BrandTheme.primaryGreen,
  },
  flagIconWrapper: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  flagBannerShape: {
    width: 20,
    height: 15,
    backgroundColor: BrandTheme.primaryGreen,
    borderRadius: 2,
    transform: [{ skewY: '-6deg' }],
  },
  cardTextGroup: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: BrandTheme.textSecondary,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: BrandTheme.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timelinePill: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  timelinePillActive: {
    backgroundColor: BrandTheme.primaryGreen,
    borderColor: BrandTheme.primaryGreen,
  },
  timelinePillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D5E0D9',
  },
  timelinePillText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  timelinePillTextActive: {
    color: '#FFFFFF',
  },
  timelinePillTextInactive: {
    color: BrandTheme.textPrimary,
  },
  curriculumBanner: {
    backgroundColor: '#E2F4E7',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
  },
  targetIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: BrandTheme.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandTheme.primaryGreen,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#2F5B41',
    textAlign: 'center',
  },
  bannerTextStrong: {
    fontWeight: '800',
    color: BrandTheme.primaryGreen,
  },
});
