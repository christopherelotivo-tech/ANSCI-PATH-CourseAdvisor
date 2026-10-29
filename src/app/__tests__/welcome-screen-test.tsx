import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import WelcomeScreen from '@/app/index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

describe('<WelcomeScreen /> (01_Welcome_Get_Started)', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test('renders AnSciPath branding, degree tagline, companion caption, and Get Started CTA', async () => {
    const { getByText, getByTestId } = await render(<WelcomeScreen />);

    expect(getByText('AnSciPath')).toBeTruthy();
    expect(getByText(/PLAN YOUR ANIMAL SCIENCE/)).toBeTruthy();
    expect(getByText('Your personalized academic planning companion.')).toBeTruthy();
    expect(getByTestId('welcome-get-started-button')).toBeTruthy();
  });

  test('navigates to /onboarding/student-setup when Get Started is pressed', async () => {
    const { getByTestId } = await render(<WelcomeScreen />);

    fireEvent.press(getByTestId('welcome-get-started-button'));
    expect(mockPush).toHaveBeenCalledWith('/onboarding/student-setup');
  });
});
