import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandTheme } from '@/constants/theme';

const CELS_LOGO = require('@/assets/images/branding/cels-msun-logo.png');
const ASSS_LOGO = require('@/assets/images/branding/ansci-student-society-logo.png');

export interface OnboardingHeaderProps {
  stepText: string;
  sectionText: string;
  /** Progress bar fill percentage (0 to 100) */
  progressPercent: number;
  title: string;
  subtitle: string;
  /** Show the MSU-Naawan CELS and Animal Science Student Society seals */
  showLogos?: boolean;
  onBackPress?: () => void;
}

export function OnboardingHeader({
  stepText,
  sectionText,
  progressPercent,
  title,
  subtitle,
  showLogos = false,
  onBackPress,
}: OnboardingHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const clampedPercent = Math.min(100, Math.max(0, progressPercent));

  return (
    <View style={styles.headerBanner}>
      {showLogos && (
        <View style={styles.logosRow}>
          <View style={styles.logoBadge}>
            <Image
              source={CELS_LOGO}
              style={styles.logoImage}
              contentFit="contain"
              accessibilityLabel="College of Environment and Life Sciences Seal"
            />
          </View>
          <View style={styles.logoBadge}>
            <Image
              source={ASSS_LOGO}
              style={styles.logoImage}
              contentFit="contain"
              accessibilityLabel="Animal Science Student Society Seal"
            />
          </View>
        </View>
      )}

      <View style={styles.stepHeaderRow}>
        <Text style={styles.stepLabel}>{stepText}</Text>
        <Text style={styles.stepLabel}>{sectionText}</Text>
      </View>

      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${clampedPercent}%` }]} />
      </View>

      <View style={styles.titleRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="onboarding-back-button"
          onPress={handleBack}
          hitSlop={10}
          style={styles.backButton}>
          <Text style={styles.backChevron} allowFontScaling={false}>
            ‹
          </Text>
        </Pressable>
        <Text style={styles.screenTitle}>{title}</Text>
        <View style={styles.backButtonSpacer} />
      </View>

      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBanner: {
    backgroundColor: '#E8F5EC',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E1EFE5',
  },
  logosRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  logoBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F301B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  stepLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#4F6457',
    textTransform: 'uppercase',
  },
  progressBarTrack: {
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#D2E2D7',
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BrandTheme.primaryGreen,
    borderRadius: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 34,
    height: 34,
  },
  backChevron: {
    fontSize: 28,
    fontWeight: '400',
    color: BrandTheme.textPrimary,
    lineHeight: 30,
  },
  screenTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: BrandTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
});

