import React, { useState } from 'react';
import { Sparkles, Mail, Lock, Globe, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';
import { getTranslation } from '../utils/translations';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nativeLang, setNativeLang] = useState('한국어');
  const [targetLang, setTargetLang] = useState('영어');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();
  const { locale } = useLocale();
  const t = getTranslation(locale);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, nativeLang, targetLang);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nativeLanguageOptions = locale === 'en' ? [
    { value: '한국어', label: 'Korean', flag: '🇰🇷' },
    { value: 'English', label: 'English', flag: '🇺🇸' },
    { value: '일본어', label: 'Japanese', flag: '🇯🇵' },
    { value: '중국어', label: 'Chinese', flag: '🇨🇳' },
  ] : [
    { value: '한국어', label: '한국어', flag: '🇰🇷' },
    { value: 'English', label: 'English', flag: '🇺🇸' },
    { value: '일본어', label: '日本語', flag: '🇯🇵' },
    { value: '중국어', label: '中文', flag: '🇨🇳' },
  ];

  const targetLanguageOptions = locale === 'en' ? [
    { value: '영어', label: 'English', flag: '🇺🇸' },
    { value: '일본어', label: 'Japanese', flag: '🇯🇵' },
    { value: '중국어', label: 'Chinese', flag: '🇨🇳' },
    { value: '프랑스어', label: 'French', flag: '🇫🇷' },
    { value: '독일어', label: 'German', flag: '🇩🇪' },
    { value: '스페인어', label: 'Spanish', flag: '🇪🇸' },
  ] : [
    { value: '영어', label: 'English', flag: '🇺🇸' },
    { value: '일본어', label: '日本語', flag: '🇯🇵' },
    { value: '중국어', label: '中文', flag: '🇨🇳' },
    { value: '프랑스어', label: 'Français', flag: '🇫🇷' },
    { value: '독일어', label: 'Deutsch', flag: '🇩🇪' },
    { value: '스페인어', label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-300/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 glass-card rounded-2xl">
              <Sparkles className="w-12 h-12 text-accent-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl font-bold neon-text mb-2">{t.auth.appTitle}</h1>
          <h2 className="text-2xl font-bold text-white mb-4">
            {isSignUp ? t.auth.createAccount : t.auth.signIn}
          </h2>
          <p className="text-white/70 text-lg">
            {t.auth.appSubtitle}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="glass-card rounded-2xl p-8 space-y-6 border border-white/20">
            {error && (
              <div className="bg-error-500/20 border border-error-400/30 text-error-300 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                {t.common.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-white/50" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-3 glass-card-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent text-white placeholder-white/50 transition-all duration-300"
                  placeholder={t.auth.emailPlaceholder}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                {t.common.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-white/50" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-3 py-3 glass-card-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent text-white placeholder-white/50 transition-all duration-300"
                  placeholder={t.auth.passwordPlaceholder}
                />
              </div>
            </div>

            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nativeLang" className="block text-sm font-medium text-white/90 mb-2">
                    {t.common.nativeLanguage}
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-5 h-5 text-white/50" />
                    <select
                      id="nativeLang"
                      value={nativeLang}
                      onChange={(e) => setNativeLang(e.target.value)}
                      className="pl-10 w-full px-3 py-3 glass-card-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent text-white bg-transparent"
                    >
                      {nativeLanguageOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-primary-800 text-white">
                          {option.flag} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="targetLang" className="block text-sm font-medium text-white/90 mb-2">
                    {t.common.targetLanguage}
                  </label>
                  <div className="relative">
                    <Star className="absolute left-3 top-3 w-5 h-5 text-white/50" />
                    <select
                      id="targetLang"
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="pl-10 w-full px-3 py-3 glass-card-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent text-white bg-transparent"
                    >
                      {targetLanguageOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-primary-800 text-white">
                          {option.flag} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-accent-500 to-primary-500 hover:from-accent-600 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                isSignUp ? t.auth.createAccount : t.auth.signIn
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-accent-300 hover:text-accent-200 transition-colors duration-200"
              >
                {isSignUp ? t.auth.alreadyHaveAccount : t.auth.noAccount}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}