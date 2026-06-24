// src/components/ui/ThemeToggle.jsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';  // ✅ fixed path

const ThemeToggle = ({ buttonClass }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={() => toggleTheme()}
      className={buttonClass || "flex items-center justify-center w-10 h-10 rounded-xl bg-card-soft border border-border text-foreground hover:bg-background transition-all active:scale-95"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={24} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon size={24} className="text-foreground transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;