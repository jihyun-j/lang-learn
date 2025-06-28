import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, XCircle, Globe } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { transcribeAudio, compareSentences } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Sentence } from '../types';

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
  const { user } = useAuth();

  // Get current selected language from localStorage
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const saved = localStorage.getItem('selectedLanguage');
    const targetLanguages = user?.user_metadata?.target_languages || [user?.user_metadata?.target_language || '영어'];
    const languages = Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages];
    return saved && languages.includes(saved) ? saved : languages[0] || '영어';
  });
  
  const {
    isRecording,
    recording,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecorder();

  // Load random sentence for review
  useEffect(() => {
    loadRandomSentence();
  }, [user, selectedLanguage]);

  // Listen for language changes from the sidebar
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setSelectedLanguage(event.detail);
      setReviewResult(null);
      setTranscription('');
      setError('');
      clearRecording();
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [clearRecording]);

  const loadRandomSentence = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sentences')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_language', selectedLanguage) // Filter by selected language
        .order('created_at', { ascending: false })
        .limit(10); // Get more sentences to randomize

      if (error) throw error;
      if (data && data.length > 0) {
        // Pick a random sentence from the results
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
      // Step 1: Transcribe audio using OpenAI Whisper
      const spokenText = await transcribeAudio(recording.blob);
      setTranscription(spokenText);

      // Step 2: Compare with original sentence
      const comparisonResult = await compareSentences(
        currentSentence.english_text,
        spokenText
      );
      
      setReviewResult({
        isCorrect: comparisonResult.isCorrect,
        similarity: comparisonResult.similarity,
        feedback: comparisonResult.feedback
      });

      // Step 3: Save review session
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

  const playOriginalAudio = () => {
    // In a real app, you'd use text-to-speech API
    const utterance = new SpeechSynthesisUtterance(currentSentence?.english_text);
    utterance.lang = selectedLanguage === '영어' ? 'en-US' : 
                    selectedLanguage === '일본어' ? 'ja-JP' :
                    selectedLanguage === '중국어' ? 'zh-CN' :
                    selectedLanguage === '프랑스어' ? 'fr-FR' :
                    selectedLanguage === '독일어' ? 'de-DE' :
                    selectedLanguage === '스페인어' ? 'es-ES' : 'en-US';
    speechSynthesis.speak(utterance);
  };

  const nextSentence = () => {
    setReviewResult(null);
    setTranscription('');
    setError('');
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
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-8">
            {/* Korean Translation (Question) */}
            <div className="text-center bg-blue-50 rounded-lg p-8">
              <h2 className="text-sm font-medium text-blue-600 mb-2">
                다음 문장을 {selectedLanguage}로 말해보세요
              </h2>
              <p className="text-2xl font-bold text-blue-900">{currentSentence.korean_translation}</p>
            </div>

            {/* Original Sentence Display */}
            <div className="text-center bg-gray-50 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">정답</h3>
              <p className="text-lg font-medium text-gray-900">{currentSentence.english_text}</p>
              <button
                onClick={playOriginalAudio}
                className="mt-3 flex items-center justify-center mx-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                발음 듣기
              </button>
            </div>

            {/* Recording Section */}
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={loading}
                  className={`p-6 rounded-full transition-all ${
                    isRecording
                      ? 'bg-red-100 text-red-600 animate-pulse'
                      : loading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
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
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 복습 팁</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>정답을 먼저 들어보고 따라 말해보세요</p>
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
              <p>틀려도 괜찮아요! 계속 연습하면 향상됩니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}