import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandTheme } from '@/constants/theme';

export interface TabScreenHeaderProps {
  eyebrow?: string;
  title: string;
  fullName: string;
  onAvatarPress?: () => void;
}

export function getInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return 'AS';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function TabScreenHeader({
  eyebrow,
  title,
  fullName,
  onAvatarPress,
}: TabScreenHeaderProps) {
  const router = useRouter();
  const initials = getInitials(fullName);

  const handleAvatarPress = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      router.push('/(tabs)/settings');
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleColumn}>
        {eyebrow ? <Text style={styles.eyebrowText}>{eyebrow}</Text> : null}
        <Text style={styles.titleText}>{title}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Student Profile for ${fullName}`}
        testID="header-student-avatar"
        onPress={handleAvatarPress}
        hitSlop={12}
        style={({ pressed }) => [
          styles.avatarCircle,
          pressed && styles.avatarCirclePressed,
        ]}>
        <Text style={styles.avatarInitials} allowFontScaling={false}>
          {initials}
        </Text>
      </Pressable>
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
  avatarCirclePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  avatarInitials: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
