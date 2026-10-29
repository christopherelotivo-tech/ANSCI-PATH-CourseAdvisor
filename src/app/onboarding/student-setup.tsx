import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding/onboarding-header';
import { StickyContinueCard } from '@/components/onboarding/sticky-continue-card';
import { BrandTheme, MaxContentWidth } from '@/constants/theme';
import type { Term, YearLevel } from '@/domain/curriculum/types';
import { usePlanner } from '@/state/planner-context';

const YEAR_OPTIONS: { value: YearLevel; label: string }[] = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
];

const SEMESTER_OPTIONS: { value: Term; label: string }[] = [
  { value: 'FIRST', label: '1st Semester' },
  { value: 'SECOND', label: '2nd Semester' },
  { value: 'SUMMER', label: 'Summer Term' },
];

/**
 * Screen 02 — Student Setup (`02_Student_Setup.png`)
 *
 * Collects Full Name, Student ID, Current Year Level, and Current Semester,
 * persists locally via Expo SQLite, and advances to Academic Goal.
 */
export default function StudentSetupScreen() {
  const router = useRouter();
  const { profile, updateStudentSetup } = usePlanner();

  const [fullNameOverride, setFullName] = useState<string | null>(null);
  const [studentIdOverride, setStudentId] = useState<string | null>(null);
  const [yearLevelOverride, setYearLevel] = useState<YearLevel | null>(null);
  const [semesterOverride, setSemester] = useState<Term | null>(null);
  const [openDropdown, setOpenDropdown] = useState<'year' | 'semester' | null>(null);

  const fullName = fullNameOverride ?? profile.fullName;
  const studentId = studentIdOverride ?? profile.studentId;
  const yearLevel = yearLevelOverride ?? profile.currentYearLevel;
  const semester = semesterOverride ?? profile.currentSemester;

  const selectedYearLabel =
    YEAR_OPTIONS.find((opt) => opt.value === yearLevel)?.label ?? '2nd Year';
  const selectedSemesterLabel =
    SEMESTER_OPTIONS.find((opt) => opt.value === semester)?.label ?? '1st Semester';

  const handleContinue = async () => {
    await updateStudentSetup({
      fullName,
      studentId,
      currentYearLevel: yearLevel,
      currentSemester: semester,
    });
    router.push('/onboarding/academic-goal');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.mainColumn}>
          <OnboardingHeader
            showLogos
            stepText="STEP 1 OF 3"
            sectionText="YOUR PROFILE"
            progressPercent={33}
            title="Student Setup"
            subtitle="Let’s get to know you."
          />

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={styles.inputBox}>
                <View style={styles.fieldIconBox} aria-hidden>
                  <View style={styles.userHeadIcon} />
                  <View style={styles.userShouldersIcon} />
                </View>
                <TextInput
                  testID="input-full-name"
                  accessibilityLabel="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Juan Dela Cruz"
                  placeholderTextColor="#8B9890"
                  style={styles.textInput}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Student ID */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Student ID</Text>
              <View style={styles.inputBox}>
                <View style={styles.idBadgeIcon} aria-hidden>
                  <Text style={styles.idBadgeIconText} allowFontScaling={false}>
                    🪪
                  </Text>
                </View>
                <TextInput
                  testID="input-student-id"
                  accessibilityLabel="Student ID"
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholder="2025-0001"
                  placeholderTextColor="#8B9890"
                  style={styles.textInput}
                  autoCapitalize="characters"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Current Year Level */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Current Year Level</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Current Year Level: ${selectedYearLabel}`}
                testID="select-year-level"
                onPress={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
                style={styles.selectorBox}>
                <View style={styles.selectorLeft}>
                  <View style={styles.docOutlineIcon} aria-hidden>
                    <View style={styles.docLine} />
                    <View style={styles.docLine} />
                    <View style={styles.docLineShort} />
                  </View>
                  <Text style={styles.selectorValueText}>{selectedYearLabel}</Text>
                </View>
                <Text style={styles.chevronRight} allowFontScaling={false}>
                  {openDropdown === 'year' ? '⌄' : '›'}
                </Text>
              </Pressable>

              {openDropdown === 'year' && (
                <View style={styles.optionsCard}>
                  {YEAR_OPTIONS.map((option) => {
                    const selected = option.value === yearLevel;
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        testID={`year-option-${option.value}`}
                        onPress={() => {
                          setYearLevel(option.value);
                          setOpenDropdown(null);
                        }}
                        style={[styles.optionRow, selected && styles.optionRowSelected]}>
                        <Text
                          style={[
                            styles.optionRowText,
                            selected && styles.optionRowTextSelected,
                          ]}>
                          {option.label}
                        </Text>
                        {selected && <Text style={styles.optionCheck}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Current Semester */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Current Semester</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Current Semester: ${selectedSemesterLabel}`}
                testID="select-semester"
                onPress={() =>
                  setOpenDropdown(openDropdown === 'semester' ? null : 'semester')
                }
                style={styles.selectorBox}>
                <View style={styles.selectorLeft}>
                  <View style={styles.calendarOutlineIcon} aria-hidden>
                    <View style={styles.calendarTopBar} />
                  </View>
                  <Text style={styles.selectorValueText}>{selectedSemesterLabel}</Text>
                </View>
                <Text style={styles.chevronRight} allowFontScaling={false}>
                  {openDropdown === 'semester' ? '⌄' : '›'}
                </Text>
              </Pressable>

              {openDropdown === 'semester' && (
                <View style={styles.optionsCard}>
                  {SEMESTER_OPTIONS.map((option) => {
                    const selected = option.value === semester;
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        testID={`semester-option-${option.value}`}
                        onPress={() => {
                          setSemester(option.value);
                          setOpenDropdown(null);
                        }}
                        style={[styles.optionRow, selected && styles.optionRowSelected]}>
                        <Text
                          style={[
                            styles.optionRowText,
                            selected && styles.optionRowTextSelected,
                          ]}>
                          {option.label}
                        </Text>
                        {selected && <Text style={styles.optionCheck}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          <StickyContinueCard
            caption="Everything is saved only on this device."
            testID="student-setup-continue"
            onPress={handleContinue}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  keyboardWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  mainColumn: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BrandTheme.textPrimary,
    letterSpacing: -0.1,
  },
  inputBox: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F8F9F8',
    borderWidth: 1,
    borderColor: '#E3E8E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: BrandTheme.textPrimary,
    paddingVertical: 10,
  },
  selectorBox: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F8F9F8',
    borderWidth: 1,
    borderColor: '#E3E8E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorValueText: {
    fontSize: 15,
    fontWeight: '500',
    color: BrandTheme.textPrimary,
  },
  chevronRight: {
    fontSize: 22,
    color: '#6C7A71',
    lineHeight: 24,
  },
  fieldIconBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  userHeadIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.6,
    borderColor: '#6C7A71',
    marginBottom: 1.5,
  },
  userShouldersIcon: {
    width: 14,
    height: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1.6,
    borderBottomWidth: 0,
    borderColor: '#6C7A71',
  },
  idBadgeIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  idBadgeIconText: {
    fontSize: 14,
    opacity: 0.7,
  },
  docOutlineIcon: {
    width: 16,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#6C7A71',
    paddingHorizontal: 2.5,
    paddingVertical: 3,
    justifyContent: 'space-between',
    marginRight: 13,
  },
  docLine: {
    height: 1.4,
    backgroundColor: '#6C7A71',
    width: '100%',
  },
  docLineShort: {
    height: 1.4,
    backgroundColor: '#6C7A71',
    width: '65%',
  },
  calendarOutlineIcon: {
    width: 17,
    height: 17,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#6C7A71',
    marginRight: 12,
    overflow: 'hidden',
  },
  calendarTopBar: {
    height: 4,
    borderBottomWidth: 1.3,
    borderBottomColor: '#6C7A71',
  },
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE6DF',
    overflow: 'hidden',
    marginTop: 2,
  },
  optionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F1',
  },
  optionRowSelected: {
    backgroundColor: '#EAF6EE',
  },
  optionRowText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: BrandTheme.textPrimary,
  },
  optionRowTextSelected: {
    fontWeight: '700',
    color: BrandTheme.primaryGreen,
  },
  optionCheck: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandTheme.primaryGreen,
  },
});
