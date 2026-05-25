import { useColorScheme } from 'react-native';
import { Colors, type ColorScheme } from '@/src/constants/colors';

export function useTheme() {
  const scheme = useColorScheme();
  const colorScheme: ColorScheme = scheme === 'dark' ? 'dark' : 'light';
  return Colors[colorScheme];
}

export function useColorSchemeValue() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
