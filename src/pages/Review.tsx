import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, XCircle, Globe, Calendar, Target, AlertTriangle, Filter } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { transcribeAudio, compareSentences } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useLocale } from '../hooks/useLocale';
import { getTranslation } from '../utils/translations';
import { Sentence } from '../types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

type ReviewType = 'recent' | 'difficulty' | 'mistakes';

export function Review() {
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [reviewResult, setReviewResult] = useState<{
    isCorrect: boolean;
    similarity: number;
    feedback: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // 새로운 상태들
  const [reviewType, setReviewType] = useState<ReviewType>('recent');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [availableSentences, setAvailableSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  const { locale } = useLocale();
  const t = getTranslation(locale);
  
  const {
    isRecording,
    recording,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecorder();

  // Load sentences based on review type
  useEffect(() => {
    if (selectedLanguage && user) {
      loadSentencesByType();
    }
  }, [user, selectedLanguage, reviewType, selectedDate, selectedDifficulty]);

  const loadSentencesByType = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('sentences')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_language', selectedLanguage);

      switch (reviewType) {
        case 'recent':
          // 선택된 날짜의 문장들
          const startDate = startOfDay(new Date(selectedDate));
          const endDate = endOfDay(new Date(selectedDate));
          query = query
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });
          break;

        case 'difficulty':
          // 선택된 난이도의 문장들
          query = query
            .eq('difficulty', selectedDifficulty)
            .order('created_at', { ascending: false })
            .limit(20);
          break;

        case 'mistakes':
          // 자주 틀리는 문장들 (낮은 점수의 리뷰 세션이 있는 문장들)
          const { data: poorReviews } = await supabase
            .from('review_sessions')
            .select('sentence_id')
            .eq('user_id', user.id)
            .lt('overall_score', 70)
            .order('created_at', { ascending: false })
            .limit(50);

          if (poorReviews && poorReviews.length > 0) {
            const sentenceIds = [...new Set(poorReviews.map(r => r.sentence_id))];
            query = query.in('id', sentenceIds);
          } else {
            // 틀린 문장이 없으면 최근 문장들로 대체
            query = query.order('created_at', { ascending: false }).limit(10);
          }
          break;
      }

      const { data, error } = await query;
      if (error) throw error;

      setAvailableSentences(data || []);
      setCurrentIndex(0);
      
      if (data && data.length > 0) {
        setCurrentSentence(data[0]);
      } else {
        setCurrentSentence(null);
      }
    } catch (error) {
      console.error('Failed to load sentences:', error);
      setAvailableSentences([]);
      setCurrentSentence(null);
    }
  };

  const handleRecordingAnalysis = async () => {
    if (!recording || !currentSentence) return;

    setLoading(true);
    setError('');
    
    try {
      const spokenText = await transcribeAudio(recording.blob);
      setTranscription(spokenText);

      const comparisonResult = await compareSentences(
        currentSentence.english_text,
        spokenText
      );
      
      setReviewResult({
        isCorrect: comparisonResult.isCorrect,
        similarity: comparisonResult.similarity,
        feedback: comparisonResult.feedback
      });

      await supabase
        .from('review_sessions')
        .insert({
          user_id: user!.id,
          sentence_id: currentSentence.id,
          pronunciation_score: comparisonResult.similarity,
          grammar_score: comparisonResult.isCorrect ? 90 : 60,
          overall_score: comparisonResult.isCorrect ? 90 : 60,
          feedback: comparisonResult.feedback,
        });

    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : t.errors.unknownError);
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

  const playOriginalAudio = async () => {
    if (!currentSentence) return;

    setAudioError(null);

    try {
      // 이미 재생 중인 경우 중지
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }

      // 다른 음성 중지
      window.speechSynthesis.cancel();
      setIsPlayingAudio(true);

      // 음성 합성 설정
      const utterance = new SpeechSynthesisUtterance(currentSentence.english_text);
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
        setIsPlayingAudio(false);
      };

      // 에러 처리
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlayingAudio(false);
        setAudioError(`${t.errors.audioFailed}: ${event.error}`);
        setTimeout(() => setAudioError(null), 3000);
      };

      // 음성 재생
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlayingAudio(false);
      
      const errorMessage = error instanceof Error ? error.message : t.errors.unknownError;
      setAudioError(errorMessage);
      
      // 3초 후 에러 메시지 자동 제거
      setTimeout(() => setAudioError(null), 3000);
    }
  };

  const nextSentence = () => {
    setReviewResult(null);
    setTranscription('');
    setError('');
    setAudioError(null);
    setIsPlayingAudio(false);
    clearRecording();
    
    // 다음 문장으로 이동
    if (availableSentences.length > 0) {
      const nextIndex = (currentIndex + 1) % availableSentences.length;
      setCurrentIndex(nextIndex);
      setCurrentSentence(availableSentences[nextIndex]);
    }
  };

  const getReviewTypeInfo = () => {
    switch (reviewType) {
      case 'recent':
        return {
          title: t.review.byDate,
          description: `${format(new Date(selectedDate), 'yyyy년 MM월 dd일')}${locale === 'en' ? ' learned sentences' : '에 학습한 문장들'}`,
          icon: Calendar,
          color: 'blue'
        };
      case 'difficulty':
        return {
          title: t.review.byDifficulty,
          description: `${selectedDifficulty === 'easy' ? t.common.easy : selectedDifficulty === 'medium' ? t.common.medium : t.common.hard} ${locale === 'en' ? 'difficulty sentences' : '난이도 문장들'}`,
          icon: Target,
          color: 'green'
        };
      case 'mistakes':
        return {
          title: t.review.mistakes,
          description: t.review.mistakesDesc,
          icon: AlertTriangle,
          color: 'orange'
        };
    }
  };

  const typeInfo = getReviewTypeInfo();
  const TypeIcon = typeInfo.icon;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Globe className="w-6 h-6 text-blue-600 mr-2" />
          <span className="text-lg font-medium text-blue-600">{selectedLanguage}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.review.title}</h1>
        <p className="text-lg text-gray-600">{t.review.subtitle}</p>
      </div>

      {/* Review Type Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.review.selectType}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setReviewType('recent')}
            className={`p-4 rounded-lg border-2 transition-all ${
              reviewType === 'recent'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Calendar className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-semibold">{t.review.byDate}</h3>
            <p className="text-sm mt-1">{t.review.byDateDesc}</p>
          </button>

          <button
            onClick={() => setReviewType('difficulty')}
            className={`p-4 rounded-lg border-2 transition-all ${
              reviewType === 'difficulty'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Target className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-semibold">{t.review.byDifficulty}</h3>
            <p className="text-sm mt-1">{t.review.byDifficultyDesc}</p>
          </button>

          <button
            onClick={() => setReviewType('mistakes')}
            className={`p-4 rounded-lg border-2 transition-all ${
              reviewType === 'mistakes'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-semibold">{t.review.mistakes}</h3>
            <p className="text-sm mt-1">{t.review.mistakesDesc}</p>
          </button>
        </div>

        {/* Type-specific controls */}
        <div className="space-y-4">
          {reviewType === 'recent' && (
            <div>
              <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700 mb-2">
                {t.review.selectDate}
              </label>
              <input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {reviewType === 'difficulty' && (
            <div>
              <label htmlFor="difficulty-select" className="block text-sm font-medium text-gray-700 mb-2">
                {t.review.selectDifficulty}
              </label>
              <div className="flex space-x-3">
                {[
                  { value: 'easy', label: t.common.easy, color: 'bg-green-100 text-green-800' },
                  { value: 'medium', label: t.common.medium, color: 'bg-yellow-100 text-yellow-800' },
                  { value: 'hard', label: t.common.hard, color: 'bg-red-100 text-red-800' },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setSelectedDifficulty(level.value as 'easy' | 'medium' | 'hard')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedDifficulty === level.value
                        ? level.color + ' ring-2 ring-offset-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current selection info */}
        <div className={`mt-6 p-4 rounded-lg bg-${typeInfo.color}-50 border border-${typeInfo.color}-200`}>
          <div className="flex items-center">
            <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-600 mr-2`} />
            <div>
              <h4 className={`font-semibold text-${typeInfo.color}-900`}>{typeInfo.title}</h4>
              <p className={`text-sm text-${typeInfo.color}-700`}>
                {typeInfo.description} • {availableSentences.length}{locale === 'en' ? ' sentences ready' : '개 문장 준비됨'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Content */}
      {!currentSentence ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <TypeIcon className={`w-12 h-12 text-${typeInfo.color}-400`} />
          </div>
          <p className="text-lg text-gray-600">
            {t.review.noSentences}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t.review.noSentencesHint}
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Audio Error Display */}
          {audioError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Volume2 className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>{t.errors.audioFailed}:</strong> {audioError}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-8">
              {/* Progress indicator */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {currentIndex + 1} / {availableSentences.length}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-${typeInfo.color}-500 transition-all duration-300`}
                    style={{ width: `${((currentIndex + 1) / availableSentences.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Korean Translation (Question) with Audio Button */}
              <div className="text-center bg-blue-50 rounded-lg p-8">
                <h2 className="text-sm font-medium text-blue-600 mb-2">
                  {t.review.speakSentence} {selectedLanguage}{locale === 'en' ? '' : '로 말해보세요'}
                </h2>
                <p className="text-2xl font-bold text-blue-900 mb-6">{currentSentence.korean_translation}</p>
                
                {/* Pronunciation button */}
                <button
                  onClick={playOriginalAudio}
                  disabled={loading}
                  className={`inline-flex items-center px-6 py-3 rounded-lg font-medium shadow-md transition-all transform hover:scale-105 ${
                    isPlayingAudio
                      ? 'bg-blue-700 text-white animate-pulse shadow-lg scale-105'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                  }`}
                  title={`${selectedLanguage} ${t.review.tipPronunciation} ${isPlayingAudio ? `(${t.review.audioPlaying})` : ''}`}
                >
                  <Volume2 className={`w-5 h-5 mr-2 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                  {isPlayingAudio ? t.review.audioPlaying : t.quiz.listenPronunciation}
                </button>
              </div>

              {/* Recording Section */}
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={loading}
                    className={`p-6 rounded-full transition-all shadow-lg transform hover:scale-105 ${
                      isRecording
                        ? 'bg-red-100 text-red-600 animate-pulse scale-110'
                        : loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-600 hover:bg-green-200 hover:shadow-xl'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-12 h-12" />
                    ) : (
                      <Mic className="w-12 h-12" />
                    )}
                  </button>
                </div>
                
                <p className="text-sm text-gray-600">
                  {isRecording 
                    ? t.review.recording
                    : loading 
                      ? t.review.analyzing
                      : t.review.recordingHint
                  }
                </p>

                {recording && !reviewResult && !loading && (
                  <div className="space-y-4">
                    <audio controls src={recording.url} className="mx-auto" />
                    <button
                      onClick={handleRecordingAnalysis}
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t.review.analyze}
                    </button>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Transcription Display */}
              {transcription && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{t.review.recognized}</h3>
                  <p className="text-lg text-gray-900">{transcription}</p>
                </div>
              )}

              {/* Review Result Section */}
              {reviewResult && (
                <div className="space-y-6 pt-6 border-t border-gray-200">
                  <div className={`rounded-lg p-6 text-center ${
                    reviewResult.isCorrect 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <div className="flex items-center justify-center mb-4">
                      {reviewResult.isCorrect ? (
                        <CheckCircle className="w-12 h-12 text-green-500" />
                      ) : (
                        <XCircle className="w-12 h-12 text-orange-500" />
                      )}
                    </div>
                    
                    <h3 className={`text-xl font-bold mb-2 ${
                      reviewResult.isCorrect ? 'text-green-900' : 'text-orange-900'
                    }`}>
                      {reviewResult.isCorrect ? t.review.correct : t.review.incorrect}
                    </h3>
                    
                    <div className="mb-4">
                      <p className={`text-sm font-medium mb-1 ${
                        reviewResult.isCorrect ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {t.review.similarity}: {reviewResult.similarity}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            reviewResult.isCorrect ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${reviewResult.similarity}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <p className={`${
                      reviewResult.isCorrect ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {reviewResult.feedback}
                    </p>

                    {/* Show the correct answer only after the user has attempted */}
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <p className="text-sm text-gray-600 mb-1">{t.review.answer}</p>
                      <p className="text-lg font-medium text-gray-900">{currentSentence.english_text}</p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={nextSentence}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      {t.review.nextSentence}
                    </button>
                  </div>
                </div>
              )}

              {/* Audio Status Indicator */}
              {isPlayingAudio && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                  <div className="flex items-center">
                    <Volume2 className="w-4 h-4 text-blue-600 mr-2 animate-pulse" />
                    <p className="text-sm text-blue-800">
                      <strong>{selectedLanguage} {t.review.audioPlaying}</strong> {t.review.audioPlayingHint}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}