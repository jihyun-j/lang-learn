import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { User, Edit3, Save, X, Globe, BookOpen, TrendingUp, Target, Calendar, Award, Clock, Zap, Brain, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

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
  accuracyData: Array<{
    range: string;
    count: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    sentences: number;
    reviews: number;
  }>;
  difficultyDistribution: Array<{
    difficulty: string;
    count: number;
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
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    native_language: '',
    target_languages: [''],
  });
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const { user } = useAuth();

  const availableLanguages = [
    '영어', '일본어', '중국어', '프랑스어', '독일어', '스페인어', '이탈리아어', '러시아어', '포르투갈어', '아랍어'
  ];

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadStatsData();
    }
  }, [user, timeRange]);

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

  const loadStatsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load sentences
      const { data: sentences, error: sentencesError } = await supabase
        .from('sentences')
        .select('*')
        .eq('user_id', user.id);

      if (sentencesError) throw sentencesError;

      // Load review sessions
      const { data: reviews, error: reviewsError } = await supabase
        .from('review_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Calculate basic stats
      const totalSentences = sentences?.length || 0;
      const totalReviews = reviews?.length || 0;
      const averageAccuracy = reviews?.length > 0 
        ? Math.round(reviews.reduce((acc, r) => acc + r.overall_score, 0) / reviews.length)
        : 0;

      // Generate weekly data
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      const weeklyData = weekDays.map(day => {
        const dayStr = format(day, 'EEE');
        const daySentences = sentences?.filter(s => 
          format(new Date(s.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        ).length || 0;
        
        const dayReviews = reviews?.filter(r => 
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

      // Generate accuracy distribution
      const accuracyRanges = [
        { range: '90-100%', count: 0 },
        { range: '80-89%', count: 0 },
        { range: '70-79%', count: 0 },
        { range: '60-69%', count: 0 },
        { range: '0-59%', count: 0 },
      ];

      reviews?.forEach(review => {
        const accuracy = review.overall_score;
        if (accuracy >= 90) accuracyRanges[0].count++;
        else if (accuracy >= 80) accuracyRanges[1].count++;
        else if (accuracy >= 70) accuracyRanges[2].count++;
        else if (accuracy >= 60) accuracyRanges[3].count++;
        else accuracyRanges[4].count++;
      });

      // Generate monthly progress (mock data for demo)
      const monthlyProgress = [
        { month: '1월', sentences: 15, reviews: 45 },
        { month: '2월', sentences: 22, reviews: 67 },
        { month: '3월', sentences: 18, reviews: 52 },
        { month: '4월', sentences: 25, reviews: 78 },
        { month: '5월', sentences: 30, reviews: 89 },
        { month: '6월', sentences: totalSentences, reviews: totalReviews },
      ];

      // Generate difficulty distribution
      const difficultyDistribution = [
        { difficulty: '쉬움', count: sentences?.filter(s => s.difficulty === 'easy').length || 0 },
        { difficulty: '보통', count: sentences?.filter(s => s.difficulty === 'medium').length || 0 },
        { difficulty: '어려움', count: sentences?.filter(s => s.difficulty === 'hard').length || 0 },
      ];

      // Generate recent activity
      const recentActivity = [
        ...sentences?.slice(0, 3).map(s => ({
          date: format(new Date(s.created_at), 'MM.dd'),
          type: '새 문장',
          sentence: s.english_text,
        })) || [],
        ...reviews?.slice(0, 3).map(r => ({
          date: format(new Date(r.created_at), 'MM.dd'),
          type: '복습',
          sentence: '발음 연습',
          score: r.overall_score,
        })) || [],
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      setStats({
        totalSentences,
        totalReviews,
        averageAccuracy,
        streakDays: 7, // Mock data
        totalStudyTime: 1250, // Mock data in minutes
        weeklyData,
        accuracyData: accuracyRanges,
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
      alert('최소 하나의 학습 언어를 선택해주세요.');
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
      alert('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('프로필 업데이트에 실패했습니다.');
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
        <h1 className="text-3xl font-bold text-gray-900">프로필</h1>
        <p className="mt-2 text-lg text-gray-600">개인 정보와 학습 통계를 확인하세요</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">개인 정보</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              편집
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveProfile}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                저장
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-900">{profile.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">가입일</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-900">{format(new Date(profile.created_at), 'yyyy년 MM월 dd일')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">모국어</label>
            {editing ? (
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <select
                  value={editForm.native_language}
                  onChange={(e) => setEditForm(prev => ({ ...prev, native_language: e.target.value }))}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="한국어">한국어</option>
                  <option value="영어">English</option>
                  <option value="일본어">日本語</option>
                  <option value="중국어">中文</option>
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
              학습 언어 (최대 3개)
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
                        <option value="">언어 선택</option>
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
                    언어 추가
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
          <h2 className="text-2xl font-bold text-gray-900">학습 통계</h2>
          <p className="mt-1 text-gray-600">학습 진도와 성과를 한눈에 확인하세요</p>
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
                {range === 'week' ? '주간' : range === 'month' ? '월간' : '연간'}
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
              <p className="text-sm font-medium text-gray-600">총 학습 문장</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSentences}</p>
              <p className="text-xs text-green-600 mt-1">+3 이번 주</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 복습 횟수</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
              <p className="text-xs text-green-600 mt-1">+12 이번 주</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 정확도</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageAccuracy}%</p>
              <p className="text-xs text-green-600 mt-1">+5% 지난 주 대비</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">연속 학습일</p>
              <p className="text-3xl font-bold text-gray-900">{stats.streakDays}일</p>
              <p className="text-xs text-blue-600 mt-1">🔥 연속 기록</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 학습 시간</p>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(stats.totalStudyTime / 60)}시간 {stats.totalStudyTime % 60}분</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Zap className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">이번 주 활동</p>
              <p className="text-2xl font-bold text-gray-900">{stats.weeklyData.reduce((acc, day) => acc + day.sentences + day.reviews, 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-pink-100 rounded-full">
              <Brain className="w-6 h-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">학습 레벨</p>
              <p className="text-2xl font-bold text-gray-900">중급</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">주간 학습 활동</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sentences" fill="#3B82F6" name="새 문장" />
              <Bar dataKey="reviews" fill="#10B981" name="복습" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Accuracy Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">정확도 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.accuracyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.accuracyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">월별 학습 진도</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="sentences" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="새 문장" />
              <Area type="monotone" dataKey="reviews" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="복습" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">난이도별 문장 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.difficultyDistribution} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="difficulty" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Accuracy Trend */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">주간 정확도 추이</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={stats.weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${value}%`, '정확도']} />
            <Line 
              type="monotone" 
              dataKey="accuracy" 
              stroke="#F59E0B" 
              strokeWidth={3}
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
              name="정확도"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">최근 활동</h3>
        <div className="space-y-4">
          {stats.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${
                  activity.type === '새 문장' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {activity.type === '새 문장' ? (
                    <BookOpen className={`w-4 h-4 ${
                      activity.type === '새 문장' ? 'text-blue-600' : 'text-green-600'
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
                  <p className="text-sm font-medium text-gray-900">{activity.score}점</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}