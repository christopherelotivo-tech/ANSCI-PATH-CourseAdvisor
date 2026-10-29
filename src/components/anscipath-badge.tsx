import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandTheme } from '@/constants/theme';

/**
 * Renders the circular "AnSciPath — PLAN YOUR ANIMAL SCIENCE DEGREE" medallion
 * from `01_Welcome_Get_Started.png`.
 *
 * Uses native vector shapes matching the 4-pin agricultural crest, dashed inner
 * ring, and dual-tone wordmark so it renders crisply on all Android screen densities
 * without requiring an external bitmap export.
 */
export function AnSciPathBadge() {
  return (
    <View style={styles.outerMedallion} accessibilityRole="header">
      <View style={styles.dashedRing}>
        {/* Four-pin crest mark */}
        <View style={styles.crestContainer} aria-hidden>
          <View style={styles.pinsRow}>
            {/* Pin 1: Green */}
            <View style={[styles.pinWrapper, styles.pinLeftOuter]}>
              <View style={[styles.pinHead, { backgroundColor: BrandTheme.crestPinGreen }]} />
              <View style={styles.pinStem} />
            </View>
            {/* Pin 2: Gold-Yellow */}
            <View style={[styles.pinWrapper, styles.pinLeftInner]}>
              <View style={[styles.pinHead, { backgroundColor: BrandTheme.crestPinYellow }]} />
              <View style={styles.pinStem} />
            </View>
            {/* Pin 3: Orange */}
            <View style={[styles.pinWrapper, styles.pinRightInner]}>
              <View style={[styles.pinHead, { backgroundColor: BrandTheme.crestPinOrange }]} />
              <View style={styles.pinStem} />
            </View>
            {/* Pin 4: Red */}
            <View style={[styles.pinWrapper, styles.pinRightOuter]}>
              <View style={[styles.pinHead, { backgroundColor: BrandTheme.crestPinRed }]} />
              <View style={styles.pinStem} />
            </View>
          </View>

          {/* Dark-green pouch/hill base with white wave */}
          <View style={styles.crestBase}>
            <Text style={styles.crestWave} allowFontScaling={false}>
              ∽
            </Text>
          </View>
        </View>

        {/* Dual-tone brand title */}
        <Text style={styles.brandWordmark} allowFontScaling={false}>
          <Text style={styles.brandAnSci}>AnSci</Text>
          <Text style={styles.brandPath}>Path</Text>
        </Text>

        {/* Tagline */}
        <Text style={styles.tagline} allowFontScaling={false}>
          {'PLAN YOUR ANIMAL SCIENCE\nDEGREE'}
        </Text>
      </View>
    </View>
  );
}

const MEDALLION_SIZE = 248;
const RING_SIZE = 214;

const styles = StyleSheet.create({
  outerMedallion: {
    width: MEDALLION_SIZE,
    height: MEDALLION_SIZE,
    borderRadius: MEDALLION_SIZE / 2,
    backgroundColor: '#F9FEF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A2916',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  dashedRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BrandTheme.medallionDashedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  crestContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10,
    height: 54,
  },
  pinsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: -4,
    zIndex: 1,
  },
  pinWrapper: {
    alignItems: 'center',
    marginHorizontal: 1.5,
  },
  pinLeftOuter: {
    transform: [{ rotate: '-22deg' }, { translateY: 3 }],
  },
  pinLeftInner: {
    transform: [{ rotate: '-7deg' }],
  },
  pinRightInner: {
    transform: [{ rotate: '7deg' }],
  },
  pinRightOuter: {
    transform: [{ rotate: '22deg' }, { translateY: 3 }],
  },
  pinHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pinStem: {
    width: 2.2,
    height: 11,
    backgroundColor: '#1B5F3A',
    marginTop: -1,
  },
  crestBase: {
    width: 44,
    height: 25,
    borderRadius: 12,
    backgroundColor: '#1B5F3A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  crestWave: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: -2,
  },
  brandWordmark: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 6,
  },
  brandAnSci: {
    color: BrandTheme.accentLeafGreen,
  },
  brandPath: {
    color: BrandTheme.textPrimary,
  },
  tagline: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.15,
    lineHeight: 13.5,
    color: '#2A4233',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

