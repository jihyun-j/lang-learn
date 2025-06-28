import React, { useState } from 'react';
import { Plus, Sparkles, BookOpen, Check, Globe, Volume2 } from 'lucide-react';
import { translateSentence } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

export function Learn() {
  const [sentence, setSentence] = useState('');
  const [translation, setTranslation] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();

  const handleTranslate = async () => {
    if (!sentence.trim()) return;
    
    setLoading(true);
    try {
      const result = await translateSentence(sentence, selectedLanguage, '한국어');
      setTranslation(result.translation);
    } catch (error) {
      console.error('Translation failed:', error);
      alert('번역에 실패했습니다. OpenAI API 키를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!translation || !user) return;

    try {
      const { error } = await supabase
        .from('sentences')
        .insert({
          user_id: user.id,
          english_text: sentence,
          korean_translation: translation,
          keywords: [], // 빈 배열로 설정
          difficulty: difficulty,
          target_language: selectedLanguage, // Save the selected language
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => {
        setSentence('');
        setTranslation('');
        setDifficulty('medium');
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // Enhanced text-to-speech function with better language support
  const playAudio = (text: string) => {
    if (!text.trim()) return;

    // Language code mapping for better TTS support
    const languageMap: Record<string, string> = {
      '영어': 'en-US',
      '일본어': 'ja-JP',
      '중국어': 'zh-CN',
      '프랑스어': 'fr-FR',
      '독일어': 'de-DE',
      '스페인어': 'es-ES',
      '이탈리아어': 'it-IT',
      '러시아어': 'ru-RU',
      '포르투갈어': 'pt-BR',
      '아랍어': 'ar-SA'
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageMap[selectedLanguage] || 'en-US';
    
    // Set speech rate and pitch for better pronunciation
    utterance.rate = 0.8; // Slightly slower for learning
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Handle errors
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      alert(`발음 재생에 실패했습니다. ${selectedLanguage} 음성이 지원되지 않을 수 있습니다.`);
    };

    // Check if voices are available
    const voices = speechSynthesis.getVoices();
    const targetLang = languageMap[selectedLanguage] || 'en-US';
    const voice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
    
    if (voice) {
      utterance.voice = voice;
    }

    speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">오늘의 학습</h1>
        <p className="text-lg text-gray-600">새로운 문장을 입력하고 AI가 해석해드려요</p>
      </div>

      {/* Tips Section - Moved to top */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 학습 팁</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>일상에서 자주 사용하는 문장을 입력해보세요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>난이도를 적절히 설정하여 체계적으로 학습하세요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>AI 번역을 활용해서 정확한 해석을 받아보세요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>저장한 문장은 복습 모드에서 연습할 수 있어요</p>
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
                  현재 학습 언어: <span className="font-bold">{selectedLanguage}</span>
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                사이드바에서 다른 언어로 변경할 수 있습니다
              </p>
            </div>

            {/* Input Section */}
            <div>
              <label htmlFor="sentence" className="block text-sm font-medium text-gray-700 mb-3">
                {selectedLanguage} 문장을 입력해주세요
              </label>
              <div className="relative">
                <textarea
                  id="sentence"
                  rows={3}
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder={selectedLanguage === '영어' ? "예: How are you doing today?" : 
                              selectedLanguage === '프랑스어' ? "예: Comment allez-vous aujourd'hui?" :
                              selectedLanguage === '독일어' ? "예: Wie geht es Ihnen heute?" :
                              selectedLanguage === '스페인어' ? "예: ¿Cómo estás hoy?" :
                              selectedLanguage === '일본어' ? "예: 今日はいかがですか？" :
                              selectedLanguage === '중국어' ? "例: 你今天怎么样？" :
                              `${selectedLanguage} 문장을 입력하세요`}
                />
                {sentence.trim() && (
                  <button
                    onClick={() => playAudio(sentence)}
                    className="absolute right-3 top-3 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="발음 듣기"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                난이도 설정
              </label>
              <div className="flex space-x-4">
                {[
                  { value: 'easy', label: '쉬움', color: 'bg-green-100 text-green-800' },
                  { value: 'medium', label: '보통', color: 'bg-yellow-100 text-yellow-800' },
                  { value: 'hard', label: '어려움', color: 'bg-red-100 text-red-800' },
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

            {/* Translate Button */}
            <div className="flex justify-center">
              <button
                onClick={handleTranslate}
                disabled={loading || !sentence.trim()}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                {loading ? '번역중...' : 'AI 번역하기'}
              </button>
            </div>

            {/* Translation Result */}
            {translation && (
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">번역 결과</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-1">{selectedLanguage} 원문</p>
                          <p className="text-lg font-medium text-gray-900">{sentence}</p>
                        </div>
                        <button
                          onClick={() => playAudio(sentence)}
                          className="ml-3 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="발음 듣기"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border-l-4 border-green-500">
                      <p className="text-sm text-gray-600 mb-1">한국어 번역</p>
                      <p className="text-lg font-medium text-gray-900">{translation}</p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saved}
                    className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saved ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        저장완료!
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        문장 저장하기
                      </>
                    )}
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