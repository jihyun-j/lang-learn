import React, { useState } from 'react';
import { BookOpen, Mail, Lock, Globe } from 'lucide-react';
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
    { value: '한국어', label: 'Korean' },
    { value: 'English', label: 'English' },
    { value: '일본어', label: 'Japanese' },
    { value: '중국어', label: 'Chinese' },
  ] : [
    { value: '한국어', label: '한국어' },
    { value: 'English', label: 'English' },
    { value: '일본어', label: '日本語' },
    { value: '중국어', label: '中文' },
  ];

  const targetLanguageOptions = locale === 'en' ? [
    { value: '영어', label: 'English' },
    { value: '일본어', label: 'Japanese' },
    { value: '중국어', label: 'Chinese' },
    { value: '프랑스어', label: 'French' },
    { value: '독일어', label: 'German' },
    { value: '스페인어', label: 'Spanish' },
  ] : [
    { value: '영어', label: 'English' },
    { value: '일본어', label: '日本語' },
    { value: '중국어', label: '中文' },
    { value: '프랑스어', label: 'Français' },
    { value: '독일어', label: 'Deutsch' },
    { value: '스페인어', label: 'Español' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-blue-600" />
            <span className="ml-2 text-3xl font-bold text-gray-900">{t.auth.appTitle}</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSignUp ? t.auth.createAccount : t.auth.signIn}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t.auth.appSubtitle}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t.common.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t.auth.emailPlaceholder}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t.common.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t.auth.passwordPlaceholder}
                />
              </div>
            </div>

            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nativeLang" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.common.nativeLanguage}
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                      id="nativeLang"
                      value={nativeLang}
                      onChange={(e) => setNativeLang(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {nativeLanguageOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="targetLang" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.common.targetLanguage}
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                      id="targetLang"
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {targetLanguageOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t.auth.processing : (isSignUp ? t.auth.createAccount : t.auth.signIn)}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 hover:text-blue-500"
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