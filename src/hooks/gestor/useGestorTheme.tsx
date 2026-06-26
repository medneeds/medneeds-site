import { useState, useEffect, createContext, useContext } from "react";

type Theme = "light" | "dark";

interface GestorThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const GestorThemeContext = createContext<GestorThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "gestor-theme";

export function GestorThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored) return stored;
      // Default to "dark" as requested, since it's the principal pattern.
      return "dark";
    }
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <GestorThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </GestorThemeContext.Provider>
  );
}

export function useGestorTheme() {
  const context = useContext(GestorThemeContext);
  if (!context) {
    throw new Error("useGestorTheme must be used within GestorThemeProvider");
  }
  return context;
}
