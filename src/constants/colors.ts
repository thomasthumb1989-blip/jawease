export const Colors = {
  light: {
    background: '#F7F5F0',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    primary: '#3A7D6E',
    primaryLight: '#5BA899',
    accent: '#D4935A',
    accentGlow: '#F0C88A',
    text: '#1C1C1E',
    textSecondary: '#6B6B6B',
    textMuted: '#9E9E9E',
    border: '#E5E5E5',
    success: '#4A9D5B',
    warning: '#C9A227',
    error: '#C44545',
    painLow: '#3A7D6E',
    painMedium: '#D4935A',
    painHigh: '#C44545',
  },
  dark: {
    background: '#0F0F0F',
    surface: '#1A1A1A',
    card: '#1A1A1A',
    primary: '#5BA899',
    primaryLight: '#7CC4B5',
    accent: '#F0C88A',
    accentGlow: '#F5DDB5',
    text: '#F5F5F5',
    textSecondary: '#999999',
    textMuted: '#666666',
    border: '#333333',
    success: '#5BBD6B',
    warning: '#D4B237',
    error: '#D45555',
    painLow: '#5BA899',
    painMedium: '#F0C88A',
    painHigh: '#D45555',
  },
} as const;

export const painLevelColors = {
  none: '#4A9D5B',
  mild: '#8BC34A',
  moderate: '#D4935A',
  severe: '#E57373',
  extreme: '#C44545',
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[ColorScheme];
