import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  const themes = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Monitor }
  ];

  const currentTheme = themes.find(t => t.key === theme) || themes[2];
  const CurrentIcon = currentTheme.icon;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-text hover:opacity-90 hover:bg-surface/60 transition-colors"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{currentTheme.label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-36 bg-surface rounded-lg shadow-lg border border-border py-1 z-50">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isActive = theme === themeOption.key;
            
            return (
              <button
                key={themeOption.key}
                onClick={() => {
                  setTheme(themeOption.key);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
                  isActive 
                    ? 'text-accent bg-accent/10' 
                    : 'text-text/80 hover:text-text hover:bg-surface/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{themeOption.label}</span>
                {isActive && <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
