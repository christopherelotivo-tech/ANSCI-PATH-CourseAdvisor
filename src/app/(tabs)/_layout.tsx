import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandTheme } from '@/constants/theme';

type TabKind = 'plan' | 'courses' | 'graph' | 'settings';

function TabGlyph({ kind, color }: { kind: TabKind; color: string }) {
  if (kind === 'plan' || kind === 'courses') {
    return (
      <View style={[styles.docIcon, { borderColor: color }]}>
        <View style={[styles.docLineShort, { backgroundColor: color }]} />
        <View style={[styles.docLineLong, { backgroundColor: color }]} />
        <View style={[styles.docLineLong, { backgroundColor: color }]} />
      </View>
    );
  }

  if (kind === 'graph') {
    return (
      <View style={styles.graphIconBox}>
        <View style={[styles.graphDotTop, { borderColor: color }]} />
        <View style={[styles.graphStem, { borderColor: color }]} />
        <View style={[styles.graphDotBottom, { borderColor: color }]} />
      </View>
    );
  }

  return (
    <View style={[styles.gearOuter, { borderColor: color }]}>
      <View style={[styles.gearInner, { borderColor: color }]} />
    </View>
  );
}

function CustomTabButtonContent({
  kind,
  label,
  focused,
}: {
  kind: TabKind;
  label: string;
  focused: boolean;
}) {
  const color = focused ? BrandTheme.primaryGreen : '#79857E';

  return (
    <View style={[styles.tabPill, focused && styles.tabPillActive]}>
      <TabGlyph kind={kind} color={color} />
      <Text
        style={[styles.tabLabel, focused && styles.tabLabelActive]}
        numberOfLines={1}
        ellipsizeMode="clip"
        allowFontScaling={false}>
        {label}
      </Text>
    </View>
  );
}

export default function MainTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 56 + bottomInset,
            paddingBottom: bottomInset,
          },
        ],
      }}>
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarButtonTestID: 'tab-button-plan',
          tabBarIcon: ({ focused }) => (
            <CustomTabButtonContent kind="plan" label="Plan" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarButtonTestID: 'tab-button-courses',
          tabBarIcon: ({ focused }) => (
            <CustomTabButtonContent
              kind="courses"
              label="Courses"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="graph"
        options={{
          title: 'Graph',
          tabBarButtonTestID: 'tab-button-graph',
          tabBarIcon: ({ focused }) => (
            <CustomTabButtonContent kind="graph" label="Graph" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarButtonTestID: 'tab-button-settings',
          tabBarIcon: ({ focused }) => (
            <CustomTabButtonContent
              kind="settings"
              label="Settings"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5ECE7',
    paddingTop: 6,
    elevation: 8,
  },
  tabPill: {
    minWidth: 62,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabPillActive: {
    backgroundColor: '#E2F2E8',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#79857E',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: BrandTheme.primaryGreen,
  },
  docIcon: {
    width: 16,
    height: 18,
    borderRadius: 3.5,
    borderWidth: 1.8,
    paddingHorizontal: 2.5,
    paddingVertical: 2.5,
    justifyContent: 'space-around',
  },
  docLineShort: {
    width: 5,
    height: 1.6,
    borderRadius: 1,
  },
  docLineLong: {
    width: 8,
    height: 1.6,
    borderRadius: 1,
  },
  graphIconBox: {
    width: 18,
    height: 18,
    justifyContent: 'space-between',
  },
  graphDotTop: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    borderWidth: 1.6,
    alignSelf: 'flex-start',
  },
  graphStem: {
    width: 9,
    height: 6,
    borderLeftWidth: 1.6,
    borderBottomWidth: 1.6,
    marginLeft: 2,
  },
  graphDotBottom: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    borderWidth: 1.6,
    alignSelf: 'flex-end',
  },
  gearOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.6,
  },
});

