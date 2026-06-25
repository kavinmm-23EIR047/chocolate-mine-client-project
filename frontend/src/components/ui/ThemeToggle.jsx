// src/components/ui/ThemeToggle.jsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ buttonClass, iconClass, showLabel }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={() => toggleTheme()}
      className={buttonClass || "flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary/8 transition-colors"}
      aria-label="Toggle theme"
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun size={24} className={iconClass || "text-heading transition-transform duration-300 hover:rotate-45"} />
        ) : (
          <Moon size={24} className={iconClass || "text-heading transition-transform duration-300 hover:-rotate-12"} />
        )}
      </div>
      {showLabel && <span className="text-[11px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors mt-1">Theme</span>}
    </button>
  );
};

export default ThemeToggle;