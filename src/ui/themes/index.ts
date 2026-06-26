export { defaultTheme } from './default.theme';

import { defaultTheme } from './default.theme';

// Exporta todos os temas disponíveis
export const themes = {
  default: defaultTheme,
} as const;

// Exporta o tipo dos temas disponíveis
export type ThemeName = keyof typeof themes;
