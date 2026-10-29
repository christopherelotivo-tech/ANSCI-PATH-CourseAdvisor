import { useRouter } from "expo-router";
import { useState } from "react";
import {
    type GestureResponderEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { StickyContinueCard } from "@/components/onboarding/sticky-continue-card";
import { BrandTheme, MaxContentWidth } from "@/constants/theme";
import { SUBJECT_AREAS, type SubjectArea } from "@/db/repository";
import { usePlanner } from "@/state/planner-context";

const RATING_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

interface DraggableSliderProps {
  area: SubjectArea;
  currentScore: number;
  onRatingChange: (score: number) => void;
}

function DraggableSlider({
  area,
  currentScore,
  onRatingChange,
}: DraggableSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const calculateScoreFromX = (locationX: number) => {
    if (trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    const score = Math.max(1, Math.min(10, Math.round(1 + ratio * 9)));
    onRatingChange(score);
  };

  const handleResponderGrant = (e: GestureResponderEvent) => {
    calculateScoreFromX(e.nativeEvent.locationX);
  };

  const handleResponderMove = (e: GestureResponderEvent) => {
    calculateScoreFromX(e.nativeEvent.locationX);
  };

  const fillPercent = ((currentScore - 1) / 9) * 100;

  return (
    <View
      style={styles.trackContainer}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleResponderGrant}
      onResponderMove={handleResponderMove}
    >
      <View style={styles.trackBackground} />
      <View style={[styles.trackActiveFill, { width: `${fillPercent}%` }]} />
      <View
        pointerEvents="none"
        style={[styles.thumbCircle, { left: `${fillPercent}%` }]}
      />
      <View style={styles.stepsOverlay} pointerEvents="box-none">
        {RATING_STEPS.map((stepScore) => (
          <Pressable
            key={stepScore}
            accessibilityRole="adjustable"
            accessibilityLabel={`${area} confidence ${stepScore} of 10`}
            testID={`confidence-step-${area}-${stepScore}`}
            onPress={() => onRatingChange(stepScore)}
            style={styles.stepTouchZone}
          />
        ))}
      </View>
    </View>
  );
}

export default function ConfidenceRatingScreen() {
  const router = useRouter();
  const { confidenceRatings, setSubjectConfidence, persistConfidenceRatings } =
    usePlanner();

  const handleContinue = async () => {
    await persistConfidenceRatings();
    router.push("/onboarding/analyzing");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.mainColumn}>
        <OnboardingHeader
          stepText="STEP 2 OF 3"
          sectionText="YOUR CONFIDENCE"
          progressPercent={68}
          title="Rate Your Confidence"
          subtitle={
            "How confident are you in these subject areas?\n(1 = Very Low, 10 = Very High)"
          }
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SUBJECT_AREAS.map((area: SubjectArea) => {
            const currentScore = confidenceRatings[area] ?? 5;

            return (
              <View key={area} style={styles.sliderSection}>
                <Text style={styles.subjectLabel}>{area}</Text>

                <View style={styles.sliderRow}>
                  <DraggableSlider
                    area={area}
                    currentScore={currentScore}
                    onRatingChange={(score) =>
                      setSubjectConfidence(area, score)
                    }
                  />

                  {/* Numeric value badge on the right */}
                  <View
                    style={styles.valueBadge}
                    testID={`confidence-value-${area}`}
                  >
                    <Text style={styles.valueBadgeText}>{currentScore}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Lightbulb Tip Banner */}
          <View style={styles.tipBanner}>
            <View style={styles.bulbIconWrapper} aria-hidden>
              <View style={styles.bulbGlobe} />
              <View style={styles.bulbBase} />
            </View>
            <Text style={styles.tipText}>
              {
                "Be honest with your answers.\nYour confidence helps us recommend\na workload that fits your strengths."
              }
            </Text>
          </View>
        </ScrollView>

        <StickyContinueCard
          caption="Be honest, it shapes your workload."
          testID="confidence-rating-continue"
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  mainColumn: {
    flex: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    backgroundColor: "#FFFFFF",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    gap: 22,
  },
  sliderSection: {
    gap: 10,
  },
  subjectLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: BrandTheme.textPrimary,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  trackContainer: {
    flex: 1,
    height: 38,
    justifyContent: "center",
    position: "relative",
  },
  trackBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E4EAE6",
    width: "100%",
  },
  trackActiveFill: {
    position: "absolute",
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#137A4B",
  },
  thumbCircle: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#137A4B",
    marginLeft: -11,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#0A2916",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  stepsOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
  },
  stepTouchZone: {
    flex: 1,
    height: "100%",
  },
  valueBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F4F3",
    alignItems: "center",
    justifyContent: "center",
  },
  valueBadgeText: {
    fontSize: 14.5,
    fontWeight: "800",
    color: BrandTheme.textPrimary,
  },
  tipBanner: {
    backgroundColor: "#E2F4E7",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 6,
  },
  bulbIconWrapper: {
    width: 22,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bulbGlobe: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.8,
    borderColor: BrandTheme.primaryGreen,
  },
  bulbBase: {
    width: 8,
    height: 4,
    borderTopWidth: 1.6,
    borderBottomWidth: 1.6,
    borderColor: BrandTheme.primaryGreen,
    marginTop: 1,
  },
  tipText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#2F5B41",
  },
});
