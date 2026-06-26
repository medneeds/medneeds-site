import { useIsDarkMode, useThemeStore } from '@/ui/stores/useThemeStore';
import { defaultTheme } from '@/ui/themes';
import { ColorPalette } from '@/ui/types/theme';
import { useMemo } from 'react';

/**
 * Hook para acessar o tema atual e suas configurações
 * 
 * Garante que o palette sempre tenha um valor válido, mesmo antes do store estar completamente hidratado.
 * Usa defaultTheme como fallback.
 */
export function useTheme() {
  const theme = useThemeStore(state => state.theme);
  const appearance = useThemeStore(state => state.appearance);
  const setTheme = useThemeStore(state => state.setTheme);
  const setAppearance = useThemeStore(state => state.setAppearance);
  const getAppearanceLabel = useThemeStore(state => state.getAppearanceLabel);
  const availableThemes = useThemeStore(state => state.availableThemes);
  
  const isDark = useIsDarkMode();
  
  // Calcula a paleta de cores atual com base no tema e modo (claro/escuro)
  // Usa defaultTheme como fallback para garantir que sempre tenha um valor válido
  const palette: ColorPalette = useMemo(() => {
    // Usar o tema do store se estiver disponível e válido, senão usar defaultTheme
    const currentTheme = theme && theme.light && theme.dark ? theme : defaultTheme;
    const colors = isDark ? currentTheme.dark.colors : currentTheme.light.colors;

    // Garantir que todas as propriedades necessárias estejam presentes
    // Se alguma estiver faltando, usar o defaultTheme
    if (!colors || !colors.background || !colors.onSurface || !colors.accent || !colors.primary || !colors.onAccent || !colors.card || !colors.onCard) {
      return isDark ? defaultTheme.dark.colors : defaultTheme.light.colors;
    }
    
    return colors;
  }, [theme, isDark]);

  const getSofterColor = (hexColor: string, zeroToOneOpacity?: number) => {
    const hexOpacity = zeroToOneOpacity ? Math.round(zeroToOneOpacity * 255).toString(16).padStart(2, '0') : '';
    return `${hexColor}${hexOpacity}`;
  };

  // Retorna a interface do tema com todas as informações necessárias
  return {
    theme,
    isDark,
    setTheme,
    appearance,
    setAppearance,
    availableThemes,
    getAppearanceLabel,
    palette,
    getSofterColor,
  };
}
