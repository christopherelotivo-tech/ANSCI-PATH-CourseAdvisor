import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { getDatabase } from '@/db/database';
import { PlannerProvider } from '@/state/planner-context';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if splash screen was already hidden in test environments
});

export default function RootLayout() {
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        if (Platform.OS !== 'web') {
          await getDatabase();
        }
      } catch (error) {
        console.warn('[CourseAdvisor] SQLite bootstrap warning:', error);
      } finally {
        if (mounted) {
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <PlannerProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/student-setup" />
          <Stack.Screen name="onboarding/academic-goal" />
          <Stack.Screen name="onboarding/completed-courses" />
          <Stack.Screen name="onboarding/confidence-rating" />
          <Stack.Screen name="onboarding/analyzing" />
          <Stack.Screen name="onboarding/workload-analysis" />
          <Stack.Screen name="onboarding/recommended-schedule" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </PlannerProvider>
    </ThemeProvider>
  );
}
