import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RotateCcw, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export function Home() {
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  const [todaySentences, setTodaySentences] = useState(0);
  const [todayReviews, setTodayReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && selectedLanguage) {
      loadTodayStats();
    }
  }, [user, selectedLanguage]);

  const loadTodayStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Load today's sentences for selected language
      const { data: todaySentencesData } = await supabase
        .from('sentences')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_language', selectedLanguage)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Load today's reviews for selected language
      const { data: reviewsData } = await supabase
        .from('review_sessions')
        .select('id, sentence_id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Filter reviews by language (need to join with sentences)
      let todayReviewsCount = 0;
      if (reviewsData && reviewsData.length > 0) {
        const sentenceIds = reviewsData.map(r => r.sentence_id);
        const { data: reviewSentences } = await supabase
          .from('sentences')
          .select('id')
          .eq('target_language', selectedLanguage)
          .in('id', sentenceIds);

        todayReviewsCount = reviewSentences?.length || 0;
      }

      setTodaySentences(todaySentencesData?.length || 0);
      setTodayReviews(todayReviewsCount);
    } catch (error) {
      console.error('Failed to load today stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <Globe className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            현재 학습 언어: <span className="text-blue-600">{selectedLanguage}</span>
          </h2>
        </div>
        <p className="text-center text-gray-600 mt-2">
          사이드바에서 다른 언어로 변경할 수 있습니다
        </p>
      </div>

      {/* Today's Activity */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedLanguage} 오늘의 학습 현황
          </h3>
          <p className="text-gray-600">오늘 하루 동안의 학습 활동을 확인해보세요</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Today's New Sentences */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-blue-900">새 문장 학습</h4>
                  <p className="text-sm text-blue-700">오늘 새롭게 추가한 문장</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : todaySentences}
                </p>
                <p className="text-sm text-blue-700">개</p>
              </div>
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

          {/* Today's Reviews */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-green-900">복습하기</h4>
                  <p className="text-sm text-green-700">오늘 복습한 문장</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  {loading ? '...' : todayReviews}
                </p>
                <p className="text-sm text-green-700">개</p>
              </div>
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
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
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