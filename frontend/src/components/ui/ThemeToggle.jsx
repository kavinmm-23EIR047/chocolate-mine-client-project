// src/components/ui/ThemeToggle.jsx
import React, { useState } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';  // ✅ fixed path

const ThemeToggle = () => {
  const { themeMode, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const modes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-card-soft border border-border 
                   text-foreground hover:bg-background transition-all active:scale-95"
        aria-label="Change theme"
      >
        {themeMode === 'light' && <Sun size={24} />}
        {themeMode === 'dark' && <Moon size={24} />}
        {themeMode === 'system' && <Monitor size={24} />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 z-50 bg-card border border-border rounded-2xl shadow-premium overflow-hidden animate-in fade-in zoom-in duration-200">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  toggleTheme(mode.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors
                           ${themeMode === mode.id ? 'bg-primary/5 text-primary font-semibold' : 'text-muted hover:bg-background'}`}
              >
                <div className="flex items-center gap-3">
                  <mode.icon size={16} />
                  <span>{mode.label}</span>
                </div>
                {themeMode === mode.id && <Check size={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;