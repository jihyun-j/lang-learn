import React, { useState, useEffect } from 'react';
import { Calendar, List, Shuffle, Search, Filter, Volume2, Edit3, Trash2, BookOpen, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Sentence } from '../types';
import { format } from 'date-fns';

export function Sentences() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();

  const itemsPerPage = 12;

  useEffect(() => {
    if (user && selectedLanguage) {
      loadSentences();
    }
  }, [user, currentPage, searchTerm, difficultyFilter, selectedLanguage]);

  const loadSentences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('sentences')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('target_language', selectedLanguage) // Filter by selected language
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`english_text.ilike.%${searchTerm}%,korean_translation.ilike.%${searchTerm}%`);
      }

      if (difficultyFilter !== 'all') {
        query = query.eq('difficulty', difficultyFilter);
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

  // 🎵 완전히 새로운 고급 TTS 시스템 - 프랑스어 특화
  const playAudio = async (text: string, sentenceId?: string) => {
    if (!text.trim()) return;

    // 이미 재생 중인 경우 중지
    if (isPlaying === sentenceId) {
      speechSynthesis.cancel();
      setIsPlaying(null);
      return;
    }

    // 다른 음성 중지
    speechSynthesis.cancel();
    setIsPlaying(sentenceId || null);

    console.log(`🎵 Playing audio for: "${text}" in ${selectedLanguage}`);

    // 🌍 최신 언어 매핑 (2024년 기준) - 프랑스어 우선순위 최적화
    const languageMap: Record<string, string[]> = {
      '영어': ['en-US', 'en-GB', 'en-AU', 'en-CA'],
      '프랑스어': ['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr'], // 프랑스어 우선순위 강화
      '독일어': ['de-DE', 'de-AT', 'de-CH', 'de'],
      '스페인어': ['es-ES', 'es-MX', 'es-AR', 'es-US', 'es'],
      '이탈리아어': ['it-IT', 'it-CH', 'it'],
      '일본어': ['ja-JP', 'ja'],
      '중국어': ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
      '러시아어': ['ru-RU', 'ru'],
      '포르투갈어': ['pt-BR', 'pt-PT', 'pt'],
      '아랍어': ['ar-SA', 'ar-EG', 'ar-AE', 'ar'],
      '네덜란드어': ['nl-NL', 'nl-BE', 'nl'],
      '스웨덴어': ['sv-SE', 'sv'],
      '노르웨이어': ['no-NO', 'nb-NO', 'no'],
      '덴마크어': ['da-DK', 'da'],
      '핀란드어': ['fi-FI', 'fi'],
      '폴란드어': ['pl-PL', 'pl'],
      '체코어': ['cs-CZ', 'cs'],
      '헝가리어': ['hu-HU', 'hu'],
      '그리스어': ['el-GR', 'el'],
      '터키어': ['tr-TR', 'tr'],
      '히브리어': ['he-IL', 'he'],
      '힌디어': ['hi-IN', 'hi'],
      '태국어': ['th-TH', 'th'],
      '베트남어': ['vi-VN', 'vi'],
      '인도네시아어': ['id-ID', 'id'],
      '말레이어': ['ms-MY', 'ms'],
      '한국어': ['ko-KR', 'ko']
    };

    const targetLangCodes = languageMap[selectedLanguage] || ['en-US'];
    console.log(`🎯 Target language codes for ${selectedLanguage}:`, targetLangCodes);

    // 🔄 음성 로딩 대기 함수 - 강화된 버전
    const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 10;

        const checkVoices = () => {
          const voices = speechSynthesis.getVoices();
          attempts++;
          
          if (voices.length > 0) {
            console.log(`✅ Found ${voices.length} voices after ${attempts} attempts`);
            resolve(voices);
          } else if (attempts < maxAttempts) {
            console.log(`⏳ Attempt ${attempts}: Waiting for voices...`);
            setTimeout(checkVoices, 100);
          } else {
            console.log('⏰ Timeout: Using empty voices array');
            resolve([]);
          }
        };

        // 즉시 체크
        checkVoices();

        // voiceschanged 이벤트도 리스닝
        const handleVoicesChanged = () => {
          const newVoices = speechSynthesis.getVoices();
          if (newVoices.length > 0) {
            console.log(`✅ Voices loaded via event: ${newVoices.length} voices`);
            speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            resolve(newVoices);
          }
        };
        speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      });
    };

    // 🎯 최적 음성 선택 알고리즘 - 프랑스어 특화
    const selectBestVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
      console.log('🔍 Available voices:', voices.map(v => `${v.name} (${v.lang}) ${v.default ? '[DEFAULT]' : ''}`));
      
      // 🇫🇷 프랑스어 특별 처리
      if (selectedLanguage === '프랑스어') {
        console.log('🇫🇷 French language detected - using specialized selection');
        
        // 1. 프랑스어 전용 음성 찾기 (정확한 매칭)
        const frenchVoices = voices.filter(v => 
          v.lang.toLowerCase().startsWith('fr') || 
          v.name.toLowerCase().includes('french') ||
          v.name.toLowerCase().includes('français') ||
          v.name.toLowerCase().includes('france')
        );
        
        console.log('🇫🇷 French voices found:', frenchVoices.map(v => `${v.name} (${v.lang})`));
        
        if (frenchVoices.length > 0) {
          // 프랑스 본토 음성 우선
          const franceFrench = frenchVoices.find(v => v.lang === 'fr-FR');
          if (franceFrench) {
            console.log('🎯 Selected France French voice:', franceFrench.name);
            return franceFrench;
          }
          
          // 기본 프랑스어 음성
          const defaultFrench = frenchVoices.find(v => v.default);
          if (defaultFrench) {
            console.log('⭐ Selected default French voice:', defaultFrench.name);
            return defaultFrench;
          }
          
          // 첫 번째 프랑스어 음성
          console.log('🔤 Selected first French voice:', frenchVoices[0].name);
          return frenchVoices[0];
        }
      }

      // 일반 언어 선택 로직
      // 1단계: 정확한 언어 코드 매칭
      for (const langCode of targetLangCodes) {
        const exactMatch = voices.find(v => v.lang === langCode);
        if (exactMatch) {
          console.log(`🎯 Exact match found: ${exactMatch.name} (${exactMatch.lang})`);
          return exactMatch;
        }
      }

      // 2단계: 언어 계열 매칭 (fr-* 형태)
      for (const langCode of targetLangCodes) {
        const langPrefix = langCode.split('-')[0];
        const familyMatch = voices.find(v => v.lang.startsWith(langPrefix + '-'));
        if (familyMatch) {
          console.log(`🌍 Language family match: ${familyMatch.name} (${familyMatch.lang})`);
          return familyMatch;
        }
      }

      // 3단계: 기본 음성 중에서 언어 계열 매칭
      for (const langCode of targetLangCodes) {
        const langPrefix = langCode.split('-')[0];
        const defaultMatch = voices.find(v => v.default && v.lang.startsWith(langPrefix));
        if (defaultMatch) {
          console.log(`⭐ Default voice match: ${defaultMatch.name} (${defaultMatch.lang})`);
          return defaultMatch;
        }
      }

      // 4단계: 언어 코드만 매칭 (fr 형태)
      for (const langCode of targetLangCodes) {
        const langPrefix = langCode.split('-')[0];
        const prefixMatch = voices.find(v => v.lang.startsWith(langPrefix));
        if (prefixMatch) {
          console.log(`🔤 Language prefix match: ${prefixMatch.name} (${prefixMatch.lang})`);
          return prefixMatch;
        }
      }

      // 5단계: 언어 이름 포함 검색
      const languageNames: Record<string, string[]> = {
        '프랑스어': ['french', 'français', 'francais', 'france', 'marie', 'amelie', 'julie'],
        '독일어': ['german', 'deutsch', 'germany', 'anna', 'petra'],
        '스페인어': ['spanish', 'español', 'espanol', 'spain', 'monica', 'jorge'],
        '이탈리아어': ['italian', 'italiano', 'italy', 'alice', 'luca'],
        '일본어': ['japanese', '日本語', 'japan', 'kyoko', 'otoya'],
        '중국어': ['chinese', '中文', 'china', 'mandarin', 'yaoyao', 'kangkang'],
        '러시아어': ['russian', 'русский', 'russia', 'irina', 'pavel'],
        '포르투갈어': ['portuguese', 'português', 'portugal', 'brazil', 'heloisa', 'daniel'],
        '아랍어': ['arabic', 'العربية', 'arab', 'naayf', 'maged']
      };

      const searchTerms = languageNames[selectedLanguage] || [];
      for (const term of searchTerms) {
        const nameMatch = voices.find(v => 
          v.name.toLowerCase().includes(term.toLowerCase()) ||
          v.lang.toLowerCase().includes(term.toLowerCase())
        );
        if (nameMatch) {
          console.log(`📝 Name-based match: ${nameMatch.name} (${nameMatch.lang})`);
          return nameMatch;
        }
      }

      console.log(`❌ No suitable voice found for ${selectedLanguage}`);
      return null;
    };

    try {
      // 음성 로딩 대기
      const voices = await waitForVoices();
      
      if (voices.length === 0) {
        throw new Error('음성 엔진을 사용할 수 없습니다.');
      }

      // 최적 음성 선택
      const selectedVoice = selectBestVoice(voices);

      // 음성 합성 설정
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        console.log(`🎤 Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      } else {
        // 폴백: 첫 번째 타겟 언어 코드 사용
        utterance.lang = targetLangCodes[0];
        console.log(`🔄 Fallback to language code: ${targetLangCodes[0]}`);
      }

      // 🎵 학습 최적화 설정 - 언어별 조정
      if (selectedLanguage === '프랑스어') {
        utterance.rate = 0.75;    // 프랑스어는 조금 더 천천히
        utterance.pitch = 1.1;    // 약간 높은 음높이로 명확하게
      } else if (selectedLanguage === '독일어') {
        utterance.rate = 0.8;     // 독일어도 천천히
        utterance.pitch = 0.9;    // 약간 낮은 음높이
      } else {
        utterance.rate = 0.85;    // 기본 학습 속도
        utterance.pitch = 1.0;    // 자연스러운 음높이
      }
      
      utterance.volume = 1.0;   // 최대 볼륨

      // 🔧 고급 에러 핸들링
      utterance.onerror = (event) => {
        console.error('🚨 Speech synthesis error:', event.error);
        setIsPlaying(null);
        
        let errorMessage = '발음 재생에 실패했습니다.';
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage += ' 브라우저에서 음성 재생이 차단되었습니다. 설정을 확인해주세요.';
            break;
          case 'network':
            errorMessage += ' 네트워크 연결을 확인해주세요.';
            break;
          case 'synthesis-failed':
            errorMessage += ` ${selectedLanguage} 음성 합성에 실패했습니다.`;
            break;
          case 'synthesis-unavailable':
            errorMessage += ` ${selectedLanguage} 음성이 현재 사용할 수 없습니다.`;
            break;
          case 'language-unavailable':
            errorMessage += ` ${selectedLanguage} 언어가 지원되지 않습니다.`;
            break;
          case 'voice-unavailable':
            errorMessage += ` ${selectedLanguage} 음성을 찾을 수 없습니다.`;
            break;
          case 'text-too-long':
            errorMessage += ' 텍스트가 너무 깁니다.';
            break;
          case 'invalid-argument':
            errorMessage += ' 잘못된 음성 설정입니다.';
            break;
          default:
            errorMessage += ` 알 수 없는 오류: ${event.error}`;
        }
        
        alert(errorMessage);
      };

      // 성공 로깅
      utterance.onstart = () => {
        console.log(`🎵 Started playing: "${text}" in ${selectedLanguage}`);
      };

      utterance.onend = () => {
        console.log(`✅ Finished playing: "${text}"`);
        setIsPlaying(null);
      };

      // 중단 시 상태 초기화
      utterance.onpause = () => {
        setIsPlaying(null);
      };

      // 🎵 음성 재생 시작
      console.log(`🚀 Starting speech synthesis for ${selectedLanguage}...`);
      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('🚨 TTS Error:', error);
      setIsPlaying(null);
      alert(`발음 재생 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const startQuiz = () => {
    // Navigate to quiz mode - in a real app, you'd use React Router
    alert('퀴즈 모드 준비중...');
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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const ListView = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-4">문장</div>
          <div className="col-span-3">번역</div>
          <div className="col-span-1">난이도</div>
          <div className="col-span-2">등록일</div>
          <div className="col-span-2">작업</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {sentences.map((sentence) => (
          <div key={sentence.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 gap-4 text-sm">
              <div className="col-span-4">
                <div className="flex items-start space-x-2">
                  <button
                    onClick={() => playAudio(sentence.english_text, sentence.id)}
                    disabled={isPlaying === sentence.id}
                    className={`p-2 transition-all rounded-lg flex-shrink-0 group ${
                      isPlaying === sentence.id
                        ? 'text-blue-600 bg-blue-100 animate-pulse'
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={`${selectedLanguage} 발음 듣기 ${isPlaying === sentence.id ? '(재생 중...)' : ''}`}
                  >
                    <Volume2 className={`w-4 h-4 transition-transform ${
                      isPlaying === sentence.id ? 'scale-110' : 'group-hover:scale-110'
                    }`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 break-words leading-relaxed">{sentence.english_text}</p>
                    {sentence.keywords && sentence.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sentence.keywords.slice(0, 3).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {keyword.length > 20 ? `${keyword.substring(0, 20)}...` : keyword}
                          </span>
                        ))}
                        {sentence.keywords.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">+{sentence.keywords.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-3">
                <p className="text-gray-700 break-words leading-relaxed">{sentence.korean_translation}</p>
              </div>
              <div className="col-span-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(sentence.difficulty)}`}>
                  {getDifficultyLabel(sentence.difficulty)}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">
                  {format(new Date(sentence.created_at), 'yyyy.MM.dd')}
                </p>
              </div>
              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => alert('편집 기능 준비중...')}
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
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sentences.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            {selectedLanguage}로 등록된 문장이 없습니다.
          </p>
          <p className="text-sm text-gray-500 mt-2">먼저 '오늘의 학습'에서 문장을 추가해보세요.</p>
        </div>
      )}
    </div>
  );

  const CalendarView = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600">캘린더 뷰</p>
        <p className="text-sm text-gray-500 mt-2">준비중입니다...</p>
      </div>
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
          <button
            onClick={startQuiz}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            <Shuffle className="w-5 h-5 mr-2" />
            퀴즈
          </button>
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

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg ${
              viewMode === 'calendar'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? <ListView /> : <CalendarView />}

      {/* Pagination */}
      {viewMode === 'list' && totalPages > 1 && (
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
            <p><strong>🔍 검색 기능</strong>으로 특정 문장을 빠르게 찾을 수 있어요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p><strong>📊 난이도 필터</strong>로 체계적으로 학습 단계를 관리하세요</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p><strong>🎯 복습 모드</strong>에서 이 문장들을 음성으로 연습할 수 있어요</p>
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
                  발음 버튼을 클릭하면 정확한 프랑스어 발음을 들을 수 있습니다. 
                  연음(liaison)과 무음 문자에 주의하며 들어보세요! 
                  <span className="font-medium">재생 중일 때는 버튼이 파란색으로 표시됩니다.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Audio Status Indicator */}
        {isPlaying && (
          <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
            <div className="flex items-center">
              <Volume2 className="w-4 h-4 text-blue-600 mr-2 animate-pulse" />
              <p className="text-sm text-blue-800">
                <strong>{selectedLanguage} 발음 재생 중...</strong> 다른 문장을 재생하려면 해당 버튼을 클릭하세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}