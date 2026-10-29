import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding/onboarding-header';
import { StickyContinueCard } from '@/components/onboarding/sticky-continue-card';
import { StressGauge } from '@/components/onboarding/stress-gauge';
import { BrandTheme, MaxContentWidth } from '@/constants/theme';
import { MAMDANI_FUZZY_RULES } from '@/domain/algorithms/fuzzy-workload';
import { usePlanner } from '@/state/planner-context';

/**
 * Screen 10 — Workload Analysis (`10_Workload_Analysis.png`)
 *
 * Displays the output of the Mamdani Fuzzy Inference System (`fuzzy-workload.ts`):
 * - Semicircle Stress Gauge with crisp defuzzified Semester Stress Level (0-100%)
 * - Green / Amber / Red Workload Indicator (`Flow.pdf` Step 10)
 * - Recommended Credit Limit (12-18 units)
 * - Factors Considered + interactive Mamdani Fuzzy Engine Breakdown (Fuzzification,
 *   IF-THEN Rule Evaluation, Centroid Defuzzification per `SystemArchitecture.pdf` Sec 3.2)
 */
export default function WorkloadAnalysisScreen() {
  const router = useRouter();
  const { academicPlan } = usePlanner();
  const { workloadAnalysis } = academicPlan;
  const [showFuzzyDetails, setShowFuzzyDetails] = useState(false);

  const isTest = Boolean(process.env.JEST_WORKER_ID);
  const [fadeAnim] = useState(() => new Animated.Value(isTest ? 1 : 0));

  useEffect(() => {
    if (isTest) return;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, isTest]);

  const handleContinue = () => {
    router.push('/onboarding/recommended-schedule');
  };

  const activeIndicatorLevel: 'GREEN' | 'AMBER' | 'RED' =
    workloadAnalysis.stressScore < 40
      ? 'GREEN'
      : workloadAnalysis.stressScore <= 68
        ? 'AMBER'
        : 'RED';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Animated.View style={[styles.mainColumn, { opacity: fadeAnim }]}>
        <OnboardingHeader
          stepText="STEP 3 OF 3"
          sectionText="YOUR WORKLOAD"
          progressPercent={100}
          title="Workload Analysis"
          subtitle={
            'Based on your confidence and the difficulty of\nrecommended courses.'
          }
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <StressGauge
            stressScore={workloadAnalysis.stressScore}
            stressLabel={workloadAnalysis.stressLabel}
          />

          {/* Green / Amber / Red Workload Indicator Bar (Flow.pdf Step 10) */}
          <View
            style={styles.trafficLightRow}
            testID="workload-traffic-light-indicator">
            <View
              style={[
                styles.trafficPill,
                activeIndicatorLevel === 'GREEN' && styles.trafficPillGreenActive,
              ]}>
              <View style={styles.dotGreen} />
              <Text
                style={[
                  styles.trafficPillText,
                  activeIndicatorLevel === 'GREEN' && styles.trafficTextGreenActive,
                ]}>
                Green · Balanced
              </Text>
            </View>

            <View
              style={[
                styles.trafficPill,
                activeIndicatorLevel === 'AMBER' && styles.trafficPillAmberActive,
              ]}>
              <View style={styles.dotAmber} />
              <Text
                style={[
                  styles.trafficPillText,
                  activeIndicatorLevel === 'AMBER' && styles.trafficTextAmberActive,
                ]}>
                Amber · Moderate
              </Text>
            </View>

            <View
              style={[
                styles.trafficPill,
                activeIndicatorLevel === 'RED' && styles.trafficPillRedActive,
              ]}>
              <View style={styles.dotRed} />
              <Text
                style={[
                  styles.trafficPillText,
                  activeIndicatorLevel === 'RED' && styles.trafficTextRedActive,
                ]}>
                Red · Overload
              </Text>
            </View>
          </View>

          {/* Recommended Credit Limit Card */}
          <View style={styles.creditLimitCard} testID="recommended-credit-limit-card">
            <View style={styles.creditIconBox} aria-hidden>
              <View style={styles.docOutline}>
                <View style={styles.docLineShort} />
                <View style={styles.docLineLong} />
                <View style={styles.docLineLong} />
              </View>
            </View>
            <View style={styles.creditTextColumn}>
              <Text style={styles.creditCardLabel}>Recommended Credit Limit</Text>
              <Text
                style={styles.creditCardValue}
                testID="recommended-credit-limit-value">
                {`${workloadAnalysis.recommendedUnits} units`}
              </Text>
              <Text style={styles.creditCardSubtext}>
                {`Recommended range: ${workloadAnalysis.recommendedRange.minUnits} – ${workloadAnalysis.recommendedRange.maxUnits} units`}
              </Text>
            </View>
          </View>

          {/* Factors Considered Section */}
          <View style={styles.factorsSection}>
            <Text style={styles.factorsHeading}>Factors Considered</Text>

            <View style={styles.factorRow}>
              <View style={styles.factorIconWrap} aria-hidden>
                <View style={styles.signalBarsRow}>
                  <View style={[styles.signalBar, { height: 5 }]} />
                  <View style={[styles.signalBar, { height: 8 }]} />
                  <View style={[styles.signalBar, { height: 11 }]} />
                  <View style={[styles.signalBar, { height: 15 }]} />
                </View>
              </View>
              <Text style={styles.factorLabel}>Your confidence ratings</Text>
            </View>

            <View style={styles.factorRow}>
              <View style={styles.factorIconWrap} aria-hidden>
                <View style={styles.targetOuterRing}>
                  <View style={styles.targetInnerDot} />
                </View>
              </View>
              <Text style={styles.factorLabel}>Course difficulty levels</Text>
            </View>

            <View style={styles.factorRow}>
              <View style={styles.factorIconWrap} aria-hidden>
                <View style={styles.branchIconContainer}>
                  <View style={styles.branchNodeTop} />
                  <View style={styles.branchConnector} />
                  <View style={styles.branchNodeBottom} />
                </View>
              </View>
              <Text style={styles.factorLabel}>Prerequisite availability</Text>
            </View>
          </View>

          {/* Expandable Mamdani Fuzzy Inference Engine Breakdown (SystemArchitecture.pdf Sec 3.2) */}
          <View
            style={styles.mamdaniCard}
            testID="mamdani-fuzzy-breakdown-card">
            <Pressable
              accessibilityRole="button"
              testID="toggle-mamdani-breakdown-button"
              onPress={() => setShowFuzzyDetails((prev) => !prev)}
              style={styles.mamdaniToggleHeader}>
              <View style={styles.mamdaniTitleCol}>
                <Text style={styles.mamdaniEyebrow}>
                  MAMDANI FUZZY INFERENCE ENGINE
                </Text>
                <Text style={styles.mamdaniTitle}>
                  How your stress & credit limit were calculated
                </Text>
              </View>
              <Text style={styles.mamdaniChevron}>
                {showFuzzyDetails ? '▲' : '▼'}
              </Text>
            </Pressable>

            {showFuzzyDetails && (
              <View
                style={styles.mamdaniBody}
                testID="mamdani-fuzzy-details-panel">
                <View style={styles.mamdaniStageBlock}>
                  <Text style={styles.mamdaniStageTitle}>
                    1. Fuzzification (Inputs → Linguistic Sets)
                  </Text>
                  <Text style={styles.mamdaniStageText}>
                    {`• Effective Confidence: ${workloadAnalysis.effectiveConfidence} / 10 (Low: ${workloadAnalysis.confidenceMemberships.LOW}, Med: ${workloadAnalysis.confidenceMemberships.MEDIUM}, High: ${workloadAnalysis.confidenceMemberships.HIGH})`}
                  </Text>
                  <Text style={styles.mamdaniStageText}>
                    {`• Effective Course Difficulty: ${workloadAnalysis.effectiveDifficulty} / 10 (Easy: ${workloadAnalysis.difficultyMemberships.EASY}, Mod: ${workloadAnalysis.difficultyMemberships.MODERATE}, Hard: ${workloadAnalysis.difficultyMemberships.HARD})`}
                  </Text>
                </View>

                <View style={styles.mamdaniStageBlock}>
                  <Text style={styles.mamdaniStageTitle}>
                    2. IF–THEN Rule Evaluation
                  </Text>
                  {MAMDANI_FUZZY_RULES.slice(0, 2).map((rule) => (
                    <Text key={rule.id} style={styles.mamdaniRuleText}>
                      {`• [${rule.id}] ${rule.description}`}
                    </Text>
                  ))}
                  {workloadAnalysis.firedRules.map((fired) => (
                    <Text
                      key={`fired-${fired.rule.id}`}
                      style={styles.mamdaniActiveRuleText}>
                      {`✓ Active Rule ${fired.rule.id} (strength ${fired.firingStrength}): ${fired.rule.description}`}
                    </Text>
                  ))}
                </View>

                <View style={styles.mamdaniStageBlock}>
                  <Text style={styles.mamdaniStageTitle}>
                    3. Centroid Defuzzification (Output)
                  </Text>
                  <Text style={styles.mamdaniStageText}>
                    {`• Aggregated Centroid Stress Score: ${workloadAnalysis.stressScore}% (${workloadAnalysis.stressLabel}) → Recommended Load: ${workloadAnalysis.recommendedUnits} units`}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <StickyContinueCard
          caption={'This load balances your confidence and course\ndifficulty.'}
          buttonLabel="Continue"
          testID="workload-analysis-continue"
          onPress={handleContinue}
        />
      </Animated.View>
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
    paddingTop: 12,
    paddingBottom: 20,
    gap: 22,
  },
  creditLimitCard: {
    backgroundColor: '#EFF3F1',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  creditIconBox: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docOutline: {
    width: 19,
    height: 21,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: BrandTheme.primaryGreen,
    paddingHorizontal: 3,
    paddingVertical: 3,
    justifyContent: 'space-around',
  },
  docLineShort: {
    width: 6,
    height: 2,
    backgroundColor: BrandTheme.primaryGreen,
    borderRadius: 1,
  },
  docLineLong: {
    width: 9,
    height: 2,
    backgroundColor: BrandTheme.primaryGreen,
    borderRadius: 1,
  },
  creditTextColumn: {
    flex: 1,
    gap: 3,
  },
  creditCardLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: BrandTheme.textSecondary,
  },
  creditCardValue: {
    fontSize: 28,
    fontWeight: '900',
    color: BrandTheme.primaryGreen,
    letterSpacing: -0.5,
  },
  creditCardSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: BrandTheme.textSecondary,
  },
  factorsSection: {
    paddingHorizontal: 4,
    gap: 14,
  },
  factorsHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
    marginBottom: 2,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  factorIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.5,
  },
  signalBar: {
    width: 2.5,
    backgroundColor: '#66756D',
    borderRadius: 1.5,
  },
  targetOuterRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#66756D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#66756D',
  },
  branchIconContainer: {
    width: 18,
    height: 18,
    justifyContent: 'space-between',
  },
  branchNodeTop: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.8,
    borderColor: '#66756D',
    alignSelf: 'flex-start',
  },
  branchConnector: {
    width: 10,
    height: 6,
    borderLeftWidth: 1.8,
    borderBottomWidth: 1.8,
    borderColor: '#66756D',
    marginLeft: 2,
  },
  branchNodeBottom: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.8,
    borderColor: '#66756D',
    alignSelf: 'flex-end',
  },
  factorLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#4F5E56',
  },
  trafficLightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  trafficPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F4F7F5',
    borderWidth: 1,
    borderColor: '#E1EAE4',
  },
  trafficPillGreenActive: {
    backgroundColor: '#E1F3E7',
    borderColor: BrandTheme.primaryGreen,
  },
  trafficPillAmberActive: {
    backgroundColor: '#FBF0D9',
    borderColor: '#D9822B',
  },
  trafficPillRedActive: {
    backgroundColor: '#FCE8E6',
    borderColor: '#C94438',
  },
  dotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: BrandTheme.primaryGreen,
  },
  dotAmber: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D9822B',
  },
  dotRed: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#C94438',
  },
  trafficPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6E7D75',
  },
  trafficTextGreenActive: {
    color: BrandTheme.primaryGreen,
    fontWeight: '800',
  },
  trafficTextAmberActive: {
    color: '#A9620E',
    fontWeight: '800',
  },
  trafficTextRedActive: {
    color: '#A82E23',
    fontWeight: '800',
  },
  mamdaniCard: {
    backgroundColor: '#F3FAF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D6EBE0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  mamdaniToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mamdaniTitleCol: {
    flex: 1,
    gap: 3,
    paddingRight: 10,
  },
  mamdaniEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: BrandTheme.primaryGreen,
  },
  mamdaniTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
  },
  mamdaniChevron: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandTheme.primaryGreen,
  },
  mamdaniBody: {
    borderTopWidth: 1,
    borderTopColor: '#D6EBE0',
    paddingTop: 10,
    gap: 10,
  },
  mamdaniStageBlock: {
    gap: 3,
  },
  mamdaniStageTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
  },
  mamdaniStageText: {
    fontSize: 11,
    lineHeight: 15.5,
    color: '#3B5245',
    fontWeight: '500',
  },
  mamdaniRuleText: {
    fontSize: 10.5,
    lineHeight: 15,
    color: '#51665A',
    fontWeight: '500',
  },
  mamdaniActiveRuleText: {
    fontSize: 11,
    lineHeight: 15.5,
    color: BrandTheme.primaryGreen,
    fontWeight: '700',
  },
});
