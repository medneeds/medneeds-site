import { useTheme } from '@/ui/hooks/useTheme';
import { useThemeStore } from '@/ui/stores/useThemeStore';
import { defaultTheme } from "@/ui/themes";
import React, { useEffect } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Componente ThemeProvider que configura o tema inicial
 * Este componente deve envolver toda a aplicação
 * 
 * Responsabilidades:
 * 1. Inicializar o tema padrão
 * 2. Aplicar as variáveis CSS de tema ao elemento root
 * 3. Garantir que o modo escuro/claro seja refletido no HTML
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const setTheme = useThemeStore(state => state.setTheme);
  const theme = useThemeStore(state => state.theme);
  
  // Forçar cálculo do palette logo no início
  const { palette, isDark } = useTheme();

  // Configuração inicial e aplicação de variáveis CSS
  useEffect(() => {
    // Se o tema ainda não estiver definido no store, configure o tema padrão
    if (!theme || !theme.name) {
      setTheme(defaultTheme);
    }
    
    // Aplicar variáveis CSS de tema ao elemento root
    const root = document.documentElement;
    const mode = isDark ? 'dark' : 'light';
    
    // Obter cores do tema atual
    const themeData = isDark ? theme.dark : theme.light;
    const colors = themeData.colors;
    
    // Obter cores do tema dark para elementos que sempre devem estar em dark
    // const darkThemeData = theme.dark;
    // const darkColors = darkThemeData.colors;
    
    // Aplicar as variáveis CSS personalizadas
    const cssVariables = {
      // Cores primárias
      '--primary': hexToHsl(colors.primary),
      '--primary-foreground': hexToHsl(colors.onPrimary),
      '--primary-container': hexToHsl(colors.primaryContainer),
      '--primary-container-foreground': hexToHsl(colors.onPrimaryContainer),
      
      // Cores secundárias
      '--secondary': hexToHsl(colors.secondary),
      '--secondary-foreground': hexToHsl(colors.onSecondary),
      '--secondary-container': hexToHsl(colors.secondaryContainer),
      '--secondary-container-foreground': hexToHsl(colors.onSecondaryContainer),
      
      // Cores de sucesso
      '--success': hexToHsl(colors.success),
      '--success-foreground': hexToHsl(colors.onSuccess),
      '--success-container': hexToHsl(colors.successContainer),
      '--success-container-foreground': hexToHsl(colors.onSuccessContainer),
      
      // Cores de erro
      '--destructive': hexToHsl(colors.error),
      '--destructive-foreground': hexToHsl(colors.onError),
      '--destructive-container': hexToHsl(colors.errorContainer),
      '--destructive-container-foreground': hexToHsl(colors.onErrorContainer),
      
      // Cores de destaque
      '--accent': hexToHsl(colors.accent),
      '--accent-foreground': hexToHsl(colors.onAccent),
      '--accent-container': hexToHsl(colors.accentContainer),
      '--accent-container-foreground': hexToHsl(colors.onAccentContainer),
      
      // Cores de superfície
      '--background': hexToHsl(colors.background),
      '--foreground': hexToHsl(colors.onBackground),
      '--surface': hexToHsl(colors.surface),
      '--surface-foreground': hexToHsl(colors.onSurface),
      '--surface-variant': hexToHsl(colors.surfaceVariant),
      '--surface-variant-foreground': hexToHsl(colors.onSurfaceVariant),
      '--surface-disabled': hexToHsl(colors.surfaceDisabled),
      '--surface-disabled-foreground': hexToHsl(colors.onSurfaceDisabled),
      
      // Cores mutantes
      '--muted': hexToHsl(colors.surfaceVariant),
      '--muted-foreground': hexToHsl(colors.onSurfaceVariant),
      
      // Border e ring
      '--border': isDark ? '220 20% 18%' : hexToHsl(colors.surfaceVariant),
      '--input': hexToHsl(isDark ? colors.surfaceVariant : colors.surface),
      '--ring': hexToHsl(colors.accent),
      
      // Card
      '--card': hexToHsl(colors.card || colors.surface),
      '--card-foreground': hexToHsl(colors.onCard || colors.onSurface),
      
      // Popover
      '--popover': hexToHsl(colors.surface),
      '--popover-foreground': hexToHsl(colors.onSurface),
      
      // Interactive
      '--interactive': hexToHsl(colors.primary),
      '--interactive-foreground': hexToHsl(colors.onPrimary),
      
      // Sidebar
      '--sidebar-background': hexToHsl(colors.primary),
      '--sidebar-foreground': hexToHsl(colors.onPrimary),
      '--sidebar-primary': hexToHsl(colors.primary),
      '--sidebar-primary-foreground': hexToHsl(colors.onPrimary),
      '--sidebar-accent': hexToHsl(colors.accent),
      '--sidebar-accent-foreground': hexToHsl(colors.onAccent),
      '--sidebar-border': isDark ? '220 20% 18%' : hexToHsl(colors.surfaceVariant),
      '--sidebar-ring': hexToHsl(colors.accent),
      
      // Status
      '--status-open': hexToHsl('#CCF462'),
      '--status-confirmed': hexToHsl(colors.successContainer),
      '--status-pending': hexToHsl(colors.accent),
      '--status-canceled': hexToHsl(colors.errorContainer),
      '--status-completed': hexToHsl(colors.successContainer),
      
      // Chips (dark-aware)
      '--chip-green': isDark ? hexToHsl('#2A4A2A') : hexToHsl('#D4EFC0'),
      '--chip-green-text': isDark ? hexToHsl('#A8E6A8') : hexToHsl('#1a3d1a'),
      '--chip-blue': isDark ? hexToHsl('#1A3550') : hexToHsl('#C8E5F3'),
      '--chip-blue-text': isDark ? hexToHsl('#8EC8E8') : hexToHsl('#0a2d4d'),
      '--chip-purple': isDark ? hexToHsl('#3A2D55') : hexToHsl('#DDD4F0'),
      '--chip-purple-text': isDark ? hexToHsl('#C4B8E8') : hexToHsl('#3d2d5d'),
      '--chip-orange': isDark ? hexToHsl('#4A3520') : hexToHsl('#F7DCBA'),
      '--chip-orange-text': isDark ? hexToHsl('#E8C89A') : hexToHsl('#5d3d1a'),
      '--chip-red': isDark ? hexToHsl('#4A2020') : hexToHsl('#FFD9D9'),
      '--chip-red-text': isDark ? hexToHsl('#FF9A9A') : hexToHsl('#8d0000'),
      
      // Navy e Lime (brand colors)
      '--navy': hexToHsl('#0A193D'),
      '--navy-light': isDark ? hexToHsl('#1E3A5F') : hexToHsl('#d1e4ff'),
      '--navy-dark': isDark ? hexToHsl('#050D1E') : hexToHsl('#001d36'),
      '--lime': hexToHsl('#CCF462'),
      '--lime-light': isDark ? hexToHsl('#2E4A1A') : hexToHsl('#E5F9B2'),
      '--lime-dark': hexToHsl('#132603'),
      '--lime-muted': isDark ? hexToHsl('#6f8d5b') : hexToHsl('#D4EFC0'),
      
      // Border Radius (do tema)
      '--radius': `${theme.borderRadius.lg}px`,
      '--card-radius': `${theme.borderRadius.card}px`,
      '--chip-radius': `${theme.borderRadius.chip}px`,
      
      // Shadows (dark-aware)
      '--shadow-card': isDark 
        ? '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)' 
        : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      '--shadow-elevated': isDark 
        ? '0 3px 6px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.46)' 
        : '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
      '--shadow-modal': isDark 
        ? '0 10px 40px rgba(0, 0, 0, 0.5), 0 10px 40px rgba(0, 0, 0, 0.5)' 
        : '0 10px 40px rgba(0, 0, 0, 0.16), 0 10px 40px rgba(0, 0, 0, 0.23)',
    };
    
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Aplicar modo escuro/claro
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    
    console.log('[ThemeProvider] ✅ Tema inicializado', {
      themeName: theme?.name || defaultTheme.name,
      mode,
      isDark,
      paletteReady: !!palette?.background,
    });
  }, [theme, setTheme, palette, isDark]);

  return <>{children}</>;
};

/**
 * Converte uma cor hexadecimal para HSL
 * Retorna como string "H S L" para uso em variáveis CSS
 */
function hexToHsl(hex: string): string {
  if (!hex) return "0 0% 0%"; // Fallback safely
  
  // Remover # se existir
  hex = hex.replace('#', '');
  
  // Converter para RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);
  
  return `${hDeg} ${sPct}% ${lPct}%`;
}
