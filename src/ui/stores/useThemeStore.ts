import { defaultTheme, themes } from "@/ui/themes";
import { Theme, ThemeAppearance } from '@/ui/types/theme';
import { useLocation } from "react-router-dom";
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ThemeState {
  // Estado
  theme: Theme;
  appearance: ThemeAppearance;

  // Ações
  setTheme: (theme: Theme) => void;
  setAppearance: (appearance: ThemeAppearance) => void;
  getAppearanceLabel: () => string;
  
  // Valores calculados
  availableThemes: Theme[];
}

// Cria o store do tema usando Zustand com persistência no localStorage
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      theme: defaultTheme,
      appearance: 'system' as ThemeAppearance,

      // Ações
      setTheme: (theme: Theme) => set({ theme }),
      setAppearance: (appearance: ThemeAppearance) => set({ appearance }),
      
      getAppearanceLabel: () => {
        const { appearance } = get();
        switch (appearance) {
          case 'light':
            return 'Aparência clara';
          case 'dark':
            return 'Aparência escura';
          case 'system':
            return 'Aparência do sistema';
        }
      },

      // Valores calculados
      availableThemes: Object.values(themes),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Hook para verificar se o tema está no modo escuro
export function useIsDarkMode() {
  const appearance = useThemeStore(state => state.appearance);
  const location = useLocation();

  // Forçar modo claro em páginas de autenticação
  if (location.pathname.startsWith('/auth')) {
    return false;
  }
  
  // Detectar preferência do sistema apenas na web
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  switch (appearance) {
    case 'light':
      return false;
    case 'dark':
      return true;
    case 'system':
    default:
      return systemDark;
  }
}
