import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, BookOpen, Check, Globe, Volume2, AlertCircle, CheckCircle, XCircle, Lightbulb, FileText } from 'lucide-react';
import { translateSentence, checkGrammarAndSpelling, GrammarCheckResult } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useLocale } from '../hooks/useLocale';
import { getTranslation } from '../utils/translations';

export function Learn() {
  const [sentence, setSentence] = useState('');
  const [translation, setTranslation] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPlayingInput, setIsPlayingInput] = useState(false);
  const [isPlayingResult, setIsPlayingResult] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // 문법 검사 관련 상태
  const [grammarCheck, setGrammarCheck] = useState<GrammarCheckResult | null>(null);
  const [grammarCheckLoading, setGrammarCheckLoading] = useState(false);
  const [showGrammarCheck, setShowGrammarCheck] = useState(false);
  const [grammarCheckError, setGrammarCheckError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  const { locale } = useLocale();
  const t = getTranslation(locale);

  // 수동 문법 검사 함수
  const handleManualGrammarCheck = async () => {
    if (!sentence.trim()) {
      alert(t.learn.enterSentence);
      return;
    }

    setGrammarCheckLoading(true);
    setGrammarCheckError(null);
    setShowGrammarCheck(false);

    try {
      const result = await checkGrammarAndSpelling(sentence, selectedLanguage);
      setGrammarCheck(result);
      setShowGrammarCheck(true);
    } catch (error) {
      console.error('Grammar check failed:', error);
      setGrammarCheckError(error instanceof Error ? error.message : t.errors.grammarCheckFailed);
      setGrammarCheck(null);
      setShowGrammarCheck(false);
    } finally {
      setGrammarCheckLoading(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setSentence(suggestion);
    setGrammarCheck(null);
    setShowGrammarCheck(false);
  };

  const applyCorrection = (original: string, suggestion: string) => {
    const correctedSentence = sentence.replace(original, suggestion);
    setSentence(correctedSentence);
  };

  // AI 번역 없이 바로 저장하는 함수
  const handleDirectSave = async () => {
    if (!sentence.trim() || !user) return;
    
    setLoading(true);
    try {
      // 사용자가 입력한 문장을 그대로 번역으로 사용 (또는 기본 번역 메시지)
      const defaultTranslation = locale === 'en' 
        ? 'Translation will be added later' 
        : '번역은 나중에 추가됩니다';

      const { error } = await supabase
        .from('sentences')
        .insert({
          user_id: user.id,
          english_text: sentence,
          korean_translation: defaultTranslation,
          keywords: [],
          difficulty: difficulty,
          target_language: selectedLanguage,
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => {
        setSentence('');
        setTranslation('');
        setDifficulty('medium');
        setSaved(false);
        setGrammarCheck(null);
        setShowGrammarCheck(false);
      }, 2000);
    } catch (error) {
      console.error('Save failed:', error);
      alert(t.errors.saveFailed);
    } finally {
      setLoading(false);
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

  // 음성 재생 함수
  const playAudio = async (text: string, isInput: boolean = false) => {
    if (!text.trim()) return;

    setAudioError(null);

    try {
      const currentlyPlaying = isInput ? isPlayingInput : isPlayingResult;
      
      // 이미 재생 중인 경우 중지
      if (currentlyPlaying) {
        window.speechSynthesis.cancel();
        setIsPlayingInput(false);
        setIsPlayingResult(false);
        return;
      }

      // 다른 음성 중지
      window.speechSynthesis.cancel();

      if (isInput) {
        setIsPlayingInput(true);
      } else {
        setIsPlayingResult(true);
      }

      // 음성 합성 설정
      const utterance = new SpeechSynthesisUtterance(text);
      const languageCode = getLanguageCode(selectedLanguage);
      utterance.lang = languageCode;
      utterance.rate = 0.8; // 조금 느리게
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
        setIsPlayingInput(false);
        setIsPlayingResult(false);
      };

      // 에러 처리
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlayingInput(false);
        setIsPlayingResult(false);
        setAudioError(`${t.learn.audioError} ${event.error}`);
        setTimeout(() => setAudioError(null), 3000);
      };

      // 음성 재생
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlayingInput(false);
      setIsPlayingResult(false);
      
      const errorMessage = error instanceof Error ? error.message : t.errors.unknownError;
      setAudioError(errorMessage);
      
      // 3초 후 에러 메시지 자동 제거
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

      {/* Tips Section - Moved to top */}
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
                  {t.learn.currentLanguage} <span className="font-bold">{selectedLanguage}</span>
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {t.learn.languageHint}
              </p>
            </div>

            {/* Input Section */}
            <div>
              <label htmlFor="sentence" className="block text-sm font-medium text-gray-700 mb-3">
                {selectedLanguage} {t.learn.enterSentence}
              </label>
              <div className="relative">
                <textarea
                  id="sentence"
                  rows={3}
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                  placeholder={selectedLanguage === '영어' ? "예: How are you doing today?" : 
                              selectedLanguage === '프랑스어' ? "예: Comment allez-vous aujourd'hui?" :
                              selectedLanguage === '독일어' ? "예: Wie geht es Ihnen heute?" :
                              selectedLanguage === '스페인어' ? "예: ¿Cómo estás hoy?" :
                              selectedLanguage === '일본어' ? "예: 今日はいかがですか？" :
                              selectedLanguage === '중국어' ? "例: 你今天怎么样？" :
                              `${selectedLanguage} ${t.learn.enterSentence}`}
                />
                
                {/* Input Box Controls */}
                <div className="absolute right-3 top-3 flex items-center space-x-2">
                  {/* Grammar Check Button */}
                  <button
                    onClick={handleManualGrammarCheck}
                    disabled={grammarCheckLoading || !sentence.trim()}
                    className={`p-2 transition-all rounded-lg ${
                      grammarCheckLoading
                        ? 'text-blue-600 bg-blue-100 animate-pulse'
                        : sentence.trim()
                          ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                          : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title={grammarCheckLoading ? t.learn.analyzing : t.learn.grammarCheck}
                  >
                    {grammarCheckLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </button>
                  
                  {/* Audio Play Button */}
                  {sentence.trim() && (
                    <button
                      onClick={() => playAudio(sentence, true)}
                      disabled={isPlayingInput}
                      className={`p-2 transition-all rounded-lg ${
                        isPlayingInput
                          ? 'text-white bg-blue-600 animate-pulse shadow-lg'
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title={`${selectedLanguage} ${t.learn.playPronunciation} ${isPlayingInput ? `(${t.learn.playing})` : ''}`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Grammar Check Results */}
            {showGrammarCheck && grammarCheck && (
              <div className="space-y-4">
                {/* Overall Status */}
                <div className={`p-4 rounded-lg border ${
                  grammarCheck.isCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {grammarCheck.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                      )}
                      <h4 className={`font-semibold ${
                        grammarCheck.isCorrect ? 'text-green-900' : 'text-orange-900'
                      }`}>
                        {grammarCheck.isCorrect ? t.learn.grammarErrors : t.learn.errorsFound}
                      </h4>
                    </div>
                    <span className={`text-sm font-medium ${
                      grammarCheck.isCorrect ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {t.learn.confidence} {grammarCheck.confidence}%
                    </span>
                  </div>
                  
                  {!grammarCheck.isCorrect && (
                    <p className="text-sm text-orange-700 mt-2">
                      {grammarCheck.errors.length}{t.learn.errorsDetected} {t.learn.checkSuggestions}
                    </p>
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

            {/* Direct Save Button */}
            <div className="flex justify-center">
              <button
                onClick={handleDirectSave}
                disabled={loading || !sentence.trim()}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : saved ? (
                  <Check className="w-5 h-5 mr-2" />
                ) : (
                  <Plus className="w-5 h-5 mr-2" />
                )}
                {loading ? t.learn.translating : saved ? t.learn.saved : t.learn.saveSentence}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}