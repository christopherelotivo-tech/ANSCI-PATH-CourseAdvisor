import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import AcademicGoalScreen from '@/app/onboarding/academic-goal';
import AnalyzingRequirementsScreen from '@/app/onboarding/analyzing';
import CompletedCoursesScreen from '@/app/onboarding/completed-courses';
import ConfidenceRatingScreen from '@/app/onboarding/confidence-rating';
import RecommendedScheduleScreen from '@/app/onboarding/recommended-schedule';
import StudentSetupScreen from '@/app/onboarding/student-setup';
import WorkloadAnalysisScreen from '@/app/onboarding/workload-analysis';
import { PlannerProvider } from '@/state/planner-context';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
    canGoBack: () => true,
  }),
}));

jest.mock('@/db/database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    execAsync: jest.fn().mockResolvedValue(undefined),
  }),
}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<PlannerProvider>{ui}</PlannerProvider>);
}

jest.setTimeout(20000);

describe('Milestone 2 — Student Onboarding & Completed Courses Screens', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
  });

  test('02_Student_Setup renders form fields, updates year & semester, and navigates to Academic Goal', async () => {
    const { getByText, getByTestId } = await renderWithProvider(<StudentSetupScreen />);

    expect(getByText('Student Setup')).toBeTruthy();
    expect(getByText('Everything is saved only on this device.')).toBeTruthy();

    await fireEvent.changeText(getByTestId('input-full-name'), 'Juan Dela Cruz Jr.');
    await fireEvent.changeText(getByTestId('input-student-id'), '2025-0099');

    // Open Year Level selector and choose 3rd Year
    await fireEvent.press(getByTestId('select-year-level'));
    await fireEvent.press(getByTestId('year-option-3'));
    expect(getByText('3rd Year')).toBeTruthy();

    // Press Continue
    await fireEvent.press(getByTestId('student-setup-continue'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/academic-goal');
    });
  });

  test('03_Academic_Goal displays BS Agriculture program, switches timeline pills, and navigates to Completed Courses', async () => {
    const { getByText, getByTestId } = await renderWithProvider(<AcademicGoalScreen />);

    expect(getByText('BS Agriculture')).toBeTruthy();
    expect(getByText('Major in Animal Science')).toBeTruthy();
    expect(getByText('Planning for a 4-year completion timeline.')).toBeTruthy();

    // Switch target timeline to 5 Years
    await fireEvent.press(getByTestId('timeline-option-5'));
    expect(getByText('Planning for a 5-year completion timeline.')).toBeTruthy();

    await fireEvent.press(getByTestId('academic-goal-continue'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/completed-courses');
    });
  });

  test('04-07_Completed_Courses orders year tabs 1st..4th, supports course selection, Select All, and Complete this year', async () => {
    const { getByText, getByTestId } = await renderWithProvider(
      <CompletedCoursesScreen />
    );

    // Verify logical tab order: 1st Year, 2nd Year, 3rd Year, 4th Year
    expect(getByTestId('year-tab-1')).toBeTruthy();
    expect(getByTestId('year-tab-2')).toBeTruthy();
    expect(getByTestId('year-tab-3')).toBeTruthy();
    expect(getByTestId('year-tab-4')).toBeTruthy();

    expect(getByText('0 completed courses')).toBeTruthy();

    // Toggle individual 1st-year course GEC101
    await fireEvent.press(getByTestId('course-row-GEC101'));
    expect(getByText('1 completed course')).toBeTruthy();

    // Use "Complete this year" to select all 1st Year courses (10 first sem + 9 second sem + 1 summer = 20)
    await fireEvent.press(getByTestId('complete-this-year-button'));
    expect(getByText('20 completed courses')).toBeTruthy();

    // Switch to 3rd Year tab and verify 3rd-year courses render
    await fireEvent.press(getByTestId('year-tab-3'));
    expect(getByText('3rd Year · 1st Semester')).toBeTruthy();
    expect(getByTestId('course-row-ANS040')).toBeTruthy();

    // Switch to 4th Year tab and verify SMC-1 slot renders
    await fireEvent.press(getByTestId('year-tab-4'));
    expect(getByText('4th Year · 1st Semester')).toBeTruthy();
    expect(getByTestId('course-row-SMC-1')).toBeTruthy();

    await fireEvent.press(getByTestId('completed-courses-continue'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/confidence-rating');
    });
  });

  test('08_Confidence_Rating displays 5 subject sliders with default scores, updates ratings, and navigates to Analyzing', async () => {
    const { getByText, getByTestId } = await renderWithProvider(
      <ConfidenceRatingScreen />
    );

    expect(getByText('Rate Your Confidence')).toBeTruthy();
    expect(getByText('Mathematics')).toBeTruthy();
    expect(getByText('Science')).toBeTruthy();
    expect(getByText('Agriculture')).toBeTruthy();
    expect(getByText('Animal Science')).toBeTruthy();
    expect(getByText('Research')).toBeTruthy();

    // Adjust Animal Science confidence from default 5 to 9
    await fireEvent.press(getByTestId('confidence-step-Animal Science-9'));
    expect(getByTestId('confidence-value-Animal Science')).toHaveTextContent('9');

    await fireEvent.press(getByTestId('confidence-rating-continue'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/analyzing');
    });
  });

  test('09_Analyzing_Requirements renders 5 checklist steps, live prerequisite metrics, expandable tier breakdown, and navigates to Workload Analysis', async () => {
    const { getByText, getByTestId, queryByTestId } = await renderWithProvider(
      <AnalyzingRequirementsScreen />
    );

    expect(getByText('Analyzing Requirements')).toBeTruthy();
    expect(getByText('Reading curriculum data...')).toBeTruthy();
    expect(getByText('Building prerequisite graph...')).toBeTruthy();
    expect(getByText('Checking completed courses...')).toBeTruthy();
    expect(getByText('Finding required courses...')).toBeTruthy();
    expect(getByText('Generating recommendations...')).toBeTruthy();
    expect(getByText('Your prerequisite analysis is ready.')).toBeTruthy();

    // Verify live Backward Chaining & Topological Sort counts render
    expect(getByTestId('remaining-courses-count')).toBeTruthy();
    expect(getByTestId('eligible-courses-count')).toBeTruthy();
    expect(getByTestId('topological-tiers-count')).toBeTruthy();

    // Expand prerequisite & tier breakdown panel
    expect(queryByTestId('analysis-details-panel')).toBeNull();
    await fireEvent.press(getByTestId('toggle-analysis-details-button'));
    expect(getByTestId('analysis-details-panel')).toBeTruthy();
    expect(getByText(/Valid Acyclic Graph \(0 cycles\)/)).toBeTruthy();

    // Switch between Prereq Status, ANS040 Graph, and Course Tiers tabs
    await fireEvent.press(getByTestId('analysis-tab-prereq-graph'));
    expect(getByTestId('onboarding-ans040-mini-graph')).toBeTruthy();
    await fireEvent.press(getByTestId('analysis-tab-course-ordering'));
    expect(getByTestId('onboarding-course-ordering-tiers')).toBeTruthy();

    // Press "See my pathway" CTA
    await fireEvent.press(getByTestId('analyzing-see-pathway-button'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/workload-analysis');
    });
  });

  test('10_Workload_Analysis renders semicircle stress gauge, recommended credit limit, factors considered, and navigates to Recommended Schedule', async () => {
    const { getByText, getByTestId, queryByTestId } = await renderWithProvider(
      <WorkloadAnalysisScreen />
    );

    expect(getByText('Workload Analysis')).toBeTruthy();
    expect(getByTestId('workload-stress-gauge')).toBeTruthy();
    expect(getByTestId('workload-stress-percentage')).toHaveTextContent('56%');
    expect(getByTestId('workload-stress-label')).toHaveTextContent('Moderate');
    expect(getByTestId('workload-traffic-light-indicator')).toBeTruthy();
    expect(getByTestId('recommended-credit-limit-value')).toHaveTextContent('15 units');
    expect(getByText('Recommended range: 12 – 18 units')).toBeTruthy();
    expect(getByText('Factors Considered')).toBeTruthy();
    expect(getByText('Your confidence ratings')).toBeTruthy();
    expect(getByText('Course difficulty levels')).toBeTruthy();
    expect(getByText('Prerequisite availability')).toBeTruthy();

    // Expand Mamdani Fuzzy Inference Engine Breakdown
    expect(queryByTestId('mamdani-fuzzy-details-panel')).toBeNull();
    await fireEvent.press(getByTestId('toggle-mamdani-breakdown-button'));
    expect(getByTestId('mamdani-fuzzy-details-panel')).toBeTruthy();

    await fireEvent.press(getByTestId('workload-analysis-continue'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/recommended-schedule');
    });
  });

  test('11_Recommended_Schedule renders next-semester summary, recommended courses, expandable placement reason, and navigates to Plan tab', async () => {
    const { getByText, getByTestId, queryByTestId } = await renderWithProvider(
      <RecommendedScheduleScreen />
    );

    expect(getByText('Recommended Schedule')).toBeTruthy();
    expect(getByTestId('recommended-semester-title')).toHaveTextContent(
      '2nd Year · 1st Semester'
    );
    expect(getByTestId('recommended-units-summary')).toHaveTextContent(
      'Total: 15 of 15 recommended units'
    );
    expect(getByTestId('recommended-stress-badge')).toHaveTextContent('Stress: 56%');

    // Expand placement reason for AGR003
    expect(queryByTestId('placement-reason-AGR003')).toBeNull();
    await fireEvent.press(getByTestId('recommended-course-AGR003'));
    expect(getByTestId('placement-reason-AGR003')).toBeTruthy();

    await fireEvent.press(getByTestId('recommended-schedule-continue'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/plan');
    });
  });
});
