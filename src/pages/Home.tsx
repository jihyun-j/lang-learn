import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RotateCcw, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDailyProgress } from '../hooks/useDailyProgress';

export function Home() {
  const { user } = useAuth();

  // Get user's target languages
  const targetLanguages = user?.user_metadata?.target_languages || [user?.user_metadata?.target_language || '영어'];
  const languages = Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages];
  
  // Get current selected language from localStorage or default to first language
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const saved = localStorage.getItem('selectedLanguage');
    return saved && languages.includes(saved) ? saved : languages[0] || '영어';
  });

  const { progress, loading } = useDailyProgress(selectedLanguage);

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

  const sentenceProgress = progress.sentenceGoal > 0 ? (progress.todaySentences / progress.sentenceGoal) * 100 : 0;
  const reviewProgress = progress.reviewGoal > 0 ? (progress.todayReviews / progress.reviewGoal) * 100 : 0;

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

      {/* Today's Goal */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedLanguage} 오늘의 목표
          </h3>
          <p className="text-gray-600">매일 꾸준히 학습하여 목표를 달성해보세요</p>
          <div className="mt-3 flex items-center justify-center text-sm text-gray-500">
            <Target className="w-4 h-4 mr-1" />
            <span>프로필에서 목표를 변경할 수 있습니다</span>
          </div>
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
                  <p className="text-sm text-gray-600">목표: {progress.sentenceGoal}개</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : `${progress.todaySentences}/${progress.sentenceGoal}`}
                </p>
                <p className="text-xs text-gray-500">완료</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(sentenceProgress, 100)}%` }}
              ></div>
            </div>
            {sentenceProgress >= 100 && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center text-green-700">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">🎉 오늘 목표 달성!</span>
                </div>
              </div>
            )}
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
                  <p className="text-sm text-gray-600">목표: {progress.reviewGoal}개</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '...' : `${progress.todayReviews}/${progress.reviewGoal}`}
                </p>
                <p className="text-xs text-gray-500">완료</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(reviewProgress, 100)}%` }}
              ></div>
            </div>
            {reviewProgress >= 100 && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center text-green-700">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">🎉 오늘 목표 달성!</span>
                </div>
              </div>
            )}
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