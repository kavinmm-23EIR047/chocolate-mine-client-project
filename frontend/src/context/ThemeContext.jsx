import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Mode can be 'light', 'dark', or 'system'
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved || 'system';
  });

  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const [resolvedTheme, setResolvedTheme] = useState(() =>
    themeMode === 'system' ? getSystemTheme() : themeMode
  );

  // Tracks whether we've done the very first paint, so we don't animate on load
  const hasMounted = useRef(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (mode) => {
      const themeToApply = mode === 'system' ? getSystemTheme() : mode;

      setResolvedTheme(themeToApply);

      // Enable the CSS transition only after first mount, so we don't
      // animate the initial theme application (which would cause a
      // visible flash/fade on page load).
      if (hasMounted.current) {
        root.classList.add('theme-transition');
      }

      if (themeToApply === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      if (hasMounted.current) {
        // Clear the transition class after the transition finishes so it
        // doesn't interfere with unrelated layout changes elsewhere.
        window.setTimeout(() => {
          root.classList.remove('theme-transition');
        }, 350);
      }

      localStorage.setItem('theme-mode', mode);
    };

    applyTheme(themeMode);
    hasMounted.current = true;

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
    <ThemeContext.Provider
      value={{ themeMode, resolvedTheme, toggleTheme, isDark: resolvedTheme === 'dark' }}
    >
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