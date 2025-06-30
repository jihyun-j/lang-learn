import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, BookOpen, Check, Globe, Volume2, AlertCircle, CheckCircle, XCircle, Lightbulb, RotateCcw, Tag, Edit3 } from 'lucide-react';
import { translateSentence, checkGrammarAndSpelling, GrammarCheckResult } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useLocale } from '../hooks/useLocale';
import { getTranslation } from '../utils/translations';
import { updateUserProgress } from '../utils/userProgress';

export function Learn() {
  const [sentence, setSentence] = useState('');
  const [translation, setTranslation] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPlayingInput, setIsPlayingInput] = useState(false);
  const [isPlayingResult, setIsPlayingResult] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // Grammar check related states
  const [grammarCheck, setGrammarCheck] = useState<GrammarCheckResult | null>(null);
  const [showGrammarCheck, setShowGrammarCheck] = useState(false);
  const [grammarCheckError, setGrammarCheckError] = useState<string | null>(null);
  const [hasGrammarErrors, setHasGrammarErrors] = useState(false);
  const [canSave, setCanSave] = useState(false);
  
  const { user } = useAuth();
  const { selectedLanguage, selectedLanguageInEnglish } = useLanguage();
  const { locale } = useLocale();
  const t = getTranslation(locale);

  // Grammar check and translation processing function
  const handleAnalyzeAndTranslate = async () => {
    if (!sentence.trim()) return;
    
    setLoading(true);
    setGrammarCheckError(null);
    setAudioError(null);
    setCanSave(false);
    
    try {
      // 1. Perform grammar check
      let grammarResult: GrammarCheckResult | null = null;
      try {
        grammarResult = await checkGrammarAndSpelling(sentence, selectedLanguage);
        setGrammarCheck(grammarResult);
        setShowGrammarCheck(true);
        setHasGrammarErrors(!grammarResult.isCorrect);
      } catch (grammarError) {
        console.warn('Grammar check failed, continuing with translation:', grammarError);
        setGrammarCheckError(grammarError instanceof Error ? grammarError.message : 'Grammar check failed but translation will continue.');
        setHasGrammarErrors(false); // Consider no errors if grammar check fails
      }

      // 2. Perform AI translation and keyword extraction
      const result = await translateSentence(sentence, selectedLanguage, 'English');
      setTranslation(result.translation);
      setKeywords(result.keywords || []);
      setExplanation(result.explanation || '');

      // 3. Allow saving only if no grammar errors or grammar check failed
      if (!grammarResult || grammarResult.isCorrect) {
        setCanSave(true);
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      alert(error instanceof Error ? error.message : t.errors.translationFailed);
    } finally {
      setLoading(false);
    }
  };

  // Database save function
  const handleSaveToDatabase = async () => {
    if (!translation || !user || !canSave) return;

    setLoading(true);
    
    try {
      // Check if existing sentence exists
      const { data: existingSentence, error: checkError } = await supabase
        .from('sentences')
        .select('id')
        .eq('user_id', user.id)
        .eq('english_text', sentence)
        .eq('target_language', selectedLanguage)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      // Save or update to database
      if (existingSentence && existingSentence.length > 0) {
        // Update existing sentence
        const { error: updateError } = await supabase
          .from('sentences')
          .update({
            korean_translation: translation,
            keywords: keywords || [],
            difficulty: difficulty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSentence[0].id);

        if (updateError) throw updateError;
      } else {
        // Insert new sentence
        const { error: insertError } = await supabase
          .from('sentences')
          .insert({
            user_id: user.id,
            english_text: sentence,
            korean_translation: translation,
            keywords: keywords || [],
            difficulty: difficulty,
            target_language: selectedLanguage,
          });

        if (insertError) throw insertError;
      }

      // Update user progress and streak
      await updateUserProgress(user.id);

      setSaved(true);
    } catch (error) {
      console.error('Save failed:', error);
      alert(error instanceof Error ? error.message : t.errors.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  // Next sentence input function
  const handleNextSentence = () => {
    setSentence('');
    setTranslation('');
    setKeywords([]);
    setExplanation('');
    setDifficulty('medium');
    setSaved(false);
    setGrammarCheck(null);
    setShowGrammarCheck(false);
    setGrammarCheckError(null);
    setAudioError(null);
    setIsPlayingInput(false);
    setIsPlayingResult(false);
    setHasGrammarErrors(false);
    setCanSave(false);
    
    // Stop voice playback
    window.speechSynthesis.cancel();
  };

  const applySuggestion = (suggestion: string) => {
    setSentence(suggestion);
    setGrammarCheck(null);
    setShowGrammarCheck(false);
    setHasGrammarErrors(false);
    setCanSave(false);
    setTranslation('');
    setKeywords([]);
    setExplanation('');
  };

  const applyCorrection = (original: string, suggestion: string) => {
    const correctedSentence = sentence.replace(original, suggestion);
    setSentence(correctedSentence);
    setGrammarCheck(null);
    setShowGrammarCheck(false);
    setHasGrammarErrors(false);
    setCanSave(false);
    setTranslation('');
    setKeywords([]);
    setExplanation('');
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

  // Audio playback function
  const playAudio = async (text: string, isInput: boolean = false) => {
    if (!text.trim()) return;

    setAudioError(null);

    try {
      const currentlyPlaying = isInput ? isPlayingInput : isPlayingResult;
      
      // Stop if already playing
      if (currentlyPlaying) {
        window.speechSynthesis.cancel();
        setIsPlayingInput(false);
        setIsPlayingResult(false);
        return;
      }

      // Stop other audio
      window.speechSynthesis.cancel();

      if (isInput) {
        setIsPlayingInput(true);
      } else {
        setIsPlayingResult(true);
      }

      // Speech synthesis settings
      const utterance = new SpeechSynthesisUtterance(text);
      const languageCode = getLanguageCode(selectedLanguage);
      utterance.lang = languageCode;
      utterance.rate = 0.8; // Slightly slower
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
        setIsPlayingInput(false);
        setIsPlayingResult(false);
      };

      // Error handling
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlayingInput(false);
        setIsPlayingResult(false);
        setAudioError(`${t.learn.audioError} ${event.error}`);
        setTimeout(() => setAudioError(null), 3000);
      };

      // Play audio
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlayingInput(false);
      setIsPlayingResult(false);
      
      const errorMessage = error instanceof Error ? error.message : t.errors.unknownError;
      setAudioError(errorMessage);
      
      // Auto-remove error message after 3 seconds
      setTimeout(() => setAudioError(null), 3000);
    }
  };

  const getErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'grammar': return '📝';
      case 'spelling': return '🔤';
      case 'punctuation': return '❗';
      case 'style': return '✨';
      default: return '💡';
    }
  };

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'grammar': return 'text-red-600 bg-red-50 border-red-200';
      case 'spelling': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'punctuation': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'style': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getErrorTypeName = (type: string) => {
    switch (type) {
      case 'grammar': return t.learn.grammarErrorType;
      case 'spelling': return t.learn.spellingErrorType;
      case 'punctuation': return t.learn.punctuationErrorType;
      case 'style': return t.learn.styleErrorType;
      default: return type;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.learn.title}</h1>
        <p className="text-lg text-gray-600">{t.learn.subtitle}</p>
      </div>

      {/* Audio Error Display */}
      {audioError && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <Volume2 className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>{t.learn.audioError}</strong> {audioError}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grammar Check Error Display */}
      {grammarCheckError && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  <strong>{t.learn.grammarCheckError}</strong> {grammarCheckError}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 {t.learn.tips}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>{t.learn.tipDaily}</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>{t.learn.tipGrammar}</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>{t.learn.tipDifficulty}</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>{t.learn.tipReview}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Current Language Display */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  {t.learn.currentLanguage} <span className="font-bold">{selectedLanguageInEnglish}</span>
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {t.learn.languageHint}
              </p>
            </div>

            {/* Input Section */}
            <div>
              <label htmlFor="sentence" className="block text-sm font-medium text-gray-700 mb-3">
                {selectedLanguageInEnglish} {t.learn.enterSentence}
              </label>
              <div className="relative">
                <textarea
                  id="sentence"
                  rows={3}
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                  placeholder={selectedLanguage === '영어' ? "e.g., How are you doing today?" : 
                              selectedLanguage === '프랑스어' ? "e.g., Comment allez-vous aujourd'hui?" :
                              selectedLanguage === '독일어' ? "e.g., Wie geht es Ihnen heute?" :
                              selectedLanguage === '스페인어' ? "e.g., ¿Cómo estás hoy?" :
                              selectedLanguage === '일본어' ? "e.g., 今日はいかがですか？" :
                              selectedLanguage === '중국어' ? "e.g., 你今天怎么样？" :
                              `${selectedLanguageInEnglish} ${t.learn.enterSentence}`}
                />
                
                {/* Audio Play Button */}
                {sentence.trim() && (
                  <button
                    onClick={() => playAudio(sentence, true)}
                    disabled={isPlayingInput}
                    className={`absolute right-3 top-3 p-2 transition-all rounded-lg ${
                      isPlayingInput
                        ? 'text-white bg-blue-600 animate-pulse shadow-lg'
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={`${selectedLanguageInEnglish} ${t.learn.playPronunciation} ${isPlayingInput ? `(${t.learn.playing})` : ''}`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Grammar Check Results */}
            {showGrammarCheck && grammarCheck && (
              <div className="space-y-4">
                {/* Overall Status */}
                <div className={`p-4 rounded-lg border ${
                  grammarCheck.isCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {grammarCheck.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                      )}
                      <h4 className={`font-semibold ${
                        grammarCheck.isCorrect ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {grammarCheck.isCorrect 
                          ? (locale === 'en' ? 'Grammar Check Passed' : '문법 검사 통과') 
                          : (locale === 'en' ? 'Grammar Errors Found - Correction Required' : '문법 오류 발견 - 수정 필요')
                        }
                      </h4>
                    </div>
                    <span className={`text-sm font-medium ${
                      grammarCheck.isCorrect ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {t.learn.confidence} {grammarCheck.confidence}%
                    </span>
                  </div>
                  
                  {!grammarCheck.isCorrect && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ {locale === 'en' 
                          ? 'Grammar errors detected. Cannot save to database. Please correct the sentence using the suggestions below.'
                          : '문법 오류가 감지되었습니다. 데이터베이스에 저장할 수 없습니다. 아래 제안을 사용하여 문장을 수정해주세요.'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Errors */}
                {grammarCheck.errors.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">{t.learn.errorsFound}:</h5>
                    {grammarCheck.errors.map((error, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getErrorTypeColor(error.type)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="mr-2">{getErrorTypeIcon(error.type)}</span>
                              <span className="font-medium text-sm">
                                {getErrorTypeName(error.type)} {t.learn.errorsFound}
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <p><span className="font-medium">{t.learn.originalText}</span> "{error.original}"</p>
                              <p><span className="font-medium">{t.learn.suggestion}</span> "{error.suggestion}"</p>
                              <p className="text-xs opacity-75">{error.explanation}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => applyCorrection(error.original, error.suggestion)}
                            className="ml-3 px-3 py-1 text-xs font-medium bg-white rounded border hover:bg-gray-50 transition-colors"
                          >
                            {t.common.apply}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Corrected Text */}
                {!grammarCheck.isCorrect && grammarCheck.correctedText !== sentence && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-900 mb-2">{t.learn.overallCorrection}</h5>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-green-800 flex-1">"{grammarCheck.correctedText}"</p>
                      <button
                        onClick={() => applySuggestion(grammarCheck.correctedText)}
                        className="ml-3 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        {t.learn.applyAll}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Difficulty Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t.learn.difficultySettings}
              </label>
              <div className="flex space-x-4">
                {[
                  { value: 'easy', label: t.common.easy, color: 'bg-green-100 text-green-800' },
                  { value: 'medium', label: t.common.medium, color: 'bg-yellow-100 text-yellow-800' },
                  { value: 'hard', label: t.common.hard, color: 'bg-red-100 text-red-800' },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setDifficulty(level.value as 'easy' | 'medium' | 'hard')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      difficulty === level.value
                        ? level.color + ' ring-2 ring-offset-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <div className="flex justify-center">
              <button
                onClick={handleAnalyzeAndTranslate}
                disabled={loading || !sentence.trim()}
                className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                ) : (
                  <Sparkles className="w-6 h-6 mr-3" />
                )}
                {loading 
                  ? (locale === 'en' ? 'AI Analyzing...' : 'AI 분석 중...')
                  : (locale === 'en' ? 'AI Analyze' : 'AI 분석하기')
                }
              </button>
            </div>

            {/* Translation Results Display */}
            {translation && (
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🎯 {locale === 'en' ? 'AI Analysis Results' : 'AI 분석 결과'}
                  </h3>
                  
                  {/* Translation Result */}
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-1">{selectedLanguageInEnglish} {t.learn.original}</p>
                          <p className="text-lg font-medium text-gray-900">{sentence}</p>
                        </div>
                        <button
                          onClick={() => playAudio(sentence, false)}
                          disabled={isPlayingResult}
                          className={`ml-3 p-2 transition-all rounded-lg ${
                            isPlayingResult
                              ? 'text-white bg-blue-600 animate-pulse shadow-lg'
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={`${selectedLanguageInEnglish} ${t.learn.playPronunciation} ${isPlayingResult ? `(${t.learn.playing})` : ''}`}
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg border-l-4 border-green-500">
                      <p className="text-sm text-gray-600 mb-1">
                        {locale === 'en' ? 'English' : '영어'} {t.learn.translation}
                      </p>
                      <p className="text-lg font-medium text-gray-900">{translation}</p>
                    </div>
                  </div>

                  {/* Keywords Display */}
                  {keywords.length > 0 && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center mb-3">
                        <Tag className="w-5 h-5 text-purple-600 mr-2" />
                        <h4 className="font-semibold text-purple-900">
                          {locale === 'en' ? 'Key Expressions Found' : '핵심 표현 발견'}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300"
                            title={keyword}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-purple-600 mt-2">
                        {locale === 'en' 
                          ? 'These are idioms, slang, or common phrases detected in your sentence'
                          : '문장에서 감지된 관용구, 속어 또는 일반적인 표현들입니다'
                        }
                      </p>
                    </div>
                  )}

                  {/* Explanation Display */}
                  {explanation && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center mb-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
                        <h4 className="font-semibold text-yellow-900">
                          {locale === 'en' ? 'Cultural Context' : '문화적 맥락'}
                        </h4>
                      </div>
                      <p className="text-sm text-yellow-800">{explanation}</p>
                    </div>
                  )}

                  {/* Save Status */}
                  {hasGrammarErrors && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                        <p className="text-sm text-red-800 font-medium">
                          {locale === 'en' 
                            ? 'Cannot save due to grammar errors. Please correct the sentence using the suggestions above.'
                            : '문법 오류로 인해 저장할 수 없습니다. 위의 제안을 사용하여 문장을 수정해주세요.'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {canSave && !saved && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          <p className="text-sm text-green-800 font-medium">
                            {locale === 'en' 
                              ? 'Grammar check passed! Ready to save to database.'
                              : '문법 검사 통과! 데이터베이스에 저장할 준비가 되었습니다.'
                            }
                          </p>
                        </div>
                        <button
                          onClick={handleSaveToDatabase}
                          disabled={loading}
                          className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          {loading 
                            ? (locale === 'en' ? 'Saving...' : '저장 중...')
                            : (locale === 'en' ? 'Save' : '저장')
                          }
                        </button>
                      </div>
                    </div>
                  )}

                  {saved && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Check className="w-5 h-5 text-blue-600 mr-2" />
                          <p className="text-sm text-blue-800 font-medium">
                            {locale === 'en' ? 'Successfully saved! 🎉' : '성공적으로 저장되었습니다! 🎉'}
                          </p>
                        </div>
                        <button
                          onClick={handleNextSentence}
                          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {locale === 'en' ? 'Next Sentence' : '다음 문장'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}