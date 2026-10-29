import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import CoursesCatalogScreen from '@/app/(tabs)/courses';
import GoalPathGraphScreen from '@/app/(tabs)/graph';
import PlanRoadmapScreen from '@/app/(tabs)/plan';
import SettingsScreen from '@/app/(tabs)/settings';
import { PlannerProvider } from '@/state/planner-context';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
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

describe('Milestone 5 — Main Application Tabs (Screens 12 to 15)', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test('12_Your_Plan_Roadmap renders hero card, stress alert, Next Semester card, and expands course list', async () => {
    const { getByText, getByTestId } = await renderWithProvider(
      <PlanRoadmapScreen />
    );

    expect(getByText('YOUR PLAN')).toBeTruthy();
    expect(getByText('Your plan')).toBeTruthy();
    expect(getByText("YOU'RE ON TRACK")).toBeTruthy();
    expect(getByTestId('plan-semesters-to-graduation')).toHaveTextContent(
      '4 semesters to graduation'
    );
    expect(getByTestId('plan-credits-timeline-summary')).toHaveTextContent(
      '15 credits planned · 4-year timeline'
    );
    expect(getByText('Next semester looks moderately stressful')).toBeTruthy();
    expect(
      getByText('56% projected stress · 15-unit recommended limit')
    ).toBeTruthy();

    // Verify Dashboard quick shortcuts row (Flow.pdf Step 14)
    expect(getByTestId('dashboard-shortcuts-row')).toBeTruthy();
    expect(getByTestId('dashboard-shortcut-courses')).toBeTruthy();
    expect(getByTestId('dashboard-shortcut-graph')).toBeTruthy();
    expect(getByTestId('dashboard-shortcut-workload')).toBeTruthy();

    // Tap a course in the Next Semester roadmap card to inspect placement reason
    await fireEvent.press(getByTestId('plan-next-course-AGR003'));
    expect(getByTestId('roadmap-course-detail-AGR003')).toBeTruthy();

    // Expand "View all recommended courses"
    await fireEvent.press(getByTestId('view-all-recommended-courses-button'));
    expect(getByText('Show fewer courses')).toBeTruthy();
  });

  test('13_Courses_Catalog supports search, filter tabs, unresolved AGF101 notice, and marking a course completed', async () => {
    const { getByText, getByTestId } = await renderWithProvider(
      <CoursesCatalogScreen />
    );

    expect(getByText('YOUR DEGREE')).toBeTruthy();
    expect(getByText('Courses')).toBeTruthy();
    expect(getByTestId('courses-degree-credits')).toHaveTextContent(
      '15 of 178 credits'
    );

    // Search for ANS042 (Animal Health and Diseases)
    await fireEvent.changeText(getByTestId('courses-search-input'), 'ANS042');
    expect(getByText('Animal Health and Diseases')).toBeTruthy();

    // Expand ANS042 row to inspect unresolved AGF101 notice and mark completed
    await fireEvent.press(getByTestId('catalog-course-row-ANS042'));
    expect(getByTestId('catalog-course-details-ANS042')).toBeTruthy();
    expect(getByText(/AGF101/)).toBeTruthy();

    await fireEvent.press(getByTestId('catalog-toggle-complete-ANS042'));

    // Clear search and switch to Completed filter tab
    await fireEvent.changeText(getByTestId('courses-search-input'), '');
    await fireEvent.press(getByTestId('courses-filter-Completed'));
    expect(getByTestId('catalog-course-row-ANS042')).toBeTruthy();
  });

  test('14_Goal_Path_Prerequisite_Graph renders Animal Science spine nodes, updates selected course card, and toggles zoom', async () => {
    const { getByText, getByTestId } = await renderWithProvider(
      <GoalPathGraphScreen />
    );

    expect(getByText('COURSE MAP')).toBeTruthy();
    expect(getByText('Goal path')).toBeTruthy();
    expect(getByText('Animal Science pathway')).toBeTruthy();
    expect(getByTestId('graph-node-ANS001')).toBeTruthy();
    expect(getByTestId('graph-node-ANS002')).toBeTruthy();
    expect(getByTestId('graph-node-ANS040')).toBeTruthy();
    expect(getByTestId('graph-node-ANS197')).toBeTruthy();
    expect(getByTestId('graph-node-ANS199')).toBeTruthy();

    // Default selected node is ANS001
    expect(getByTestId('graph-selected-course-code')).toHaveTextContent('ANS001');

    // Select ANS040 node and verify inspector card updates
    await fireEvent.press(getByTestId('graph-node-ANS040'));
    expect(getByTestId('graph-selected-course-code')).toHaveTextContent('ANS040');
    expect(getByTestId('graph-selected-course-summary')).toHaveTextContent(
      /Anatomy and Physiology of Farm Animals/
    );

    // Switch to ANS040 Prereqs tree view and Course Ordering Tiers view
    await fireEvent.press(getByTestId('graph-mode-ans040-tree'));
    expect(getByTestId('graph-ans040-dependency-view')).toBeTruthy();
    await fireEvent.press(getByTestId('graph-mode-course-tiers'));
    expect(getByTestId('graph-course-ordering-view')).toBeTruthy();

    // Toggle zoom control
    await fireEvent.press(getByTestId('graph-zoom-button'));
    expect(getByText('110%')).toBeTruthy();
  });

  test('15_Settings renders student profile, plan summary, privacy section, and resets academic plan', async () => {
    const { getByText, getByTestId } = await renderWithProvider(
      <SettingsScreen />
    );

    expect(getByText('Settings')).toBeTruthy();
    expect(getByTestId('settings-student-name')).toHaveTextContent(
      'Juan Dela Cruz'
    );
    expect(getByText('BS Agriculture · Animal Science')).toBeTruthy();
    expect(getByTestId('settings-planning-window-summary')).toHaveTextContent(
      '4 semesters remaining · 4-year timeline'
    );
    expect(getByTestId('settings-workload-summary')).toHaveTextContent(
      '15-credit maximum · 56% stress'
    );
    expect(getByText('Everything is saved automatically')).toBeTruthy();

    await fireEvent.press(getByTestId('start-new-academic-plan-button'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/student-setup');
    });
  });
});

