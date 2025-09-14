import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en-UK'); // Default to UK English

  // Load language preference from localStorage or detect from region
  useEffect(() => {
    const saved = localStorage.getItem('language-preference');
    if (saved && (saved === 'en-US' || saved === 'en-UK')) {
      setLanguage(saved);
    } else {
      // Auto-detect region for first-time visitors
      const detectRegion = async () => {
        try {
          // Try to get timezone first
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          // American timezones
          const americanTimezones = [
            'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
            'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'America/Detroit',
            'America/Indianapolis', 'America/Louisville', 'America/Kentucky/Louisville',
            'America/Kentucky/Monticello', 'America/North_Dakota/Beulah', 'America/North_Dakota/Center',
            'America/North_Dakota/New_Salem', 'America/Menominee', 'America/Indiana/Vincennes',
            'America/Indiana/Petersburg', 'America/Indiana/Tell_City', 'America/Indiana/Knox',
            'America/Indiana/Winamac', 'America/Indiana/Marengo', 'America/Indiana/Vevay'
          ];
          
          if (americanTimezones.some(tz => timezone.includes(tz.split('/')[1]))) {
            setLanguage('en-US');
            localStorage.setItem('language-preference', 'en-US');
            return;
          }
          
          // Try navigator.language as backup
          const locale = navigator.language || navigator.languages?.[0];
          if (locale && locale.startsWith('en-US')) {
            setLanguage('en-US');
            localStorage.setItem('language-preference', 'en-US');
          } else {
            // Default to UK English for all other regions
            setLanguage('en-UK');
            localStorage.setItem('language-preference', 'en-UK');
          }
        } catch (error) {
          // Fallback to UK English if detection fails
          setLanguage('en-UK');
          localStorage.setItem('language-preference', 'en-UK');
        }
      };
      
      detectRegion();
    }
  }, []);

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language-preference', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en-US' ? 'en-UK' : 'en-US');
  };

  // Get terminology based on language
  const getTerminology = () => {
    return {
      resume: language === 'en-UK' ? 'CV' : 'resume',
      Resume: language === 'en-UK' ? 'CV' : 'Resume',
      resumePlural: language === 'en-UK' ? 'CVs' : 'resumes',
      ResumePlural: language === 'en-UK' ? 'CVs' : 'Resumes',
      languagePrompt: language === 'en-UK' 
        ? 'Use British English spelling and terminology (e.g., colour, organise, CV). Use formal British tone.'
        : 'Use American English spelling and terminology (e.g., color, organize, resume). Use professional American tone.'
    };
  };

  const getLanguageDisplay = () => {
    return language === 'en-UK' ? 'UK English' : 'US English';
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    getTerminology,
    getLanguageDisplay,
    isUK: language === 'en-UK',
    isUS: language === 'en-US'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};