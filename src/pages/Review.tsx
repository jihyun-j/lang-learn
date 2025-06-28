import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, Globe } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Sentence } from '../types';

export function Review() {
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [reviewCompleted, setReviewCompleted] = useState(false);
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
      setReviewCompleted(false);
      setTranscription('');
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

  const handleRecordingComplete = async () => {
    if (!recording || !currentSentence) return;

    setLoading(true);
    try {
      // In a real app, you'd use speech-to-text API here
      // For demo purposes, we'll use a placeholder transcription
      const mockTranscription = currentSentence.english_text; // Placeholder
      setTranscription(mockTranscription);

      // Save review session without pronunciation analysis
      await supabase
        .from('review_sessions')
        .insert({
          user_id: user!.id,
          sentence_id: currentSentence.id,
          pronunciation_score: 85, // Mock score
          grammar_score: 85, // Mock score
          overall_score: 85, // Mock score
          feedback: '좋은 발음입니다! 계속 연습하시면 더 나아질 거예요.',
        });

      setReviewCompleted(true);
    } catch (error) {
      console.error('Review save failed:', error);
      alert('복습 기록 저장에 실패했습니다. 다시 시도해주세요.');
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
    setReviewCompleted(false);
    setTranscription('');
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
        <p className="text-lg text-gray-600">음성으로 발음을 연습해보세요</p>
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

            {/* Audio Controls */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={playOriginalAudio}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Volume2 className="w-5 h-5 mr-2" />
                원문 듣기
              </button>
            </div>

            {/* Recording Section */}
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-6 rounded-full transition-all ${
                    isRecording
                      ? 'bg-red-100 text-red-600 animate-pulse'
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
                {isRecording ? '녹음 중... 버튼을 다시 눌러 중지하세요' : '마이크 버튼을 눌러 녹음을 시작하세요'}
              </p>

              {recording && !reviewCompleted && (
                <div className="space-y-4">
                  <audio controls src={recording.url} className="mx-auto" />
                  <button
                    onClick={handleRecordingComplete}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? '처리중...' : '복습 완료'}
                  </button>
                </div>
              )}
            </div>

            {/* Review Completed Section */}
            {reviewCompleted && (
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <div className="bg-green-50 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">복습 완료!</h3>
                  <p className="text-green-700">
                    좋은 발음입니다! 계속 연습하시면 더 나아질 거예요.
                  </p>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={nextSentence}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    다음 문장
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}