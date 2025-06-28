import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useLanguage() {
  const { user } = useAuth();
  
  // Get user's target languages
  const targetLanguages = user?.user_metadata?.target_languages || [user?.user_metadata?.target_language || '영어'];
  const languages = Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages];
  
  // Initialize with localStorage value or first available language
  const [selectedLanguage, setSelectedLanguageState] = useState(() => {
    const saved = localStorage.getItem('selectedLanguage');
    return saved && languages.includes(saved) ? saved : languages[0] || '영어';
  });

  // Update localStorage whenever language changes
  const setSelectedLanguage = (language: string) => {
    setSelectedLanguageState(language);
    localStorage.setItem('selectedLanguage', language);
    
    // Dispatch global event to notify all components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
  };

  // Listen for language changes from other components
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setSelectedLanguageState(event.detail);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  // Update selected language if user's languages change
  useEffect(() => {
    if (user && languages.length > 0) {
      const saved = localStorage.getItem('selectedLanguage');
      if (!saved || !languages.includes(saved)) {
        const newLanguage = languages[0];
        setSelectedLanguage(newLanguage);
      }
    }
  }, [user, languages]);

  return {
    selectedLanguage,
    setSelectedLanguage,
    availableLanguages: languages,
  };
}