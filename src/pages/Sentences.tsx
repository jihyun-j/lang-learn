import React, { useState, useEffect } from 'react';
import { Calendar, List, Shuffle, Search, Filter, Volume2, Edit3, Trash2, BookOpen, Globe, Tag, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Sentence } from '../types';
import { format } from 'date-fns';

export function Sentences() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [expandedSentence, setExpandedSentence] = useState<string | null>(null);
  const { user } = useAuth();

  // Get current selected language from localStorage
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const saved = localStorage.getItem('selectedLanguage');
    const targetLanguages = user?.user_metadata?.target_languages || [user?.user_metadata?.target_language || '영어'];
    const languages = Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages];
    return saved && languages.includes(saved) ? saved : languages[0] || '영어';
  });

  const itemsPerPage = 12;

  useEffect(() => {
    if (user) {
      loadSentences();
    }
  }, [user, currentPage, searchTerm, difficultyFilter, selectedLanguage]);

  // Listen for language changes from the sidebar
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setSelectedLanguage(event.detail);
      setCurrentPage(1); // Reset to first page when language changes
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const loadSentences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('sentences')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('target_language', selectedLanguage) // Filter by selected language
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`english_text.ilike.%${searchTerm}%,korean_translation.ilike.%${searchTerm}%`);
      }

      if (difficultyFilter !== 'all') {
        query = query.eq('difficulty', difficultyFilter);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;

      setSentences(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Failed to load sentences:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSentence = async (id: string) => {
    if (!confirm('이 문장을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('sentences')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSentences(prev => prev.filter(s => s.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error('Failed to delete sentence:', error);
      alert('문장 삭제에 실패했습니다.');
    }
  };

  const playAudio = (text: string, lang: string = 'en-US') => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage === '영어' ? 'en-US' : 
                    selectedLanguage === '일본어' ? 'ja-JP' :
                    selectedLanguage === '중국어' ? 'zh-CN' :
                    selectedLanguage === '프랑스어' ? 'fr-FR' :
                    selectedLanguage === '독일어' ? 'de-DE' :
                    selectedLanguage === '스페인어' ? 'es-ES' : 'en-US';
    speechSynthesis.speak(utterance);
  };

  const startQuiz = () => {
    // Navigate to quiz mode - in a real app, you'd use React Router
    alert('퀴즈 모드 준비중...');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return difficulty;
    }
  };

  const toggleExpanded = (sentenceId: string) => {
    setExpandedSentence(expandedSentence === sentenceId ? null : sentenceId);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const ListView = () => (
    <div className="space-y-4">
      {sentences.map((sentence) => (
        <div key={sentence.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          {/* Main Content */}
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Original Text with Audio */}
                <div className="flex items-start space-x-3 mb-3">
                  <button
                    onClick={() => playAudio(sentence.english_text)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900 leading-relaxed">
                      {sentence.english_text}
                    </p>
                    <p className="text-gray-600 mt-1">
                      {sentence.korean_translation}
                    </p>
                  </div>
                </div>

                {/* Keywords Preview */}
                {sentence.keywords && sentence.keywords.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Tag className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-600">핵심 표현</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sentence.keywords.slice(0, expandedSentence === sentence.id ? undefined : 3).map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          {keyword}
                        </span>
                      ))}
                      {sentence.keywords.length > 3 && expandedSentence !== sentence.id && (
                        <button
                          onClick={() => toggleExpanded(sentence.id)}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          +{sentence.keywords.length - 3}개 더보기
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded Keywords */}
                {expandedSentence === sentence.id && sentence.keywords && sentence.keywords.length > 3 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">모든 핵심 표현</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sentence.keywords.map((keyword, idx) => (
                        <div key={idx} className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                          <Star className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-blue-800 font-medium">{keyword}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => toggleExpanded(sentence.id)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      접기
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side Info */}
              <div className="flex flex-col items-end space-y-3 ml-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(sentence.difficulty)}`}>
                  {getDifficultyLabel(sentence.difficulty)}
                </span>
                <p className="text-sm text-gray-500">
                  {format(new Date(sentence.created_at), 'yyyy.MM.dd')}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => alert('편집 기능 준비중...')}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="편집"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSentence(sentence.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Stats */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  {sentence.keywords?.length || 0}개 표현
                </span>
                <span className="flex items-center">
                  <Globe className="w-4 h-4 mr-1" />
                  {sentence.target_language}
                </span>
              </div>
              {sentence.keywords && sentence.keywords.length > 3 && (
                <button
                  onClick={() => toggleExpanded(sentence.id)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {expandedSentence === sentence.id ? '접기' : '자세히 보기'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {sentences.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            {selectedLanguage}로 등록된 문장이 없습니다.
          </p>
          <p className="text-sm text-gray-500 mt-2">먼저 '오늘의 학습'에서 문장을 추가해보세요.</p>
        </div>
      )}
    </div>
  );

  const CalendarView = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600">캘린더 뷰</p>
        <p className="text-sm text-gray-500 mt-2">준비중입니다...</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900">문장 리스트</h1>
            <div className="ml-4 flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <Globe className="w-4 h-4 mr-1" />
              {selectedLanguage}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {selectedLanguage}로 총 {totalCount}개의 문장을 학습하고 있습니다.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={startQuiz}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            <Shuffle className="w-5 h-5 mr-2" />
            퀴즈
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="문장 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">모든 난이도</option>
              <option value="easy">쉬움</option>
              <option value="medium">보통</option>
              <option value="hard">어려움</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg ${
              viewMode === 'calendar'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? <ListView /> : <CalendarView />}

      {/* Pagination */}
      {viewMode === 'list' && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-lg">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' - '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>
                {' / '}
                <span className="font-medium">{totalCount}</span>
                개 결과
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}