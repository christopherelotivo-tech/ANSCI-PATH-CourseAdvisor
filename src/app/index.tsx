import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnSciPathBadge } from '@/components/anscipath-badge';
import { BrandTheme, MaxContentWidth } from '@/constants/theme';

const FARM_BACKGROUND = require('@/assets/images/backgrounds/farm-background.png');

/**
 * Screen 01 — Welcome / Get Started (`01_Welcome_Get_Started.png`)
 *
 * Displays the full-bleed agricultural pasture illustration, the centered
 * AnSciPath circular degree-planning medallion, and the bottom companion card
 * with the "Get Started ->" CTA leading into Student Setup.
 */
export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/onboarding/student-setup');
  };

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

      {/* Deep pasture-green ground anchor at the very bottom matching screenshot */}
      <View style={styles.bottomGroundTint} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.contentColumn}>
          {/* Upper-middle medallion placement matching 01_Welcome_Get_Started.png */}
          <View style={styles.medallionArea}>
            <AnSciPathBadge />
          </View>

          {/* Bottom floating CTA card */}
          <View style={styles.bottomCard}>
            <Text style={styles.companionText}>
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
              ]}>
              <Text style={styles.getStartedLabel}>Get Started</Text>
              <Text style={styles.getStartedArrow} aria-hidden>
                →
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#274C2D',
  },
  bottomGroundTint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '18%',
    backgroundColor: 'rgba(39, 76, 45, 0.55)',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  contentColumn: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  medallionArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 56,
  },
  bottomCard: {
    width: '100%',
    backgroundColor: 'rgba(229, 236, 230, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 28,
    shadowColor: '#0A2412',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  companionText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#465B4E',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.1,
  },
  getStartedButton: {
    backgroundColor: BrandTheme.welcomeButtonGreen,
    height: 54,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  getStartedButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  getStartedLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  getStartedArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});
