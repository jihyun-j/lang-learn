import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RotateCcw, Globe, Check, Brain, Zap, Sparkles, TrendingUp } from 'lucide-react';
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
      return <Zap className="w-3 h-3 text-accent-400" />;
    } else if (sentences > 0) {
      // Only learning
      return <BookOpen className="w-3 h-3 text-primary-400" />;
    } else if (reviews > 0) {
      // Only review
      return <Brain className="w-3 h-3 text-accent-400" />;
    }
    return null;
  };

  const getActivityColor = (date: Date, sentences: number, reviews: number) => {
    const today = isToday(date);
    const hasActivity = sentences > 0 || reviews > 0;

    if (today) {
      return hasActivity 
        ? 'bg-gradient-to-r from-accent-500 to-primary-500 text-white ring-4 ring-accent-400/30 shadow-2xl scale-110 animate-glow' 
        : 'bg-gradient-to-r from-accent-500 to-primary-500 text-white ring-4 ring-accent-400/30 shadow-2xl scale-110';
    } else if (hasActivity) {
      if (sentences > 0 && reviews > 0) {
        return 'bg-gradient-to-r from-accent-400 to-primary-400 text-white shadow-xl';
      } else if (sentences > 0) {
        return 'bg-primary-500 text-white shadow-xl';
      } else {
        return 'bg-accent-500 text-white shadow-xl';
      }
    } else {
      return 'bg-white/10 text-white/60 backdrop-blur-sm';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-400/10 to-primary-400/10 rounded-3xl blur-3xl"></div>
        <div className="relative glass-card rounded-3xl p-8 border border-white/20">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-12 h-12 text-accent-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold neon-text mb-4">
            {t.home.welcome}
          </h1>
          <p className="text-xl text-white/80">
            {t.home.subtitle}
          </p>
        </div>
      </div>

      {/* Current Language Display */}
      <div className="glass-card rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-center">
          <Globe className="w-6 h-6 text-accent-400 mr-3" />
          <h2 className="text-2xl font-bold text-white">
            {t.home.currentLanguage} <span className="neon-text">{selectedLanguage}</span>
          </h2>
        </div>
        <p className="text-center text-white/70 mt-2">
          {t.home.changeLanguageHint}
        </p>
      </div>

      {/* Today's Activity */}
      <div className="glass-card rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">
            {selectedLanguage} {t.home.todayActivity}
          </h3>
          <p className="text-white/70">{t.home.todayActivitySubtitle}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Today's New Sentences */}
          <div className="glass-card-light rounded-xl p-6 border border-primary-400/30 hover:border-primary-400/50 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-white">{t.home.newSentences}</h4>
                  <p className="text-sm text-white/70">{t.home.newSentencesDesc}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-300">
                  {loading ? '...' : todaySentences}
                </p>
                <p className="text-sm text-white/70">{locale === 'en' ? 'sentences' : '개'}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/learn"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-400 text-white rounded-lg hover:from-primary-600 hover:to-primary-500 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {t.home.goToLearn}
              </Link>
            </div>
          </div>

          {/* Today's Reviews */}
          <div className="glass-card-light rounded-xl p-6 border border-accent-400/30 hover:border-accent-400/50 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-400 rounded-full flex items-center justify-center shadow-lg">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-white">{t.home.review}</h4>
                  <p className="text-sm text-white/70">{t.home.reviewDesc}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-accent-300">
                  {loading ? '...' : todayReviews}
                </p>
                <p className="text-sm text-white/70">{locale === 'en' ? 'sentences' : '개'}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/review"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-400 text-white rounded-lg hover:from-accent-600 hover:to-accent-500 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t.home.goToReview}
              </Link>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="mt-8 glass-card-light rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-semibold text-white mb-6 text-center flex items-center justify-center">
            <TrendingUp className="w-5 h-5 mr-2 text-accent-400" />
            {t.home.weeklyProgress}
          </h4>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3">
              {weeklyActivity.map((day, index) => {
                const today = isToday(day.date);
                const hasActivity = day.sentences > 0 || day.reviews > 0;
                const activityIcon = getActivityIcon(day.sentences, day.reviews);
                
                return (
                  <div key={index} className="text-center">
                    <p className="text-xs text-white/70 mb-2 font-medium">
                      {getDayLabel(day.date)}
                    </p>
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        getActivityColor(day.date, day.sentences, day.reviews)
                      }`}>
                        {getDayNumber(day.date)}
                      </div>
                      
                      {/* Activity indicator */}
                      {activityIcon && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/30">
                          {activityIcon}
                        </div>
                      )}
                      
                      {/* Today indicator */}
                      {today && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-400 rounded-full animate-pulse shadow-lg"></div>
                      )}
                    </div>
                    
                    {/* Activity details */}
                    {hasActivity && (
                      <div className="mt-2 text-xs space-y-1">
                        {day.sentences > 0 && (
                          <div className="flex items-center justify-center text-primary-300">
                            <BookOpen className="w-3 h-3 mr-1" />
                            <span>{day.sentences}</span>
                          </div>
                        )}
                        {day.reviews > 0 && (
                          <div className="flex items-center justify-center text-accent-300">
                            <Brain className="w-3 h-3 mr-1" />
                            <span>{day.reviews}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center glass-card-light px-3 py-1 rounded-full">
              <div className="w-4 h-4 bg-primary-500 rounded-full mr-2"></div>
              <BookOpen className="w-3 h-3 mr-1 text-primary-400" />
              <span className="text-white/80">{t.home.newSentences}</span>
            </div>
            <div className="flex items-center glass-card-light px-3 py-1 rounded-full">
              <div className="w-4 h-4 bg-accent-500 rounded-full mr-2"></div>
              <Brain className="w-3 h-3 mr-1 text-accent-400" />
              <span className="text-white/80">{t.home.review}</span>
            </div>
            <div className="flex items-center glass-card-light px-3 py-1 rounded-full">
              <div className="w-4 h-4 bg-gradient-to-r from-accent-500 to-primary-500 rounded-full mr-2"></div>
              <Zap className="w-3 h-3 mr-1 text-accent-400" />
              <span className="text-white/80">{locale === 'en' ? 'Both' : '둘 다'}</span>
            </div>
            <div className="flex items-center glass-card-light px-3 py-1 rounded-full">
              <div className="w-3 h-3 bg-accent-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-white/80">{locale === 'en' ? 'Today' : '오늘'}</span>
            </div>
          </div>
          
          {/* Weekly summary */}
          <div className="mt-4 text-center">
            <p className="text-sm text-white/70">
              <span className="font-medium text-primary-300">
                {weeklyActivity.reduce((acc, day) => acc + day.sentences, 0)}{locale === 'en' ? ' sentences learned' : '개 문장 학습'}
              </span>
              {' • '}
              <span className="font-medium text-accent-300">
                {weeklyActivity.reduce((acc, day) => acc + day.reviews, 0)}{locale === 'en' ? ' reviews completed' : '회 복습 완료'}
              </span>
              {' • '}
              <span className="font-medium text-white">
                {weeklyActivity.filter(day => day.sentences > 0 || day.reviews > 0).length}{locale === 'en' ? ' active days' : '일 활동'} 🔥
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}