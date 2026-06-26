// Tipos para a paleta de cores
export type TagPalette = string[];

// Tipos para elevação
export type ElevationLevel = 'level0' | 'level1' | 'level2' | 'level3' | 'level4' | 'level5';

export type Elevation = {
  [K in ElevationLevel]: string;
};

// Tipos para tipografia
export type FontFamily = {
  base: string;
  accent: string;
};

export type FontWeight = {
  regular: "400" | 400;
  medium: "500" | 500;
  bold: "700" | 700;
  extraBold: "900" | 900;
};

export type FontSize = {
  xs: number;    // Texto muito pequeno
  sm: number;    // Texto pequeno
  md: number;    // Texto padrão
  lg: number;    // Texto grande
  xl: number;    // Título pequeno
  xxl: number;   // Título médio
  h4: number;    // Título H4
  h3: number;    // Título H3
  h2: number;    // Título H2
  h1: number;    // Título H1
};

export type Typography = {
  fontFamily: FontFamily;
  weights: FontWeight;
  sizes: FontSize;
  lineHeights?: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacings?: {
    tight: number;
    normal: number;
    wide: number;
  };
};

// Tipos para dimensões
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type HeightSize = 'sm' | 'md' | 'lg' | 'xl';
export type RadiusSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type SpacingSize = Size;

// Tipos para spacing e borderRadius
export interface SpacingValues {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface BorderRadiusValues {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
  card?: number;
  chip?: number;
}

export type Spacing = SpacingValues;
export type BorderRadius = BorderRadiusValues;

export type Height = {
  [K in HeightSize]: number;
};

// Tipos para elementos do tema
export type ThemeElements = {
  height: Height;
  radius?: Partial<BorderRadiusValues>;
  spacing?: Partial<SpacingValues>;
};

// Tipos para cores
export type ColorPalette = {
  isDark: boolean;
  
  // Cores primárias
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  // Cores secundárias
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  // Cores de status
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;

  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  // Cores de destaque
  accent: string;
  onAccent: string;
  accentContainer: string;
  onAccentContainer: string;

  // Cores de superfície
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceDisabled: string;
  onSurfaceDisabled: string;

  // Cores do Card
  card: string;
  onCard: string;

  // Estados hover (para dark mode principalmente)
  primaryHover?: string;
  secondaryHover?: string;
  successHover?: string;
  accentHover?: string;
  surfaceHover?: string;

  // Paleta de tags
  tagPalette: TagPalette;
};

// Tipos para cards
export type CardStyle = {
  padding?: number;
  margin?: number;
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: string;
  elevation: ElevationLevel;
  style?: {
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
  };
};

// Tipo para o modo do tema (claro/escuro)
export type ThemeMode = {
  colors: ColorPalette;
  elevation: Elevation;
  card: CardStyle;
};

// Tipo para aparência do tema
export type ThemeAppearance = 'light' | 'dark' | 'system';

// Tipo principal do tema
export type Theme = {
  name: string;
  label: string;
  light: ThemeMode;
  dark: ThemeMode;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  elements: ThemeElements;
};
