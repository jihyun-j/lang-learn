import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { User, Edit3, Save, X, Globe, BookOpen, TrendingUp, Target, Calendar, Award, Clock, Zap, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useLocale } from '../hooks/useLocale';
import { getTranslation } from '../utils/translations';
import { getUserProgress, UserProgressData } from '../utils/userProgress';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

interface ProfileStats {
  totalSentences: number;
  totalReviews: number;
  averageAccuracy: number;
  streakDays: number;
  totalStudyTime: number;
  weeklyData: Array<{
    day: string;
    sentences: number;
    reviews: number;
    accuracy: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    sentences: number;
    reviews: number;
  }>;
  difficultyDistribution: Array<{
    difficulty: string;
    count: number;
    percentage: number;
    level: 'easy' | 'medium' | 'hard';
  }>;
  recentActivity: Array<{
    date: string;
    type: string;
    sentence: string;
    score?: number;
  }>;
}

interface UserProfile {
  email: string;
  native_language: string;
  target_languages: string[];
  created_at: string;
}

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    native_language: '',
    target_languages: [''],
  });
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const { user } = useAuth();
  const { selectedLanguage, selectedLanguageInEnglish } = useLanguage();
  const { locale } = useLocale();
  const t = getTranslation(locale);

  const availableLanguages = [
    '영어', '일본어', '중국어', '프랑스어', '독일어', '스페인어', '이탈리아어', '러시아어', '포르투갈어', '아랍어'
  ];

  // Colors for the pie chart - matching difficulty button colors
  const DIFFICULTY_COLORS = {
    easy: '#10B981',    // Green-500 (matches easy button)
    medium: '#F59E0B',  // Amber-500 (matches medium button)
    hard: '#EF4444'     // Red-500 (matches hard button)
  };

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadStatsData();
      loadUserProgress();
    }
  }, [user, timeRange, selectedLanguage]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      // Get user metadata from auth
      const targetLanguages = user.user_metadata?.target_languages || [user.user_metadata?.target_language || '영어'];
      
      const userProfile = {
        email: user.email || '',
        native_language: user.user_metadata?.native_language || '한국어',
        target_languages: Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages],
        created_at: user.created_at || '',
      };

      setProfile(userProfile);
      setEditForm({
        native_language: userProfile.native_language,
        target_languages: userProfile.target_languages.length > 0 ? userProfile.target_languages : [''],
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadUserProgress = async () => {
    if (!user) return;

    try {
      const progressData = await getUserProgress(user.id);
      setUserProgress(progressData);
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  const loadStatsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load sentences for selected language
      const { data: sentences, error: sentencesError } = await supabase
        .from('sentences')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_language', selectedLanguage);

      if (sentencesError) throw sentencesError;

      // Load review sessions for selected language
      const { data: reviews, error: reviewsError } = await supabase
        .from('review_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Filter reviews by language (need to join with sentences)
      let languageReviews = reviews || [];
      if (reviews && reviews.length > 0) {
        const sentenceIds = sentences?.map(s => s.id) || [];
        languageReviews = reviews.filter(r => sentenceIds.includes(r.sentence_id));
      }

      // Calculate basic stats
      const totalSentences = sentences?.length || 0;
      const totalReviews = languageReviews.length;
      const averageAccuracy = languageReviews.length > 0 
        ? Math.round(languageReviews.reduce((acc, r) => acc + r.overall_score, 0) / languageReviews.length)
        : 0;

      // Generate weekly data
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      const weeklyData = weekDays.map(day => {
        const dayStr = locale === 'en' ? format(day, 'EEE') : format(day, 'EEE');
        const daySentences = sentences?.filter(s => 
          format(new Date(s.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        ).length || 0;
        
        const dayReviews = languageReviews.filter(r => 
          format(new Date(r.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        ) || [];
        
        const dayAccuracy = dayReviews.length > 0 
          ? Math.round(dayReviews.reduce((acc, r) => acc + r.overall_score, 0) / dayReviews.length)
          : 0;

        return {
          day: dayStr,
          sentences: daySentences,
          reviews: dayReviews.length,
          accuracy: dayAccuracy,
        };
      });

      // Generate real monthly progress data
      const monthsToShow = 6;
      const endDate = new Date();
      const startDate = subMonths(endDate, monthsToShow - 1);
      const months = eachMonthOfInterval({ start: startOfMonth(startDate), end: endOfMonth(endDate) });

      const monthlyProgress = await Promise.all(
        months.map(async (month) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          
          // Get sentences for this month
          const monthSentences = sentences?.filter(s => {
            const sentenceDate = new Date(s.created_at);
            return sentenceDate >= monthStart && sentenceDate <= monthEnd;
          }).length || 0;

          // Get reviews for this month
          const monthReviews = languageReviews.filter(r => {
            const reviewDate = new Date(r.created_at);
            return reviewDate >= monthStart && reviewDate <= monthEnd;
          }).length || 0;

          return {
            month: locale === 'en' ? format(month, 'MMM') : format(month, 'M월'),
            sentences: monthSentences,
            reviews: monthReviews,
          };
        })
      );

      // Generate difficulty distribution with real data and proper color mapping
      const easyCount = sentences?.filter(s => s.difficulty === 'easy').length || 0;
      const mediumCount = sentences?.filter(s => s.difficulty === 'medium').length || 0;
      const hardCount = sentences?.filter(s => s.difficulty === 'hard').length || 0;
      const total = easyCount + mediumCount + hardCount;

      const difficultyDistribution = [
        { 
          difficulty: t.common.easy, 
          count: easyCount,
          percentage: total > 0 ? Math.round((easyCount / total) * 100) : 0,
          level: 'easy' as const
        },
        { 
          difficulty: t.common.medium, 
          count: mediumCount,
          percentage: total > 0 ? Math.round((mediumCount / total) * 100) : 0,
          level: 'medium' as const
        },
        { 
          difficulty: t.common.hard, 
          count: hardCount,
          percentage: total > 0 ? Math.round((hardCount / total) * 100) : 0,
          level: 'hard' as const
        },
      ];

      // Generate recent activity from real data
      const recentActivity = [
        // Recent sentences
        ...sentences?.slice(-5).reverse().map(s => ({
          date: format(new Date(s.created_at), 'MM.dd'),
          type: t.profile.newSentence,
          sentence: s.english_text.length > 50 ? s.english_text.substring(0, 50) + '...' : s.english_text,
        })) || [],
        // Recent reviews
        ...languageReviews.slice(0, 5).map(r => {
          const sentence = sentences?.find(s => s.id === r.sentence_id);
          return {
            date: format(new Date(r.created_at), 'MM.dd'),
            type: t.profile.review,
            sentence: sentence ? (sentence.english_text.length > 50 ? sentence.english_text.substring(0, 50) + '...' : sentence.english_text) : t.profile.pronunciationPractice,
            score: r.overall_score,
          };
        }) || [],
      ].sort((a, b) => {
        // Sort by date (most recent first)
        const dateA = new Date(`2024.${a.date}`);
        const dateB = new Date(`2024.${b.date}`);
        return dateB.getTime() - dateA.getTime();
      }).slice(0, 8); // Show only 8 most recent activities

      setStats({
        totalSentences,
        totalReviews,
        averageAccuracy,
        streakDays: userProgress?.current_streak || 0,
        totalStudyTime: userProgress?.total_study_time || 0,
        weeklyData,
        monthlyProgress,
        difficultyDistribution,
        recentActivity,
      });
    } catch (error) {
      console.error('Failed to load stats data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Filter out empty languages and ensure max 3 languages
    const validLanguages = editForm.target_languages.filter(lang => lang.trim() !== '').slice(0, 3);
    
    if (validLanguages.length === 0) {
      alert(t.profile.selectAtLeastOne);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          native_language: editForm.native_language,
          target_languages: validLanguages,
        }
      });

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        native_language: editForm.native_language,
        target_languages: validLanguages,
      } : null);

      setEditing(false);
      alert(t.profile.profileUpdateSuccess);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(t.profile.profileUpdateFailed);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        native_language: profile.native_language,
        target_languages: profile.target_languages.length > 0 ? profile.target_languages : [''],
      });
    }
    setEditing(false);
  };

  const addLanguage = () => {
    if (editForm.target_languages.length < 3) {
      setEditForm(prev => ({
        ...prev,
        target_languages: [...prev.target_languages, '']
      }));
    }
  };

  const removeLanguage = (index: number) => {
    if (editForm.target_languages.length > 1) {
      setEditForm(prev => ({
        ...prev,
        target_languages: prev.target_languages.filter((_, i) => i !== index)
      }));
    }
  };

  const updateLanguage = (index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      target_languages: prev.target_languages.map((lang, i) => i === index ? value : lang)
    }));
  };

  // Custom tooltip for difficulty chart
  const DifficultyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`${data.difficulty}`}</p>
          <p className="text-sm text-gray-600">
            {`${locale === 'en' ? 'Count' : '개수'}: ${data.count}${locale === 'en' ? ' sentences' : '개'}`}
          </p>
          <p className="text-sm text-gray-600">
            {`${locale === 'en' ? 'Percentage' : '비율'}: ${data.percentage}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, difficulty }: any) => {
    if (percent === 0) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading || !profile || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-blue-100 rounded-full">
            <User className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t.profile.title}</h1>
        <p className="mt-2 text-lg text-gray-600">{t.profile.subtitle}</p>
      </div>

      {/* Current Language Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <Globe className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            {t.profile.currentLanguage} <span className="text-blue-600">{selectedLanguageInEnglish}</span>
          </h2>
        </div>
        <p className="text-center text-gray-600 mt-2">
          {t.profile.currentLanguageDesc}
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{t.profile.personalInfo}</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {t.profile.edit}
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveProfile}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {t.profile.save}
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                {t.profile.cancel}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.profile.email}</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-900">{profile.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.profile.joinDate}</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-900">{format(new Date(profile.created_at), locale === 'en' ? 'MMM dd, yyyy' : 'yyyy년 MM월 dd일')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.profile.nativeLanguage}</label>
            {editing ? (
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <select
                  value={editForm.native_language}
                  onChange={(e) => setEditForm(prev => ({ ...prev, native_language: e.target.value }))}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="한국어">{locale === 'en' ? 'Korean' : '한국어'}</option>
                  <option value="English">English</option>
                  <option value="일본어">{locale === 'en' ? 'Japanese' : '日本語'}</option>
                  <option value="중국어">{locale === 'en' ? 'Chinese' : '中文'}</option>
                </select>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900">{profile.native_language}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.profile.targetLanguages} {t.profile.maxLanguages}
            </label>
            {editing ? (
              <div className="space-y-3">
                {editForm.target_languages.map((language, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <select
                        value={language}
                        onChange={(e) => updateLanguage(index, e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{t.profile.selectLanguage}</option>
                        {availableLanguages.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                    {editForm.target_languages.length > 1 && (
                      <button
                        onClick={() => removeLanguage(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {editForm.target_languages.length < 3 && (
                  <button
                    onClick={addLanguage}
                    className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t.profile.addLanguage}
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {profile.target_languages.map((language, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Learning Statistics Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{selectedLanguageInEnglish} {t.profile.learningStats}</h2>
          <p className="mt-1 text-gray-600">{t.profile.learningStatsDesc}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex rounded-lg bg-gray-100 p-1">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === 'week' ? (locale === 'en' ? 'Weekly' : '주간') : 
                 range === 'month' ? (locale === 'en' ? 'Monthly' : '월간') : 
                 (locale === 'en' ? 'Yearly' : '연간')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.profile.totalSentences}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSentences}</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.totalSentences > 0 ? `+${Math.min(3, stats.totalSentences)} ${t.profile.thisWeek}` : `0 ${t.profile.thisWeek}`}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.profile.totalReviews}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.totalReviews > 0 ? `+${Math.min(12, stats.totalReviews)} ${t.profile.thisWeek}` : `0 ${t.profile.thisWeek}`}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.profile.averageAccuracy}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageAccuracy}%</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.averageAccuracy > 75 ? `+5% ${t.profile.lastWeek}` : (locale === 'en' ? 'Keep practicing!' : '계속 연습하세요!')}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.profile.consecutiveDays}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.streakDays}{locale === 'en' ? ' days' : '일'}</p>
              <p className="text-xs text-blue-600 mt-1">🔥 {t.profile.streak}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.profile.totalStudyTime}</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(stats.totalStudyTime / 60)}{t.profile.hours} {stats.totalStudyTime % 60}{t.profile.minutes}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Zap className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.profile.thisWeekActivity}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.weeklyData.reduce((acc, day) => acc + day.sentences + day.reviews, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t.profile.weeklyActivity}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sentences" fill="#3B82F6" name={locale === 'en' ? 'New Sentences' : '새 문장'} />
              <Bar dataKey="reviews" fill="#10B981" name={locale === 'en' ? 'Reviews' : '복습'} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Difficulty Distribution - Pie Chart Only */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t.profile.difficultyDistribution}</h3>
          {stats.difficultyDistribution.some(d => d.count > 0) ? (
            <div className="space-y-6">
              {/* Pie Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.difficultyDistribution.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.difficultyDistribution.filter(d => d.count > 0).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={DIFFICULTY_COLORS[entry.level]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<DifficultyTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex justify-center space-x-6">
                {stats.difficultyDistribution.filter(item => item.count > 0).map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: DIFFICULTY_COLORS[item.level] }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {item.difficulty} ({item.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">
                  {locale === 'en' ? 'No sentences yet' : '아직 문장이 없습니다'}
                </p>
                <p className="text-sm">
                  {locale === 'en' ? 'Start learning to see difficulty distribution' : '학습을 시작하여 난이도 분포를 확인해보세요'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Progress - Real Data */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t.profile.monthlyProgress}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="sentences" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name={locale === 'en' ? 'New Sentences' : '새 문장'} />
              <Area type="monotone" dataKey="reviews" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name={locale === 'en' ? 'Reviews' : '복습'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Accuracy Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t.profile.weeklyAccuracy}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, t.common.accuracy]} />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#F59E0B" 
                strokeWidth={3}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                name={t.common.accuracy}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{t.profile.recentActivity}</h3>
        <div className="space-y-4">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${
                    activity.type === t.profile.newSentence ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {activity.type === t.profile.newSentence ? (
                      <BookOpen className={`w-4 h-4 ${
                        activity.type === t.profile.newSentence ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                    <p className="text-sm text-gray-600">{activity.sentence}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{activity.date}</p>
                  {activity.score && (
                    <p className="text-sm font-medium text-gray-900">{activity.score}{t.profile.points}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {locale === 'en' ? 'No recent activity. Start learning to see your progress!' : '최근 활동이 없습니다. 학습을 시작하여 진도를 확인해보세요!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}