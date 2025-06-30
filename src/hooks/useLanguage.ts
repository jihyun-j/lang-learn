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

  // Convert Korean language names to English
  const getLanguageInEnglish = (language: string): string => {
    const languageMap: { [key: string]: string } = {
      '영어': 'English',
      '일본어': 'Japanese',
      '중국어': 'Chinese',
      '프랑스어': 'French',
      '독일어': 'German',
      '스페인어': 'Spanish',
      '이탈리아어': 'Italian',
      '러시아어': 'Russian',
      '포르투갈어': 'Portuguese',
      '아랍어': 'Arabic',
      '한국어': 'Korean',
      'English': 'English',
    };
    return languageMap[language] || language;
  };

  return {
    selectedLanguage,
    selectedLanguageInEnglish: getLanguageInEnglish(selectedLanguage), // 새로 추가된 영어 표기
    setSelectedLanguage,
    availableLanguages: languages,
    getLanguageInEnglish, // 유틸리티 함수로 제공
  };
}