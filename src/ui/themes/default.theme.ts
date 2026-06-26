import { Theme } from '@/ui/types/theme';
import { createBorderRadius, createSpacing } from '@/ui/types/utils';

const primaryColor = '#0A193D';
const onPrimaryColor = '#FFFFFF';
const secondaryColor = '#00E6D2';
const successColor = '#00C573';
const accentColor = '#CCF462';
const onAccentColor = '#0A193D';

// Cores para tags no tema claro
const lightTagPalette = [
  "#DFEFB5", // Verde-limão claro
  "#B0E2B6", // Verde-menta suave
  "#D4F2D7", // Verde-água-claro
  "#D0B8F6", // Lavanda
  "#E4D7F9", // Lavanda claro
  "#9FB3E3", // Azul-lavanda
  "#C8E5F3", // Azul-céu claro
];

// Cores para tags no tema escuro
const darkTagPalette = [
  "#3D5A2E", // Verde-limão escuro
  "#2A5A30", // Verde-menta escuro
  "#2D5A35", // Verde-água escuro
  "#4A3070", // Lavanda escuro
  "#5A408A", // Lavanda médio
  "#2A3D60", // Azul-lavanda escuro
  "#1E4A60", // Azul-céu escuro
];

// Valores padrão para elementos
const spacing = createSpacing({
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
});

const borderRadius = createBorderRadius({
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  card: 12,
  chip: 9999,
});

export const defaultTheme: Theme = {
  name: 'default',
  label: 'Padrão',
  light: {
    colors: {
      isDark: false,
      
      primary: primaryColor,
      onPrimary: onPrimaryColor,
      primaryContainer: '#d1e4ff',
      onPrimaryContainer: '#001d36',

      secondary: secondaryColor,
      onSecondary: '#000000',
      secondaryContainer: '#67f9e8',
      onSecondaryContainer: '#00201d',

      success: successColor,
      onSuccess: '#ffffff',
      successContainer: '#d4f2d7',
      onSuccessContainer: '#002106',

      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',

      accent: accentColor,
      onAccent: onAccentColor,
      accentContainer: '#E5F9B2',
      onAccentContainer: '#1A2E0D',

      background: '#eeeeee',
      onBackground: '#001b3d',
      surface: '#ffffff',
      onSurface: '#001b3d',
      surfaceVariant: '#dfe2eb',
      onSurfaceVariant: '#cccc',
      surfaceDisabled: '#c5cad9',
      onSurfaceDisabled: '#3b435c',

      card: '#ffffff',
      onCard: '#001b3d',

      // Estados hover
      primaryHover: '#1a2d5c',
      secondaryHover: '#00bfaa',
      successHover: '#00994d',
      accentHover: '#b8dd38',
      surfaceHover: '#f5f5f5',
      
      tagPalette: lightTagPalette,
    },
    elevation: {
      level0: primaryColor + '0D',
      level1: primaryColor + '1A',
      level2: primaryColor + '33',
      level3: primaryColor + '59',
      level4: primaryColor + '80',
      level5: primaryColor + 'A6',
    },
    card: {
      padding: 20,
      borderRadius: 20,
      elevation: 'level2',
      style: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
    },
  },
  dark: {
    colors: {
      isDark: true,

      primary: primaryColor,
      onPrimary: onPrimaryColor,
      primaryContainer: '#1E3A5F',
      onPrimaryContainer: '#d1e4ff',

      secondary: secondaryColor,
      onSecondary: '#003730',
      secondaryContainer: '#005048',
      onSecondaryContainer: '#67f9e8',

      success: successColor,
      onSuccess: '#003919',
      successContainer: '#0A3D1E',
      onSuccessContainer: '#8CF5A8',

      error: '#FF897D',
      onError: '#690005',
      errorContainer: '#5C1616',
      onErrorContainer: '#FFD9D6',

      accent: accentColor,
      onAccent: onAccentColor,
      accentContainer: '#2E4A1A',
      onAccentContainer: '#E5F9B2',

      background: '#0F1419',
      onBackground: '#E4E8EF',
      surface: '#1A2332',
      onSurface: '#E4E8EF',
      surfaceVariant: '#243147',
      onSurfaceVariant: '#8A94A6',
      surfaceDisabled: '#1E2A3A',
      onSurfaceDisabled: '#5A6478',

      card: '#1A2332',
      onCard: '#E4E8EF',

      // Estados hover
      primaryHover: '#1a2d5c',
      secondaryHover: '#00bfaa',
      successHover: '#00994d',
      accentHover: '#b8dd38',
      surfaceHover: '#243147',

      tagPalette: darkTagPalette,
    },
    elevation: {
      level0: '#000000' + '0D',
      level1: '#000000' + '1A',
      level2: '#000000' + '33',
      level3: '#000000' + '59',
      level4: '#000000' + '80',
      level5: '#000000' + 'A6',
    },
    card: {
      padding: 20,
      borderRadius: 20,
      elevation: 'level2',
      style: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    },
  },
  typography: {
    fontFamily: {
      base: 'Inter',
      accent: 'Inter',
    },
    weights: {
      regular: 400,
      medium: 500,
      bold: 700,
      extraBold: 900,
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      h4: 24,
      h3: 26,
      h2: 32,
      h1: 40,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
    letterSpacings: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },
  spacing,
  borderRadius,
  elements: {
    height: {
      sm: 36,  // Botão pequeno
      md: 48,  // Botão médio (padrão)
      lg: 56,  // Botão grande
      xl: 64,  // Botão extra grande
    }
  },
};
