import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, XCircle, Globe } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { transcribeAudio, compareSentences } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Sentence } from '../types';
import { speakText, stopSpeech, isSpeaking } from '../utils/textToSpeech';

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
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  
  const {
    isRecording,
    recording,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecorder();

  // Load random sentence for review
  useEffect(() => {
    if (selectedLanguage) {
      loadRandomSentence();
    }
  }, [user, selectedLanguage]);

  const loadRandomSentence = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sentences')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_language', selectedLanguage)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentSentence(data[randomIndex]);
      }
    } catch (error) {
      console.error('Failed to load sentence:', error);
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
      setError(error instanceof Error ? error.message : '분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const playOriginalAudio = async () => {
      const voices = window.speechSynthesis.getVoices();
      const utterance = new SpeechSynthesisUtterance("Bonjour");
      utterance.lang = 'fr-FR'
      utterance.rate = 0.8; // 조금 천천히
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance)
  };


  const nextSentence = () => {
    setReviewResult(null);
    setTranscription('');
    setError('');
    setAudioError(null);
    setIsPlayingAudio(false);
    clearRecording();
    loadRandomSentence();
  };

  if (!currentSentence) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-4">
          <Globe className="w-6 h-6 text-blue-600 mr-2" />
          <span className="text-lg font-medium text-gray-700">{selectedLanguage}</span>
        </div>
        <p className="text-lg text-gray-600">
          {selectedLanguage}로 복습할 문장이 없습니다.
        </p>
        <p className="text-sm text-gray-500 mt-2">먼저 '오늘의 학습'에서 문장을 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Globe className="w-6 h-6 text-blue-600 mr-2" />
          <span className="text-lg font-medium text-blue-600">{selectedLanguage}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">오늘의 복습</h1>
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
            {/* Korean Translation (Question) with Audio Button */}
            <div className="text-center bg-blue-50 rounded-lg p-8">
              <h2 className="text-sm font-medium text-blue-600 mb-2">
                다음 문장을 {selectedLanguage}로 말해보세요
              </h2>
              <p className="text-2xl font-bold text-blue-900 mb-6">{currentSentence.korean_translation}</p>
              
              {/* Pronunciation button */}
              <button
                onClick={playOriginalAudio}
                disabled={isPlayingAudio}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium shadow-md transition-all transform hover:scale-105 ${
                  isPlayingAudio
                    ? 'bg-blue-700 text-white animate-pulse shadow-lg scale-105'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
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
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    onClick={nextSentence}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    다음 문장
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
                    <strong>{selectedLanguage} 발음 재생 중...</strong> 중지하려면 발음 듣기 버튼을 다시 클릭하세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 복습 팁</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>발음 듣기 버튼으로 원어민 발음을 들어보세요</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>명확하고 천천히 발음하는 것이 중요해요</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>AI가 음성을 인식하여 정확도를 판별해드려요</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>정답은 분석 후에만 공개됩니다</p>
            </div>
          </div>

          {/* Language-specific tip */}
          {selectedLanguage === '프랑스어' && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-start">
                <span className="text-2xl mr-3">🇫🇷</span>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">프랑스어 발음 특화 기능</p>
                  <p className="text-sm text-blue-800">
                    새로운 TTS 시스템으로 <strong>정확한 프랑스어 발음</strong>을 제공합니다! 
                    연음(liaison)과 무음 문자에 주의하며 들어보세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}