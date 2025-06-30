import React, { useState, useEffect } from 'react';
import { Calendar, List, Shuffle, Search, Filter, Volume2, Edit3, Trash2, BookOpen, Globe, X, Save, XCircle, Tag, StickyNote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useLocale } from '../hooks/useLocale';
import { getTranslation } from '../utils/translations';
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
  
  // Edit related states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingState | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  
  // Explanation modal related states
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [selectedSentenceExplanation, setSelectedSentenceExplanation] = useState<{
    sentence: string;
    translation: string;
    explanation: string;
    keywords: string[];
  } | null>(null);
  
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  const { locale } = useLocale();
  const t = getTranslation(locale);

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
    if (!confirm(t.sentences.deleteConfirm)) return;

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
      alert(t.sentences.deleteFailed);
    }
  };

  // Start editing mode
  const startEditing = (sentence: Sentence) => {
    setEditingId(sentence.id);
    setEditingData({
      id: sentence.id,
      english_text: sentence.english_text,
      difficulty: sentence.difficulty
    });
    setEditError(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditingData(null);
    setEditError(null);
  };

  // Save sentence modification
  const saveSentence = async () => {
    if (!editingData || !user) return;

    setSaveLoading(true);
    setEditError(null);

    try {
      // AI translation request
      const translationResult = await translateSentence(
        editingData.english_text,
        selectedLanguage,
        'English'
      );

      // Database update
      const { error } = await supabase
        .from('sentences')
        .update({
          english_text: editingData.english_text,
          korean_translation: translationResult.translation,
          keywords: translationResult.keywords || [],
          difficulty: editingData.difficulty,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingData.id);

      if (error) throw error;

      // Update local state
      setSentences(prev => prev.map(sentence => 
        sentence.id === editingData.id 
          ? {
              ...sentence,
              english_text: editingData.english_text,
              korean_translation: translationResult.translation,
              keywords: translationResult.keywords || [],
              difficulty: editingData.difficulty,
              updated_at: new Date().toISOString()
            }
          : sentence
      ));

      // End editing mode
      setEditingId(null);
      setEditingData(null);

    } catch (error) {
      console.error('Failed to save sentence:', error);
      setEditError(error instanceof Error ? error.message : t.sentences.saveFailed);
    } finally {
      setSaveLoading(false);
    }
  };

  // Open explanation modal
  const showExplanation = async (sentence: Sentence) => {
    // Set basic information
    let explanationData = {
      sentence: sentence.english_text,
      translation: sentence.korean_translation,
      explanation: '',
      keywords: sentence.keywords || []
    };

    // Get additional explanation from AI (optional)
    try {
      const result = await translateSentence(
        sentence.english_text,
        selectedLanguage,
        'English'
      );
      
      if (result.explanation) {
        explanationData.explanation = result.explanation;
      } else {
        // Generate default explanation
        explanationData.explanation = `This sentence demonstrates common usage patterns in ${selectedLanguage}. Practice pronunciation and pay attention to the structure.`;
      }
    } catch (error) {
      console.warn('Failed to get additional explanation:', error);
      // Use default explanation
      explanationData.explanation = `This sentence demonstrates common usage patterns in ${selectedLanguage}. Practice pronunciation and pay attention to the structure.`;
    }

    setSelectedSentenceExplanation(explanationData);
    setShowExplanationModal(true);
  };

  // Language-specific voice code mapping
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
      // Stop if already playing
      if (playingId === sentenceId) {
        window.speechSynthesis.cancel();
        setPlayingId(null);
        return;
      }

      // Stop other audio
      window.speechSynthesis.cancel();
      setPlayingId(sentenceId);

      // Speech synthesis settings
      const utterance = new SpeechSynthesisUtterance(text);
      const languageCode = getLanguageCode(selectedLanguage);
      utterance.lang = languageCode;
      utterance.rate = 0.8; // Slightly slower (suitable for learning)
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Find target language voice from available voices
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(voice => 
        voice.lang.startsWith(languageCode.split('-')[0]) || 
        voice.lang === languageCode
      );
      
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      // Reset state when playback ends
      utterance.onend = () => {
        setPlayingId(null);
      };

      // Error handling
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setPlayingId(null);
        setAudioError(`${t.sentences.audioError} ${event.error}`);
        setTimeout(() => setAudioError(null), 3000);
      };

      // Play audio
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Audio playback failed:', error);
      setPlayingId(null);
      
      const errorMessage = error instanceof Error ? error.message : t.errors.unknownError;
      setAudioError(errorMessage);
      
      // Auto-remove error message after 3 seconds
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
      case 'easy': return t.common.easy;
      case 'medium': return t.common.medium;
      case 'hard': return t.common.hard;
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
                <strong>{t.sentences.audioError}</strong> {audioError}
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
                <strong>{t.sentences.editError}</strong> {editError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-5">{t.sentences.sentence}</div>
          <div className="col-span-3">{t.sentences.translation}</div>
          <div className="col-span-1">{t.sentences.difficulty}</div>
          <div className="col-span-2">{t.sentences.registeredDate}</div>
          <div className="col-span-1">{t.sentences.actions}</div>
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
                {/* Sentence column */}
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
                      title={isEditing ? t.sentences.cannotPlayWhileEditing : `${selectedLanguage} ${t.quiz.listenPronunciation} ${playingId === sentence.id ? `(${t.review.audioPlaying})` : ''}`}
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
                          placeholder={`${selectedLanguage} ${t.learn.enterSentence}`}
                        />
                      ) : (
                        <div>
                          <p className="font-medium text-gray-900 break-words leading-relaxed">{sentence.english_text}</p>
                          {/* Display keywords at the bottom of the sentence - show complete words */}
                          {sentence.keywords && sentence.keywords.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {sentence.keywords.slice(0, 4).map((keyword, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"
                                  title={keyword}
                                >
                                  <Tag className="w-2.5 h-2.5 mr-1" />
                                  {keyword}
                                </span>
                              ))}
                              {sentence.keywords.length > 4 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  +{sentence.keywords.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Translation column */}
                <div className="col-span-3">
                  {isEditing ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">{t.sentences.aiTranslationPending}</p>
                      <p className="text-xs text-yellow-600 mt-1">{t.sentences.aiTranslationDesc}</p>
                    </div>
                  ) : (
                    <p className="text-gray-700 break-words leading-relaxed">{sentence.korean_translation}</p>
                  )}
                </div>

                {/* Difficulty column */}
                <div className="col-span-1">
                  {isEditing ? (
                    <select
                      value={editingData?.difficulty || 'medium'}
                      onChange={(e) => setEditingData(prev => prev ? { ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' } : null)}
                      className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      <option value="easy">{t.common.easy}</option>
                      <option value="medium">{t.common.medium}</option>
                      <option value="hard">{t.common.hard}</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(sentence.difficulty)}`}>
                      {getDifficultyLabel(sentence.difficulty)}
                    </span>
                  )}
                </div>

                {/* Registration date column */}
                <div className="col-span-2">
                  <p className="text-gray-600">
                    {format(new Date(sentence.created_at), 'yyyy.MM.dd')}
                  </p>
                </div>

                {/* Actions column */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveSentence}
                          disabled={saveLoading || !editingData?.english_text.trim()}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t.common.save}
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
                          title={t.common.cancel}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => showExplanation(sentence)}
                          className="p-1 text-gray-400 hover:text-yellow-600 transition-colors rounded hover:bg-yellow-50"
                          title="View explanation"
                        >
                          <StickyNote className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditing(sentence)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded hover:bg-blue-50"
                          title={t.common.edit}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSentence(sentence.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                          title={t.common.delete}
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
              ? t.sentences.noDateRange
              : `${selectedLanguage} ${t.sentences.noSentences}`
            }
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {dateRange.startDate || dateRange.endDate 
              ? t.sentences.noDateRangeHint
              : t.sentences.noSentencesHint
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
            <h1 className="text-3xl font-bold text-gray-900">{t.sentences.title}</h1>
            <div className="ml-4 flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <Globe className="w-4 h-4 mr-1" />
              {selectedLanguage}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            You are learning a total of {totalCount} sentences in {selectedLanguage}.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/quiz"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            <Shuffle className="w-5 h-5 mr-2" />
            {t.sentences.quiz}
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
              placeholder={`${t.sentences.sentence} ${t.common.search}...`}
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
              <option value="all">{t.sentences.allDifficulties}</option>
              <option value="easy">{t.common.easy}</option>
              <option value="medium">{t.common.medium}</option>
              <option value="hard">{t.common.hard}</option>
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
            title={t.sentences.dateRange}
          >
            <Calendar className="w-5 h-5" />
          </button>
          <button
            onClick={() => {}}
            className="p-2 rounded-lg bg-blue-100 text-blue-600"
            title="List View"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      {showDateRange && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t.sentences.dateRange}</h3>
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
                {t.sentences.startDate}
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
                {t.sentences.endDate}
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
                  {format(new Date(dateRange.startDate), 'yyyy.MM.dd')} ~ {format(new Date(dateRange.endDate), 'yyyy.MM.dd')}
                </span>
              ) : dateRange.startDate ? (
                <span>{format(new Date(dateRange.startDate), 'yyyy.MM.dd')} {t.sentences.after}</span>
              ) : dateRange.endDate ? (
                <span>{format(new Date(dateRange.endDate), 'yyyy.MM.dd')} {t.sentences.before}</span>
              ) : (
                <span>{t.sentences.selectDateRange}</span>
              )}
            </div>
            
            {(dateRange.startDate || dateRange.endDate) && (
              <button
                onClick={clearDateRange}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                {t.common.reset}
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
              <span className="text-sm font-medium text-blue-900">{t.sentences.activeFilters}</span>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {t.sentences.search} "{searchTerm}"
                  </span>
                )}
                {difficultyFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {t.common.difficulty}: {getDifficultyLabel(difficultyFilter)}
                  </span>
                )}
                {(dateRange.startDate || dateRange.endDate) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {t.common.date}: {dateRange.startDate && dateRange.endDate 
                      ? `${format(new Date(dateRange.startDate), 'MM/dd')} ~ ${format(new Date(dateRange.endDate), 'MM/dd')}`
                      : dateRange.startDate 
                        ? `${format(new Date(dateRange.startDate), 'MM/dd')} ${t.sentences.after}`
                        : `${format(new Date(dateRange.endDate!), 'MM/dd')} ${t.sentences.before}`
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
              {t.sentences.clearAllFilters}
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
                <strong>{t.sentences.editMode}</strong> {t.sentences.editModeDesc}
                {saveLoading && <span className="ml-2 text-blue-600">{t.sentences.translating}</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <ListView />

      {/* Explanation Modal */}
      {showExplanationModal && selectedSentenceExplanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <StickyNote className="w-6 h-6 text-yellow-600 mr-2" />
                  Sentence Explanation
                </h3>
                <button
                  onClick={() => setShowExplanationModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Original Sentence */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    {selectedLanguage} Original
                  </h4>
                  <p className="text-lg font-medium text-blue-800">
                    {selectedSentenceExplanation.sentence}
                  </p>
                </div>

                {/* Translation */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">
                    English Translation
                  </h4>
                  <p className="text-lg font-medium text-green-800">
                    {selectedSentenceExplanation.translation}
                  </p>
                </div>

                {/* Keywords */}
                {selectedSentenceExplanation.keywords.length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Key Expressions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSentenceExplanation.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center">
                    <StickyNote className="w-4 h-4 mr-2" />
                    Learning Notes
                  </h4>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    {selectedSentenceExplanation.explanation}
                  </p>
                </div>

                {/* Study Tips */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    💡 Study Tips
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Practice pronunciation by listening to the audio</li>
                    <li>• Try using this sentence in different contexts</li>
                    <li>• Review the key expressions regularly</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowExplanationModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-lg">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.common.previous}
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.common.next}
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
                {' results'}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.common.previous}
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
                  {t.common.next}
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}