import { useState, useEffect } from 'react';

export type Locale = 'ko' | 'en';

export function useLocale() {
  // Get locale from localStorage or default to Korean
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('ui-locale');
    return (saved === 'en' || saved === 'ko') ? saved : 'ko';
  });

  // Update localStorage when locale changes
  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('ui-locale', newLocale);
    
    // Dispatch global event to notify all components
    window.dispatchEvent(new CustomEvent('localeChanged', { detail: newLocale }));
  };

  // Listen for locale changes from other components
  useEffect(() => {
    const handleLocaleChange = (event: CustomEvent) => {
      setLocale(event.detail);
    };

    window.addEventListener('localeChanged', handleLocaleChange as EventListener);
    return () => {
      window.removeEventListener('localeChanged', handleLocaleChange as EventListener);
    };
  }, []);

  return {
    locale,
    changeLocale,
    isKorean: locale === 'ko',
    isEnglish: locale === 'en',
  };
}