import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RotateCcw, TrendingUp, Target, Calendar, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface LanguageStats {
  language: string;
  totalSentences: number;
  todayReviews: number;
  averageAccuracy: number;
  streakDays: number;
}

export function Home() {
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
  const [currentStats, setCurrentStats] = useState<LanguageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Get current selected language from localStorage
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const saved = localStorage.getItem('selectedLanguage');
    const targetLanguages = user?.user_metadata?.target_languages || [user?.user_metadata?.target_language || '영어'];
    const languages = Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages];
    return saved && languages.includes(saved) ? saved : languages[0] || '영어';
  });

  useEffect(() => {
    if (user) {
      loadLanguageStats();
    }
  }, [user]);

  useEffect(() => {
    if (selectedLanguage && languageStats.length > 0) {
      const stats = languageStats.find(s => s.language === selectedLanguage);
      setCurrentStats(stats || null);
    }
  }, [selectedLanguage, languageStats]);

  // Listen for language changes from the sidebar
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setSelectedLanguage(event.detail);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const loadLanguageStats = async () => {
    if (!user) return;

    try {
      // Get user's target languages
      const targetLanguages = user.user_metadata?.target_languages || [user.user_metadata?.target_language || '영어'];
      const languages = Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages];

      // Load sentences for all languages
      const { data: allSentences, error: sentencesError } = await supabase
        .from('sentences')
        .select('*')
        .eq('user_id', user.id);

      if (sentencesError) throw sentencesError;

      // Load review sessions
      const { data: allReviews, error: reviewsError } = await supabase
        .from('review_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (reviewsError) throw reviewsError;

      // Calculate stats for each language
      const stats: LanguageStats[] = languages.map(language => {
        // Filter sentences by target language
        const languageSentences = allSentences?.filter(s => s.target_language === language) || [];
        
        // Get review sessions for sentences in this language
        const sentenceIds = languageSentences.map(s => s.id);
        const languageReviews = allReviews?.filter(r => sentenceIds.includes(r.sentence_id)) || [];
        
        // Calculate today's reviews (mock data for demo)
        const todayReviews = Math.floor(Math.random() * 8) + 1;
        
        // Calculate average accuracy
        const averageAccuracy = languageReviews.length > 0 
          ? Math.round(languageReviews.reduce((acc, r) => acc + r.overall_score, 0) / languageReviews.length)
          : Math.floor(Math.random() * 20) + 75;
        
        return {
          language,
          totalSentences: languageSentences.length,
          todayReviews,
          averageAccuracy,
          streakDays: Math.floor(Math.random() * 10) + 3,
        };
      });

      setLanguageStats(stats);
      
      // Set current stats for selected language
      const currentLanguageStats = stats.find(s => s.language === selectedLanguage);
      if (currentLanguageStats) {
        setCurrentStats(currentLanguageStats);
      } else if (stats.length > 0) {
        setCurrentStats(stats[0]);
        setSelectedLanguage(stats[0].language);
        localStorage.setItem('selectedLanguage', stats[0].language);
      }
    } catch (error) {
      console.error('Failed to load language stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          안녕하세요! 👋
        </h1>
        <p className="text-xl text-gray-600">
          AI와 함께 스마트하게 언어를 학습해보세요
        </p>
      </div>

      {/* Current Language Display */}
      {currentStats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-6">
          <div className="flex items-center justify-center">
            <Globe className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">
              현재 학습 언어: <span className="text-blue-600">{currentStats.language}</span>
            </h2>
          </div>
          <p className="text-center text-gray-600 mt-2">
            사이드바에서 다른 언어로 변경할 수 있습니다
          </p>
        </div>
      )}

      {/* Stats Overview */}
      {currentStats && (
        <div>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentStats.language} 학습 현황
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">학습한 문장</p>
                  <p className="text-3xl font-bold text-gray-900">{currentStats.totalSentences}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">오늘 복습</p>
                  <p className="text-3xl font-bold text-gray-900">{currentStats.todayReviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">평균 정확도</p>
                  <p className="text-3xl font-bold text-gray-900">{currentStats.averageAccuracy}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">연속 학습</p>
                  <p className="text-3xl font-bold text-gray-900">{currentStats.streakDays}일</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Goal */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedLanguage ? `${selectedLanguage} 오늘의 목표` : '오늘의 목표'}
          </h3>
          <p className="text-gray-600">매일 꾸준히 학습하여 목표를 달성해보세요</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* New Sentences Goal */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">새 문장 학습</h4>
                  <p className="text-sm text-gray-600">목표: 3개</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">1/3</p>
                <p className="text-xs text-gray-500">완료</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '33%' }}></div>
            </div>
            <div className="mt-4">
              <Link
                to="/learn"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                학습하러 가기
              </Link>
            </div>
          </div>

          {/* Review Goal */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">복습하기</h4>
                  <p className="text-sm text-gray-600">목표: 5개</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">3/5</p>
                <p className="text-xs text-gray-500">완료</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <div className="mt-4">
              <Link
                to="/review"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                복습하러 가기
              </Link>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">이번 주 진도</h4>
          <div className="grid grid-cols-7 gap-2">
            {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => {
              const isCompleted = index < 4; // Mock data - first 4 days completed
              const isToday = index === 4; // Mock data - today is Friday
              
              return (
                <div key={day} className="text-center">
                  <p className="text-xs text-gray-600 mb-2">{day}</p>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isToday 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-green-600">4일</span> 연속 학습 중! 🔥
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}