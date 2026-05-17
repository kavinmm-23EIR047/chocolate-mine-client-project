import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Mode can be 'light', 'dark', or 'system'
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (mode) => {
      let themeToApply = mode;
      
      if (mode === 'system') {
        themeToApply = mediaQuery.matches ? 'dark' : 'light';
      }

      setResolvedTheme(themeToApply);

      // Add transition class to prevent layout shift flashes
      root.classList.add('theme-transition');
      
      if (themeToApply === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Remove transition class after a short delay
      setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 300);

      localStorage.setItem('theme-mode', mode);
    };

    applyTheme(themeMode);

    // Listener for system theme changes
    const handleChange = () => {
      if (themeMode === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const toggleTheme = (newMode) => {
    if (typeof newMode === 'string') {
      setThemeMode(newMode);
    } else {
      // Safe toggle between light and dark directly based on resolvedTheme
      setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, toggleTheme, isDark: resolvedTheme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
