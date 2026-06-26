import { useTheme } from '@/ui/hooks/useTheme';

export const useThemeColors = () => {
  const { palette, isDark } = useTheme();

  return {
    // Cores primárias
    primary: palette.primary,
    primaryHover: palette.primaryHover,
    onPrimary: palette.onPrimary,

    // Cores secundárias
    secondary: palette.secondary,
    secondaryHover: palette.secondaryHover,
    onSecondary: palette.onSecondary,

    // Cores de sucesso
    success: palette.success,
    successHover: palette.successHover,
    onSuccess: palette.onSuccess,

    // Cores de acento
    accent: palette.accent,
    accentHover: palette.accentHover,
    onAccent: palette.onAccent,

    // Cores de superfície
    surface: palette.surface,
    surfaceHover: palette.surfaceHover,
    onSurface: palette.onSurface,

    // Cores de card
    card: palette.card,
    onCard: palette.onCard,

    // Cores de fundo
    background: palette.background,
    onBackground: palette.onBackground,

    // Cores desabilitadas
    surfaceDisabled: palette.surfaceDisabled,
    onSurfaceDisabled: palette.onSurfaceDisabled,

    isDark,
  };
};
