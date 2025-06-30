import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, List, User, LogOut, ChevronDown, Languages } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useLocale } from '../hooks/useLocale';
import { getTranslation } from '../utils/translations';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { selectedLanguage, setSelectedLanguage, availableLanguages } = useLanguage();
  const { locale, changeLocale } = useLocale();
  const t = getTranslation(locale);
  const location = useLocation();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const navigation = [
    { name: t.nav.home, href: '/', icon: Home },
    { name: t.nav.learn, href: '/learn', icon: BookOpen },
    { name: t.nav.review, href: '/review', icon: BookOpen },
    { name: t.nav.sentences, href: '/sentences', icon: List },
    { name: t.nav.profile, href: '/profile', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setIsLanguageDropdownOpen(false);
  };

  // 언어별 국기 이모지 매핑
  const getLanguageFlag = (language: string): string => {
    const flagMap: { [key: string]: string } = {
      '영어': '🇺🇸',
      '일본어': '🇯🇵',
      '중국어': '🇨🇳',
      '프랑스어': '🇫🇷',
      '독일어': '🇩🇪',
      '스페인어': '🇪🇸',
      '이탈리아어': '🇮🇹',
      '러시아어': '🇷🇺',
      '포르투갈어': '🇧🇷',
      '아랍어': '🇸🇦',
      '한국어': '🇰🇷',
      'English': '🇺🇸',
    };
    return flagMap[language] || '🌐';
  };

  // 언어를 영어로 변환하는 함수
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Logo */}
      <div className="fixed top-6 right-6 z-50">
        <div className="bg-white rounded-full shadow-lg p-3 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <img 
            src="/black_circle_360x360.png" 
            alt="LangLearn Logo" 
            className="w-12 h-12 object-contain"
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
            <BookOpen className="w-8 h-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">{t.auth.appTitle}</span>
          </div>

          {/* Language Selector */}
          {availableLanguages.length > 1 && (
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="relative">
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getLanguageFlag(selectedLanguage)}</span>
                    <span>{getLanguageInEnglish(selectedLanguage)}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
                    isLanguageDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {isLanguageDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {availableLanguages.map((language) => (
                      <button
                        key={language}
                        onClick={() => handleLanguageSelect(language)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors flex items-center ${
                          selectedLanguage === language
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        <span className="text-lg mr-2">{getLanguageFlag(language)}</span>
                        <span>{getLanguageInEnglish(language)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Single Language Display */}
          {availableLanguages.length === 1 && (
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 rounded-lg">
                <span className="text-lg mr-2">{getLanguageFlag(selectedLanguage)}</span>
                <span className="text-blue-700">{getLanguageInEnglish(selectedLanguage)}</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* UI Language Toggle */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center mb-2">
              <Languages className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                {locale === 'en' ? 'Interface Language' : '인터페이스 언어'}
              </span>
            </div>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => changeLocale('ko')}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  locale === 'ko'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">🇰🇷</span>
                한국어
              </button>
              <button
                onClick={() => changeLocale('en')}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  locale === 'en'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">🇺🇸</span>
                English
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1 text-gray-400 hover:text-gray-600"
                title={t.nav.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Click outside to close dropdown */}
      {isLanguageDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsLanguageDropdownOpen(false)}
        />
      )}
    </div>
  );
}