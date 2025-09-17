import { useLanguage } from '../../contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguagePicker() {
  const { language, setLanguage, getLanguageDisplay } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  const languages = [
    { key: 'en-US', label: 'US English', flag: '🇺🇸' },
    { key: 'en-UK', label: 'UK English', flag: '🇬🇧' }
  ];

  const currentLanguage = languages.find(l => l.key === language) || languages[1];

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
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        aria-label="Select language"
      >
        <span className="hidden sm:inline">{currentLanguage.flag}</span>
        <span className="hidden md:inline">{currentLanguage.label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {languages.map((languageOption) => {
            const isActive = language === languageOption.key;

            return (
              <button
                key={languageOption.key}
                onClick={() => {
                  setLanguage(languageOption.key);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className="text-base">{languageOption.flag}</span>
                <span>{languageOption.label}</span>
                {isActive && <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}