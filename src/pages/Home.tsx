import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RotateCcw, Globe, Check, Brain, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useLocale } from '../hooks/useLocale';
import { getTranslation } from '../utils/translations';
import { supabase } from '../lib/supabase';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

export function Home() {
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  const { locale } = useLocale();
  const t = getTranslation(locale);
  const [todaySentences, setTodaySentences] = useState(0);
  const [todayReviews, setTodayReviews] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState<Array<{
    date: Date;
    sentences: number;
    reviews: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && selectedLanguage) {
      loadTodayStats();
      loadWeeklyActivity();
    }
  }, [user, selectedLanguage]);

  const loadTodayStats = async () => {
    if (!user) return;

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
    }
  };

  const loadWeeklyActivity = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start from Monday
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const weeklyData = await Promise.all(
        weekDays.map(async (day) => {
          const dayStr = format(day, 'yyyy-MM-dd');

          // Get sentences for this day
          const { data: daySentences } = await supabase
            .from('sentences')
            .select('id')
            .eq('user_id', user.id)
            .eq('target_language', selectedLanguage)
            .gte('created_at', `${dayStr}T00:00:00.000Z`)
            .lt('created_at', `${dayStr}T23:59:59.999Z`);

          // Get reviews for this day
          const { data: dayReviewsData } = await supabase
            .from('review_sessions')
            .select('id, sentence_id')
            .eq('user_id', user.id)
            .gte('created_at', `${dayStr}T00:00:00.000Z`)
            .lt('created_at', `${dayStr}T23:59:59.999Z`);

          // Filter reviews by language
          let dayReviewsCount = 0;
          if (dayReviewsData && dayReviewsData.length > 0) {
            const sentenceIds = dayReviewsData.map(r => r.sentence_id);
            const { data: reviewSentences } = await supabase
              .from('sentences')
              .select('id')
              .eq('target_language', selectedLanguage)
              .in('id', sentenceIds);

            dayReviewsCount = reviewSentences?.length || 0;
          }

          return {
            date: day,
            sentences: daySentences?.length || 0,
            reviews: dayReviewsCount,
          };
        })
      );

      setWeeklyActivity(weeklyData);
    } catch (error) {
      console.error('Failed to load weekly activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayLabel = (date: Date) => {
    if (locale === 'en') {
      return format(date, 'EEE'); // Mon, Tue, Wed...
    } else {
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      return dayNames[date.getDay()];
    }
  };

  const getDayNumber = (date: Date) => {
    return format(date, 'd');
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const getActivityIcon = (sentences: number, reviews: number) => {
    if (sentences > 0 && reviews > 0) {
      // Both learning and review
      return <Zap className="w-3 h-3 text-purple-600" />;
    } else if (sentences > 0) {
      // Only learning
      return <BookOpen className="w-3 h-3 text-blue-600" />;
    } else if (reviews > 0) {
      // Only review
      return <Brain className="w-3 h-3 text-green-600" />;
    }
    return null;
  };

  const getActivityColor = (date: Date, sentences: number, reviews: number) => {
    const today = isToday(date);
    const hasActivity = sentences > 0 || reviews > 0;
    const bothCompleted = sentences > 0 && reviews > 0;

    if (today) {
      return 'bg-blue-500 text-white ring-4 ring-blue-200 shadow-lg scale-110';
    } else if (bothCompleted) {
      return 'bg-white text-gray-900 shadow-md border-2 border-green-500';
    } else if (hasActivity) {
      return 'bg-gray-200 text-gray-900 shadow-md';
    } else {
      return 'bg-gray-200 text-gray-600';
    }
  };

  const renderDayContent = (date: Date, sentences: number, reviews: number) => {
    const today = isToday(date);
    const bothCompleted = sentences > 0 && reviews > 0;

    if (today) {
      return getDayNumber(date);
    } else if (bothCompleted) {
      return <Check className="w-6 h-6 text-green-500" />;
    } else {
      return getDayNumber(date);
    }
  };

  const renderActivityDetails = (date: Date, sentences: number, reviews: number) => {
    const today = isToday(date);
    const hasActivity = sentences > 0 || reviews > 0;
    const bothCompleted = sentences > 0 && reviews > 0;

    if (today || bothCompleted || !hasActivity) {
      return null;
    }

    return (
      <div className="mt-2 text-xs space-y-1">
        {sentences > 0 && (
          <div className="flex items-center justify-center text-blue-600">
            <BookOpen className="w-3 h-3 mr-1" />
            <span>{sentences}</span>
          </div>
        )}
        {reviews > 0 && (
          <div className="flex items-center justify-center text-green-600">
            <Brain className="w-3 h-3 mr-1" />
            <span>{reviews}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t.home.welcome}
        </h1>
        <p className="text-xl text-gray-600">
          {t.home.subtitle}
        </p>
      </div>

      {/* Today's Activity */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedLanguage} {t.home.todayActivity}
          </h3>
          <p className="text-gray-600">{t.home.todayActivitySubtitle}</p>
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
                  <h4 className="text-lg font-semibold text-blue-900">{t.home.newSentences}</h4>
                  <p className="text-sm text-blue-700">{t.home.newSentencesDesc}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : todaySentences}
                </p>
                <p className="text-sm text-blue-700">{locale === 'en' ? 'sentences' : '개'}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/learn"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {t.home.goToLearn}
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
                  <h4 className="text-lg font-semibold text-green-900">{t.home.review}</h4>
                  <p className="text-sm text-green-700">{t.home.reviewDesc}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  {loading ? '...' : todayReviews}
                </p>
                <p className="text-sm text-green-700">{locale === 'en' ? 'sentences' : '개'}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/review"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t.home.goToReview}
              </Link>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6 text-center">{t.home.weeklyProgress}</h4>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3">
              {weeklyActivity.map((day, index) => {
                const today = isToday(day.date);
                const hasActivity = day.sentences > 0 || day.reviews > 0;
                const bothCompleted = day.sentences > 0 && day.reviews > 0;
                
                return (
                  <div key={index} className="text-center flex flex-col items-center justify-center">
                    <p className="text-xs text-gray-600 mb-2 font-medium">
                      {getDayLabel(day.date)}
                    </p>
                    <div className="relative flex items-center justify-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        getActivityColor(day.date, day.sentences, day.reviews)
                      }`}>
                        {renderDayContent(day.date, day.sentences, day.reviews)}
                      </div>
                      
                      {/* Today indicator */}
                      {today && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    
                    {/* Activity details */}
                    {renderActivityDetails(day.date, day.sentences, day.reviews)}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <BookOpen className="w-3 h-3 mr-1 text-blue-600" />
              <span className="text-gray-600">{t.home.newSentences}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <Brain className="w-3 h-3 mr-1 text-green-600" />
              <span className="text-gray-600">{t.home.review}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border-2 border-green-500 rounded-full mr-2 flex items-center justify-center">
                <Check className="w-2 h-2 text-green-500" />
              </div>
              <span className="text-gray-600">{locale === 'en' ? 'Both Completed' : '둘 다 완료'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-gray-600">{locale === 'en' ? 'Today' : '오늘'}</span>
            </div>
          </div>
          
          {/* Weekly summary */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">
                {weeklyActivity.reduce((acc, day) => acc + day.sentences, 0)}{locale === 'en' ? ' sentences learned' : '개 문장 학습'}
              </span>
              {' • '}
              <span className="font-medium text-green-600">
                {weeklyActivity.reduce((acc, day) => acc + day.reviews, 0)}{locale === 'en' ? ' reviews completed' : '회 복습 완료'}
              </span>
              {' • '}
              <span className="font-medium text-purple-600">
                {weeklyActivity.filter(day => day.sentences > 0 || day.reviews > 0).length}{locale === 'en' ? ' active days' : '일 활동'} 🔥
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}