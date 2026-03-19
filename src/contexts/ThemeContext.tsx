'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useLayoutEffect } from 'react';

const THEMES = ['system', 'light', 'dark', 'ocean', 'forest', 'sunset', 'sea', 'mint', 'lavender', 'rose', 'sand', 'sky', 'slate'] as const;
type Theme = (typeof THEMES)[number];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const LIGHT_THEMES: ReadonlySet<string> = new Set(['light', 'lavender', 'rose', 'sand', 'sky', 'slate']);

const getEffectiveTheme = (theme: Theme): Theme => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

const getColorScheme = (theme: Theme): string => {
  return LIGHT_THEMES.has(theme) ? 'light' : 'dark';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Initialize theme as early as possible to prevent flash
  useLayoutEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    const initialTheme = stored && THEMES.includes(stored) ? stored : 'system';
    setTheme(initialTheme);
    const effectiveTheme = getEffectiveTheme(initialTheme);
    document.documentElement.classList.remove(...THEMES);
    document.documentElement.classList.add(effectiveTheme);
    document.documentElement.style.colorScheme = getColorScheme(effectiveTheme);
    if (!stored) {
      localStorage.setItem('theme', initialTheme);
    }
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    const root = window.document.documentElement;
    const effectiveTheme = getEffectiveTheme(newTheme);
    
    root.classList.remove(...THEMES);
    root.classList.add(effectiveTheme);
    root.style.colorScheme = getColorScheme(effectiveTheme);

    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const effectiveTheme = getSystemTheme();
        const root = window.document.documentElement;
        root.classList.remove(...THEMES);
        root.classList.add(effectiveTheme);
        root.style.colorScheme = getColorScheme(effectiveTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Prevent flash during SSR
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { THEMES };
