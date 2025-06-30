import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, List, User, LogOut, ChevronDown, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-primary-blue-900 via-primary-blue-800 to-primary-blue-950">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64">
        <div className="flex flex-col h-full glass-card-light rounded-r-3xl border-r border-white/20">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-accent-green-500 to-primary-blue-500 rounded-tr-3xl">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
            <span className="ml-2 text-xl font-bold text-white">{t.auth.appTitle}</span>
          </div>

          {/* Language Selector */}
          {availableLanguages.length > 1 && (
            <div className="px-4 py-3 border-b border-white/10">
              <div className="relative">
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-white/90 glass-button rounded-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center">
                    <span>{getCurrentLanguageDisplay()}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${
                    isLanguageDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {isLanguageDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-lg shadow-2xl z-10 border border-white/20">
                    {getLanguageOptions().map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleLanguageSelect(option.value)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-all duration-200 flex items-center ${
                          selectedLanguage === option.value
                            ? 'bg-accent-green-500/20 text-accent-green-300 font-medium'
                            : 'text-white/80 hover:text-white'
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
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center px-3 py-2 text-sm font-medium text-accent-green-300 bg-accent-green-500/20 rounded-lg border border-accent-green-400/30">
                <span>{getCurrentLanguageDisplay()}</span>
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
                  className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-green-500/30 to-primary-blue-500/30 text-white border border-accent-green-400/30 shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10 hover:scale-105'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-accent-green-300' : ''
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center glass-card-light rounded-xl p-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-accent-green-400 to-primary-blue-400 rounded-full">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white/90 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110"
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