import React, { useState, useEffect } from 'react';
import { Calendar, List, Shuffle, Search, Filter, Volume2, Edit3, Trash2, BookOpen, Globe, X, Save, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { translateSentence } from '../lib/openai';
import { Sentence } from '../types';
import { format, startOfDay, endOfDay } from 'date-fns';

interface EditingState {
  id: string;
  english_text: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function Sentences() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDateRange, setShowDateRange] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [totalCount, setTotalCount] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // 편집 관련 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingState | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();

  const itemsPerPage = 12;

  useEffect(() => {
    if (user && selectedLanguage) {
      loadSentences();
    }
  }, [user, currentPage, searchTerm, difficultyFilter, selectedLanguage, dateRange]);

  const loadSentences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('sentences')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('target_language', selectedLanguage)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`english_text.ilike.%${searchTerm}%,korean_translation.ilike.%${searchTerm}%`);
      }

      if (difficultyFilter !== 'all') {
        query = query.eq('difficulty', difficultyFilter);
      }

      // Date range filter
      if (dateRange.startDate && dateRange.endDate) {
        const startDate = startOfDay(new Date(dateRange.startDate));
        const endDate = endOfDay(new Date(dateRange.endDate));
        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      } else if (dateRange.startDate) {
        const startDate = startOfDay(new Date(dateRange.startDate));
        query = query.gte('created_at', startDate.toISOString());
      } else if (dateRange.endDate) {
        const endDate = endOfDay(new Date(dateRange.endDate));
        query = query.lte('created_at', endDate.toISOString());
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

  // 편집 모드 시작
  const startEditing = (sentence: Sentence) => {
    setEditingId(sentence.id);
    setEditingData({
      id: sentence.id,
      english_text: sentence.english_text,
      difficulty: sentence.difficulty
    });
    setEditError(null);
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditingData(null);
    setEditError(null);
  };

  // 문장 수정 저장
  const saveSentence = async () => {
    if (!editingData || !user) return;

    setSaveLoading(true);
    setEditError(null);

    try {
      // AI 번역 요청
      const translationResult = await translateSentence(
        editingData.english_text,
        selectedLanguage,
        '한국어'
      );

      // 데이터베이스 업데이트
      const { error } = await supabase
        .from('sentences')
        .update({
          english_text: editingData.english_text,
          korean_translation: translationResult.translation,
          difficulty: editingData.difficulty,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingData.id);

      if (error) throw error;

      // 로컬 상태 업데이트
      setSentences(prev => prev.map(sentence => 
        sentence.id === editingData.id 
          ? {
              ...sentence,
              english_text: editingData.english_text,
              korean_translation: translationResult.translation,
              difficulty: editingData.difficulty,
              updated_at: new Date().toISOString()
            }
          : sentence
      ));

      // 편집 모드 종료
      setEditingId(null);
      setEditingData(null);

    } catch (error) {
      console.error('Failed to save sentence:', error);
      setEditError(error instanceof Error ? error.message : '저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaveLoading(false);
    }
  };

  // 언어별 음성 코드 매핑
  const getLanguageCode = (language: string): string => {
    const languageMap: { [key: string]: string } = {
      '영어': 'en-US',
      '프랑스어': 'fr-FR',
      '독일어': 'de-DE',
      '스페인어': 'es-ES',
      '이탈리아어': 'it-IT',
      '일본어': 'ja-JP',
      '중국어': 'zh-CN',
      '러시아어': 'ru-RU',
      '포르투갈어': 'pt-BR',
      '아랍어': 'ar-SA'
    };
    return languageMap[language] || 'en-US';
  };

  const playAudio = async (text: string, sentenceId: string) => {
    if (!text.trim()) return;

    setAudioError(null);

    try {
      // 이미 재생 중인 경우 중지
      if (playingId === sentenceId) {
        window.speechSynthesis.cancel();
        setPlayingId(null);
        return;
      }

      // 다른 음성 중지
      window.speechSynthesis.cancel();
      setPlayingId(sentenceId);

      // 음성 합성 설정
      const utterance = new SpeechSynthesisUtterance(text);
      const languageCode = getLanguageCode(selectedLanguage);
      utterance.lang = languageCode;
      utterance.rate = 0.8; // 조금 느리게 (학습에 적합)
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // 사용 가능한 음성 중에서 해당 언어 음성 찾기
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(voice => 
        voice.lang.startsWith(languageCode.split('-')[0]) || 
        voice.lang === languageCode
      );
      
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      // 재생 완료 시 상태 초기화
      utterance.onend = () => {
        setPlayingId(null);
      };

      // 에러 처리
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setPlayingId(null);
        setAudioError(`음성 재생 중 오류가 발생했습니다: ${event.error}`);
        setTimeout(() => setAudioError(null), 3000);
      };

      // 음성 재생
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Audio playback failed:', error);
      setPlayingId(null);
      
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setAudioError(errorMessage);
      
      // 3초 후 에러 메시지 자동 제거
      setTimeout(() => setAudioError(null), 3000);
    }
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

  const clearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const ListView = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Audio Error Display */}
      {audioError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <Volume2 className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>음성 재생 오류:</strong> {audioError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Error Display */}
      {editError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>편집 오류:</strong> {editError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-5">문장</div>
          <div className="col-span-3">번역</div>
          <div className="col-span-1">난이도</div>
          <div className="col-span-2">등록일</div>
          <div className="col-span-1">작업</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {sentences.map((sentence) => {
          const isEditing = editingId === sentence.id;
          
          return (
            <div key={sentence.id} className={`px-6 py-4 transition-colors ${
              isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}>
              <div className="grid grid-cols-12 gap-4 text-sm">
                {/* 문장 컬럼 */}
                <div className="col-span-5">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => playAudio(
                        isEditing ? editingData?.english_text || sentence.english_text : sentence.english_text, 
                        sentence.id
                      )}
                      disabled={playingId === sentence.id || isEditing}
                      className={`p-2 transition-all rounded-lg flex-shrink-0 group shadow-sm ${
                        playingId === sentence.id
                          ? 'text-white bg-blue-600 animate-pulse shadow-lg scale-105'
                          : isEditing
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'
                      }`}
                      title={isEditing ? '편집 중에는 재생할 수 없습니다' : `${selectedLanguage} 발음 듣기 ${playingId === sentence.id ? '(재생 중... 클릭하면 중지)' : ''}`}
                    >
                      <Volume2 className={`w-4 h-4 transition-transform ${
                        playingId === sentence.id ? 'scale-110' : 'group-hover:scale-110'
                      }`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <textarea
                          value={editingData?.english_text || ''}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, english_text: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={2}
                          placeholder={`${selectedLanguage} 문장을 입력하세요`}
                        />
                      ) : (
                        <p className="font-medium text-gray-900 break-words leading-relaxed">{sentence.english_text}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 번역 컬럼 */}
                <div className="col-span-3">
                  {isEditing ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">AI 번역 예정</p>
                      <p className="text-xs text-yellow-600 mt-1">저장 시 자동으로 번역됩니다</p>
                    </div>
                  ) : (
                    <p className="text-gray-700 break-words leading-relaxed">{sentence.korean_translation}</p>
                  )}
                </div>

                {/* 난이도 컬럼 */}
                <div className="col-span-1">
                  {isEditing ? (
                    <select
                      value={editingData?.difficulty || 'medium'}
                      onChange={(e) => setEditingData(prev => prev ? { ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' } : null)}
                      className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      <option value="easy">쉬움</option>
                      <option value="medium">보통</option>
                      <option value="hard">어려움</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(sentence.difficulty)}`}>
                      {getDifficultyLabel(sentence.difficulty)}
                    </span>
                  )}
                </div>

                {/* 등록일 컬럼 */}
                <div className="col-span-2">
                  <p className="text-gray-600">
                    {format(new Date(sentence.created_at), 'yyyy.MM.dd')}
                  </p>
                </div>

                {/* 작업 컬럼 */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveSentence}
                          disabled={saveLoading || !editingData?.english_text.trim()}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="저장"
                        >
                          {saveLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={saveLoading}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors rounded hover:bg-gray-50 disabled:opacity-50"
                          title="취소"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(sentence)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded hover:bg-blue-50"
                          title="편집"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSentence(sentence.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sentences.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            {dateRange.startDate || dateRange.endDate 
              ? '선택한 날짜 범위에 해당하는 문장이 없습니다.'
              : `${selectedLanguage}로 등록된 문장이 없습니다.`
            }
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {dateRange.startDate || dateRange.endDate 
              ? '다른 날짜 범위를 선택하거나 필터를 초기화해보세요.'
              : '먼저 \'오늘의 학습\'에서 문장을 추가해보세요.'
            }
          </p>
        </div>
      )}
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
          <Link
            to="/quiz"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            <Shuffle className="w-5 h-5 mr-2" />
            퀴즈
          </Link>
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

        {/* Date Range and View Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDateRange(!showDateRange)}
            className={`p-2 rounded-lg transition-colors ${
              showDateRange || dateRange.startDate || dateRange.endDate
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="날짜 범위 필터"
          >
            <Calendar className="w-5 h-5" />
          </button>
          <button
            onClick={() => {}}
            className="p-2 rounded-lg bg-blue-100 text-blue-600"
            title="리스트 뷰"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      {showDateRange && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">날짜 범위 선택</h3>
            <button
              onClick={() => setShowDateRange(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                시작 날짜
              </label>
              <input
                id="start-date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                종료 날짜
              </label>
              <input
                id="end-date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                min={dateRange.startDate || undefined}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Range Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              {dateRange.startDate && dateRange.endDate ? (
                <span>
                  {format(new Date(dateRange.startDate), 'yyyy년 MM월 dd일')} ~ {format(new Date(dateRange.endDate), 'yyyy년 MM월 dd일')}
                </span>
              ) : dateRange.startDate ? (
                <span>{format(new Date(dateRange.startDate), 'yyyy년 MM월 dd일')} 이후</span>
              ) : dateRange.endDate ? (
                <span>{format(new Date(dateRange.endDate), 'yyyy년 MM월 dd일')} 이전</span>
              ) : (
                <span>날짜 범위를 선택하세요</span>
              )}
            </div>
            
            {(dateRange.startDate || dateRange.endDate) && (
              <button
                onClick={clearDateRange}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(dateRange.startDate || dateRange.endDate || difficultyFilter !== 'all' || searchTerm) && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">활성 필터:</span>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    검색: "{searchTerm}"
                  </span>
                )}
                {difficultyFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    난이도: {getDifficultyLabel(difficultyFilter)}
                  </span>
                )}
                {(dateRange.startDate || dateRange.endDate) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    날짜: {dateRange.startDate && dateRange.endDate 
                      ? `${format(new Date(dateRange.startDate), 'MM/dd')} ~ ${format(new Date(dateRange.endDate), 'MM/dd')}`
                      : dateRange.startDate 
                        ? `${format(new Date(dateRange.startDate), 'MM/dd')} 이후`
                        : `${format(new Date(dateRange.endDate!), 'MM/dd')} 이전`
                    }
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setDifficultyFilter('all');
                clearDateRange();
                setCurrentPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              모든 필터 초기화
            </button>
          </div>
        </div>
      )}

      {/* Editing Notice */}
      {editingId && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <Edit3 className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>편집 모드:</strong> 문장을 수정하고 저장하면 AI가 자동으로 재번역합니다. 
                {saveLoading && <span className="ml-2 text-blue-600">번역 중...</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <ListView />

      {/* Pagination */}
      {totalPages > 1 && (
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

      {/* Enhanced Tips Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 문장 리스트 활용 팁</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p><strong>🔊 발음 버튼</strong>을 클릭하여 {selectedLanguage} 원어민 발음을 들어보세요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p><strong>✏️ 편집 버튼</strong>으로 문장을 수정하면 AI가 자동으로 재번역해드려요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p><strong>🔍 검색 기능</strong>으로 특정 문장을 빠르게 찾을 수 있어요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p><strong>📊 난이도 필터</strong>로 체계적으로 학습 단계를 관리하세요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p><strong>📅 날짜 범위 필터</strong>로 특정 기간에 학습한 문장들을 확인하세요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p><strong>🎯 퀴즈 모드</strong>로 랜덤 문장들을 테스트해보세요</p>
          </div>
        </div>
        
        {/* Language-specific tip */}
        <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
          <div className="flex items-start">
            <span className="text-2xl mr-3">
              {selectedLanguage === '프랑스어' ? '🇫🇷' : 
               selectedLanguage === '독일어' ? '🇩🇪' :
               selectedLanguage === '스페인어' ? '🇪🇸' :
               selectedLanguage === '이탈리아어' ? '🇮🇹' :
               selectedLanguage === '일본어' ? '🇯🇵' :
               selectedLanguage === '중국어' ? '🇨🇳' :
               selectedLanguage === '러시아어' ? '🇷🇺' :
               selectedLanguage === '포르투갈어' ? '🇧🇷' :
               selectedLanguage === '아랍어' ? '🇸🇦' : '🇺🇸'}
            </span>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">{selectedLanguage} 인라인 편집 기능</p>
              <p className="text-sm text-blue-800">
                현재 학습 중인 <strong>{selectedLanguage}</strong> 문장을 바로 수정할 수 있습니다! 
                편집 버튼을 클릭하여 문장과 난이도를 수정하면, AI가 자동으로 한국어로 재번역해드립니다.
                <span className="font-medium"> 편집 중에는 음성 재생이 비활성화됩니다.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Audio Status Indicator */}
        {playingId && (
          <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
            <div className="flex items-center">
              <Volume2 className="w-4 h-4 text-blue-600 mr-2 animate-pulse" />
              <p className="text-sm text-blue-800">
                <strong>{selectedLanguage} 발음 재생 중...</strong> 중지하려면 같은 버튼을 다시 클릭하거나, 다른 문장을 재생하세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}