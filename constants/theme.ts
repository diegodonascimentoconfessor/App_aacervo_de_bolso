import { Platform } from 'react-native';

export const colors = {
  bg: '#0D0D0D',
  surface: '#18181B',
  surfaceAlt: '#232328',
  border: '#2A2A30',
  text: '#F4F4F5',
  muted: '#A1A1AA',
  accent: '#D97706',
  accentSoft: 'rgba(217,119,6,0.15)',
  danger: '#EF4444',
} as const;

export const radius = { sm: 8, md: 14, lg: 20 } as const;
export const space = { xs: 4, sm: 8, md: 14, lg: 20, xl: 28 } as const;

// Serifada para leitura longa; sans do sistema para a interface.
export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
};
