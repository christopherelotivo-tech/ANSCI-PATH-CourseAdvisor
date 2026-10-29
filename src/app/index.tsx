import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnSciPathBadge } from "@/components/anscipath-badge";
import { BrandTheme, MaxContentWidth } from "@/constants/theme";

const FARM_BACKGROUND = require("@/assets/images/backgrounds/farm-background.png");

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const handleGetStarted = () => {
    router.push("/onboarding/student-setup");
  };

  const isLandscape = width > height;

  const badgeScale = useMemo(() => {
    if (isLandscape) {
      return Math.min(0.85, Math.max(0.65, height / 520));
    }
    if (height < 600) return 0.78;
    if (height < 680) return 0.88;
    if (height < 760) return 0.95;
    return 1;
  }, [height, isLandscape]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Image
        source={FARM_BACKGROUND}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
        transition={150}
        accessibilityIgnoresInvertColors
      />

      <View style={styles.bottomGroundTint} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.contentColumn}>
          <View style={styles.medallionArea}>
            <AnSciPathBadge scale={badgeScale} />
          </View>

          <View style={styles.bottomCardWrapper}>
            <View style={styles.bottomCard}>
              <Text style={styles.companionText} maxFontSizeMultiplier={1.3}>
                Your personalized academic planning companion.
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Get Started"
                testID="welcome-get-started-button"
                onPress={handleGetStarted}
                style={({ pressed }) => [
                  styles.getStartedButton,
                  pressed && styles.getStartedButtonPressed,
                ]}
              >
                <Text
                  style={styles.getStartedLabel}
                  maxFontSizeMultiplier={1.3}
                >
                  Get Started
                </Text>
                <Text
                  style={styles.getStartedArrow}
                  aria-hidden={true}
                  accessibilityElementsHidden={true}
                >
                  →
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#274C2D",
  },
  bottomGroundTint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "18%",
    backgroundColor: "rgba(39, 76, 45, 0.55)",
  },
  safeArea: {
    flex: 1,
  },
  contentColumn: {
    flex: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },
  medallionArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  bottomCardWrapper: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 16,
  },
  bottomCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "rgba(229, 236, 230, 0.95)",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: "#0A2412",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  companionText: {
    fontSize: 13.5,
    fontWeight: "500",
    color: "#465B4E",
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: -0.1,
  },
  getStartedButton: {
    backgroundColor: BrandTheme.welcomeButtonGreen,
    height: 54,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  getStartedButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  getStartedLabel: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  getStartedArrow: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
});
