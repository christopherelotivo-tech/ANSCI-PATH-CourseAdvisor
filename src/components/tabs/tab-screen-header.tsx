import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandTheme } from '@/constants/theme';

export interface TabScreenHeaderProps {
  eyebrow?: string;
  title: string;
  fullName: string;
}

export function getInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return 'JD';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Shared top header for the 4 main application tabs (`12_Your_Plan_Roadmap.png` .. `15_Settings.png`).
 * Displays the optional uppercase eyebrow, bold screen title, and coral student initials avatar.
 */
export function TabScreenHeader({ eyebrow, title, fullName }: TabScreenHeaderProps) {
  const initials = getInitials(fullName);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleColumn}>
        {eyebrow ? <Text style={styles.eyebrowText}>{eyebrow}</Text> : null}
        <Text style={styles.titleText}>{title}</Text>
      </View>

      <View style={styles.avatarCircle} testID="header-student-avatar">
        <Text style={styles.avatarInitials} allowFontScaling={false}>
          {initials}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 14,
  },
  titleColumn: {
    flex: 1,
    gap: 4,
  },
  eyebrowText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#4F6358',
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
    letterSpacing: -0.5,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DF7E58',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
