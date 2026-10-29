import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { BrandTheme } from '@/constants/theme';
import type { StressLevelLabel } from '@/domain/algorithms/fuzzy-workload';

export interface StressGaugeProps {
  stressScore: number;
  stressLabel: StressLevelLabel;
}

function getStressVisuals(stressLabel: StressLevelLabel) {
  switch (stressLabel) {
    case 'Low':
      return {
        arcColor: BrandTheme.primaryGreen,
        pillBg: '#E6F5EC',
        pillText: BrandTheme.primaryGreen,
      };
    case 'Moderate':
      return {
        arcColor: '#F39828',
        pillBg: '#FDF3E3',
        pillText: '#D67A12',
      };
    case 'High':
    case 'Very High':
      return {
        arcColor: '#DF5A48',
        pillBg: '#FDECE9',
        pillText: '#C53B2A',
      };
  }
}

export function StressGauge({ stressScore, stressLabel }: StressGaugeProps) {
  const isTest = Boolean(process.env.JEST_WORKER_ID);
  const clamped = Math.max(0, Math.min(100, Math.round(stressScore)));
  const visuals = getStressVisuals(stressLabel);

  const [animValue] = useState(() => new Animated.Value(isTest ? clamped : 0));
  const [displayedPercent, setDisplayedPercent] = useState<number>(() =>
    isTest ? clamped : 0
  );

  useEffect(() => {
    if (isTest) return;

    const listenerId = animValue.addListener(({ value }) => {
      setDisplayedPercent(Math.round(value));
    });

    Animated.timing(animValue, {
      toValue: clamped,
      duration: 1350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animValue.removeListener(listenerId);
    };
  }, [clamped, animValue, isTest]);

  // Interpolate rotation: 0% -> -45deg, 100% -> 135deg
  const rotation = useMemo(
    () =>
      animValue.interpolate({
        inputRange: [0, 100],
        outputRange: ['-45deg', '135deg'],
      }),
    [animValue]
  );

  return (
    <View style={styles.container} testID="workload-stress-gauge">
      <View style={styles.arcViewport}>
        {/* Track semicircle */}
        <View style={styles.trackCircle} />

        {/* Animated active progress semicircle */}
        <Animated.View
          style={[
            styles.activeCircle,
            {
              borderBottomColor: visuals.arcColor,
              borderLeftColor: visuals.arcColor,
              transform: [{ rotate: rotation }],
            },
          ]}
        />
      </View>

      {/* Center overlay readout */}
      <View style={styles.centerReadout}>
        <Text
          style={styles.percentageText}
          testID="workload-stress-percentage"
          allowFontScaling={false}>
          {`${displayedPercent}%`}
        </Text>
        <Text style={styles.captionText}>Semester Stress Level</Text>
        <View style={[styles.levelBadge, { backgroundColor: visuals.pillBg }]}>
          <Text
            style={[styles.levelBadgeText, { color: visuals.pillText }]}
            testID="workload-stress-label">
            {stressLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const GAUGE_DIAMETER = 236;
const GAUGE_STROKE = 26;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 152,
    marginTop: 8,
    marginBottom: 8,
  },
  arcViewport: {
    width: GAUGE_DIAMETER,
    height: GAUGE_DIAMETER / 2,
    overflow: 'hidden',
    position: 'absolute',
    top: 6,
    alignItems: 'center',
  },
  trackCircle: {
    width: GAUGE_DIAMETER,
    height: GAUGE_DIAMETER,
    borderRadius: GAUGE_DIAMETER / 2,
    borderWidth: GAUGE_STROKE,
    borderColor: '#ECEEED',
    position: 'absolute',
    top: 0,
  },
  activeCircle: {
    width: GAUGE_DIAMETER,
    height: GAUGE_DIAMETER,
    borderRadius: GAUGE_DIAMETER / 2,
    borderWidth: GAUGE_STROKE,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    top: 0,
  },
  centerReadout: {
    alignItems: 'center',
    paddingTop: 52,
  },
  percentageText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#112218',
    letterSpacing: -0.8,
  },
  captionText: {
    fontSize: 11,
    fontWeight: '500',
    color: BrandTheme.textSecondary,
    marginTop: 2,
  },
  levelBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
