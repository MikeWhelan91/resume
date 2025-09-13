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
  const [language, setLanguage] = useState('en-US'); // Default to US English

  // Load language preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('language-preference');
    if (saved && (saved === 'en-US' || saved === 'en-UK')) {
      setLanguage(saved);
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