import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandTheme } from '@/constants/theme';

export interface StickyContinueCardProps {
  caption: string;
  buttonLabel?: string;
  testID?: string;
  disabled?: boolean;
  onPress: () => void;
}

/**
 * Floating bottom white card with helper caption and dark-green CTA button
 * matching all onboarding prototype screens (`02` through `11`).
 */
export function StickyContinueCard({
  caption,
  buttonLabel = 'Continue',
  testID = 'onboarding-continue-button',
  disabled = false,
  onPress,
}: StickyContinueCardProps) {
  return (
    <View style={styles.outerWrapper}>
      <View style={styles.card}>
        <Text style={styles.caption}>{caption}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
          accessibilityState={{ disabled }}
          testID={testID}
          disabled={disabled}
          onPress={onPress}
          style={({ pressed }) => [
            styles.button,
            disabled && styles.buttonDisabled,
            pressed && !disabled && styles.buttonPressed,
          ]}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
          <Text style={styles.buttonArrow} aria-hidden>
            →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF2EF',
    shadowColor: '#0D2918',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5C6D62',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: BrandTheme.primaryGreen,
    height: 52,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});

