import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type Locale = 'ko' | 'en';

export function useLocale() {
  const { user } = useAuth();
  
  // Get user's native language and determine locale
  const getUserLocale = (): Locale => {
    if (!user) return 'ko'; // Default to Korean
    
    const nativeLanguage = user.user_metadata?.native_language || '한국어';
    
    // Map native languages to locales
    if (nativeLanguage === 'English' || nativeLanguage === '영어' && user.user_metadata?.native_language === 'English') {
      return 'en';
    }
    
    return 'ko'; // Default to Korean for all other languages
  };

  const [locale, setLocale] = useState<Locale>(getUserLocale());

  // Update locale when user changes
  useEffect(() => {
    if (user) {
      const newLocale = getUserLocale();
      setLocale(newLocale);
    }
  }, [user]);

  return {
    locale,
    isKorean: locale === 'ko',
    isEnglish: locale === 'en',
  };
}