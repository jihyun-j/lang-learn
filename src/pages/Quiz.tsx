import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, XCircle, Globe, Trophy, Target } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { transcribeAudio, compareSentences } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Sentence } from '../types';

export function Quiz() {
  const [quizSentences, setQuizSentences] = useState<Sentence[]>([]);
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
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
  const [quizResults, setQuizResults] = useState<{
    correct: number;
    total: number;
    scores: number[];
  }>({ correct: 0, total: 0, scores: [] });
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  
  const {
    isRecording,
    recording,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecorder();

  // Load random 10 sentences for quiz
  useEffect(() => {
    if (selectedLanguage && user && !quizStarted) {
      loadQuizSentences();
    }
  }, [user, selectedLanguage]);

  const loadQuizSentences = async () => {
    if (!user) return;

    try {
      // Get all sentences for the selected language
      const { data: allSentences, error } = await supabase
        .from('sentences')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_language', selectedLanguage);

      if (error) throw error;

      if (allSentences && allSentences.length > 0) {
        // Shuffle and take 10 sentences (or all if less than 10)
        const shuffled = [...allSentences].sort(() => Math.random() - 0.5);
        const quizSet = shuffled.slice(0, Math.min(10, shuffled.length));
        
        setQuizSentences(quizSet);
        setCurrentSentence(quizSet[0]);
        setCurrentIndex(0);
        setQuizResults({ correct: 0, total: 0, scores: [] });
        setQuizCompleted(false);
      } else {
        setQuizSentences([]);
        setCurrentSentence(null);
      }
    } catch (error) {
      console.error('Failed to load quiz sentences:', error);
      setQuizSentences([]);
      setCurrentSentence(null);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setQuizCompleted(false);
    setCurrentIndex(0);
    if (quizSentences.length > 0) {
      setCurrentSentence(quizSentences[0]);
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

      // Update quiz results
      const newScores = [...quizResults.scores, comparisonResult.similarity];
      const newCorrect = quizResults.correct + (comparisonResult.isCorrect ? 1 : 0);
      const newTotal = quizResults.total + 1;

      setQuizResults({
        correct: newCorrect,
        total: newTotal,
        scores: newScores
      });

      // Save review session
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
      setError(error instanceof Error ? error.message : '분석에 실패했습니다. 다시 시도해주세요.');
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
        setAudioError(`음성 재생 중 오류가 발생했습니다: ${event.error}`);
        setTimeout(() => setAudioError(null), 3000);
      };

      // 음성 재생
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlayingAudio(false);
      
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setAudioError(errorMessage);
      
      // 3초 후 에러 메시지 자동 제거
      setTimeout(() => setAudioError(null), 3000);
    }
  };

  const nextQuestion = () => {
    setReviewResult(null);
    setTranscription('');
    setError('');
    setAudioError(null);
    setIsPlayingAudio(false);
    clearRecording();
    
    // Check if quiz is completed
    if (currentIndex + 1 >= quizSentences.length) {
      setQuizCompleted(true);
      return;
    }
    
    // Move to next question
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setCurrentSentence(quizSentences[nextIndex]);
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentIndex(0);
    setReviewResult(null);
    setTranscription('');
    setError('');
    setAudioError(null);
    setIsPlayingAudio(false);
    clearRecording();
    loadQuizSentences();
  };

  const getQuizGrade = () => {
    const percentage = (quizResults.correct / quizResults.total) * 100;
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', message: '완벽해요! 🏆' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', message: '훌륭해요! 🎉' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', message: '잘했어요! 👏' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', message: '좋아요! 💪' };
    return { grade: 'D', color: 'text-orange-600', message: '더 연습해봐요! 📚' };
  };

  // Quiz not started screen
  if (!quizStarted) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-purple-100 rounded-full">
              <Trophy className="w-12 h-12 text-purple-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">퀴즈 모드</h1>
          <p className="text-lg text-gray-600">랜덤으로 선택된 문장들로 실력을 테스트해보세요</p>
        </div>

        {/* Current Language Display */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-100 rounded-xl p-6">
          <div className="flex items-center justify-center">
            <Globe className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">
              퀴즈 언어: <span className="text-purple-600">{selectedLanguage}</span>
            </h2>
          </div>
          <p className="text-center text-gray-600 mt-2">
            {selectedLanguage}로 학습한 문장들 중에서 랜덤으로 출제됩니다
          </p>
        </div>

        {quizSentences.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center mb-4">
              <Target className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-lg text-gray-600">
              {selectedLanguage}로 퀴즈를 풀 수 있는 문장이 없습니다.
            </p>
            <p className="text-sm text-gray-500 mt-2">먼저 '오늘의 학습'에서 문장을 추가해보세요.</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center space-y-6">
                <div className="p-6 bg-purple-50 rounded-lg">
                  <h3 className="text-xl font-bold text-purple-900 mb-4">퀴즈 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-center p-3 bg-white rounded-lg">
                      <Target className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="font-medium">문제 수: {Math.min(10, quizSentences.length)}개</span>
                    </div>
                    <div className="flex items-center justify-center p-3 bg-white rounded-lg">
                      <Globe className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="font-medium">언어: {selectedLanguage}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">퀴즈 규칙</h4>
                  <div className="text-left space-y-2 text-sm text-gray-600">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>한국어 문장을 보고 {selectedLanguage}로 발음하세요</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>AI가 발음의 정확도를 실시간으로 분석합니다</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>모든 문제를 풀면 최종 점수가 표시됩니다</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>발음 듣기 버튼으로 정답을 미리 들을 수 있어요</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={startQuiz}
                  className="w-full flex items-center justify-center px-8 py-4 bg-purple-600 text-white rounded-lg font-bold text-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all transform hover:scale-105"
                >
                  <Trophy className="w-6 h-6 mr-3" />
                  퀴즈 시작하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Quiz completed screen
  if (quizCompleted) {
    const gradeInfo = getQuizGrade();
    const averageScore = quizResults.scores.reduce((a, b) => a + b, 0) / quizResults.scores.length;

    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-purple-100 rounded-full">
              <Trophy className="w-12 h-12 text-purple-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">퀴즈 완료!</h1>
          <p className="text-lg text-gray-600">수고하셨습니다! 결과를 확인해보세요</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center space-y-6">
              {/* Grade Display */}
              <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                <div className={`text-6xl font-bold ${gradeInfo.color} mb-2`}>
                  {gradeInfo.grade}
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  {gradeInfo.message}
                </p>
                <p className="text-lg text-gray-600">
                  {quizResults.correct}/{quizResults.total} 정답 ({Math.round((quizResults.correct / quizResults.total) * 100)}%)
                </p>
              </div>

              {/* Detailed Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">정답률</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round((quizResults.correct / quizResults.total) * 100)}%
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">평균 유사도</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(averageScore)}%
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={restartQuiz}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  다시 도전하기
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  문장 리스트로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  if (!currentSentence) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-4">
          <Globe className="w-6 h-6 text-purple-600 mr-2" />
          <span className="text-lg font-medium text-gray-700">{selectedLanguage}</span>
        </div>
        <p className="text-lg text-gray-600">퀴즈 문제를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Globe className="w-6 h-6 text-purple-600 mr-2" />
          <span className="text-lg font-medium text-purple-600">{selectedLanguage}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">퀴즈 진행 중</h1>
        <p className="text-lg text-gray-600">음성으로 발음을 연습하고 AI가 정확도를 판별해드려요</p>
      </div>

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
                  <strong>음성 재생 오류:</strong> {audioError}
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
                문제 {currentIndex + 1} / {quizSentences.length}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / quizSentences.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                정답: {quizResults.correct}/{quizResults.total}
              </p>
            </div>

            {/* Korean Translation (Question) with Audio Button */}
            <div className="text-center bg-purple-50 rounded-lg p-8">
              <h2 className="text-sm font-medium text-purple-600 mb-2">
                다음 문장을 {selectedLanguage}로 말해보세요
              </h2>
              <p className="text-2xl font-bold text-purple-900 mb-6">{currentSentence.korean_translation}</p>
              
              {/* Pronunciation button */}
              <button
                onClick={playOriginalAudio}
                disabled={loading}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium shadow-md transition-all transform hover:scale-105 ${
                  isPlayingAudio
                    ? 'bg-purple-700 text-white animate-pulse shadow-lg scale-105'
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                }`}
                title={`${selectedLanguage} 발음 듣기 ${isPlayingAudio ? '(재생 중... 클릭하면 중지)' : ''}`}
              >
                <Volume2 className={`w-5 h-5 mr-2 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                {isPlayingAudio ? '재생 중...' : '발음 듣기'}
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
                  ? '녹음 중... 버튼을 다시 눌러 중지하세요' 
                  : loading 
                    ? '분석 중입니다...'
                    : '마이크 버튼을 눌러 녹음을 시작하세요'
                }
              </p>

              {recording && !reviewResult && !loading && (
                <div className="space-y-4">
                  <audio controls src={recording.url} className="mx-auto" />
                  <button
                    onClick={handleRecordingAnalysis}
                    disabled={loading}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    AI 분석하기
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
                <h3 className="text-sm font-medium text-gray-600 mb-2">인식된 음성</h3>
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
                    {reviewResult.isCorrect ? '정답입니다! 🎉' : '아쉬워요! 😊'}
                  </h3>
                  
                  <div className="mb-4">
                    <p className={`text-sm font-medium mb-1 ${
                      reviewResult.isCorrect ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      유사도: {reviewResult.similarity}%
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
                    <p className="text-sm text-gray-600 mb-1">정답</p>
                    <p className="text-lg font-medium text-gray-900">{currentSentence.english_text}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={nextQuestion}
                    className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    {currentIndex + 1 >= quizSentences.length ? '결과 보기' : '다음 문제'}
                  </button>
                </div>
              </div>
            )}

            {/* Audio Status Indicator */}
            {isPlayingAudio && (
              <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-300">
                <div className="flex items-center">
                  <Volume2 className="w-4 h-4 text-purple-600 mr-2 animate-pulse" />
                  <p className="text-sm text-purple-800">
                    <strong>{selectedLanguage} 발음 재생 중...</strong> 중지하려면 발음 듣기 버튼을 다시 클릭하세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">💡 퀴즈 팁</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>발음 듣기 버튼으로 원어민 발음을 들어보세요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>명확하고 천천히 발음하는 것이 중요해요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>AI가 음성을 인식하여 정확도를 판별해드려요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>모든 문제를 풀면 최종 점수가 표시됩니다</p>
          </div>
        </div>

        {/* Language-specific tip */}
        <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
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
              <p className="text-sm font-semibold text-purple-900 mb-1">{selectedLanguage} 퀴즈 모드</p>
              <p className="text-sm text-purple-800">
                현재 학습 중인 <strong>{selectedLanguage}</strong>의 정확한 발음을 제공합니다! 
                퀴즈를 통해 실력을 테스트하고 약점을 파악해보세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}