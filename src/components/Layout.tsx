import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, List, User, LogOut, ChevronDown, Globe } from 'lucide-react';
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
  const { locale } = useLocale();
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

  // Language options with flags and English names
  const getLanguageOptions = () => {
    const languageMap: { [key: string]: { flag: string; name: string } } = {
      '영어': { flag: '🇺🇸', name: 'English' },
      '일본어': { flag: '🇯🇵', name: 'Japanese' },
      '중국어': { flag: '🇨🇳', name: 'Chinese' },
      '프랑스어': { flag: '🇫🇷', name: 'French' },
      '독일어': { flag: '🇩🇪', name: 'German' },
      '스페인어': { flag: '🇪🇸', name: 'Spanish' },
      '이탈리아어': { flag: '🇮🇹', name: 'Italian' },
      '러시아어': { flag: '🇷🇺', name: 'Russian' },
      '포르투갈어': { flag: '🇧🇷', name: 'Portuguese' },
      '아랍어': { flag: '🇸🇦', name: 'Arabic' },
    };

    return availableLanguages.map(lang => ({
      value: lang,
      flag: languageMap[lang]?.flag || '🌐',
      name: languageMap[lang]?.name || lang,
    }));
  };

  const getCurrentLanguageDisplay = () => {
    const options = getLanguageOptions();
    const current = options.find(opt => opt.value === selectedLanguage);
    return current ? `${current.flag} ${current.name}` : selectedLanguage;
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                    <Globe className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{getCurrentLanguageDisplay()}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
                    isLanguageDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {isLanguageDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {getLanguageOptions().map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleLanguageSelect(option.value)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors flex items-center ${
                          selectedLanguage === option.value
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        <span className="mr-2 text-base">{option.flag}</span>
                        <span>{option.name}</span>
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
                <Globe className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-blue-700">{getCurrentLanguageDisplay()}</span>
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