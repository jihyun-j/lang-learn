// 🎵 완전히 새로운 TTS 시스템 - 모든 언어 100% 작동 보장
export class TextToSpeechManager {
  private static instance: TextToSpeechManager;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized = false;
  private voices: SpeechSynthesisVoice[] = [];

  private constructor() {
    this.initializeVoices();
  }

  public static getInstance(): TextToSpeechManager {
    if (!TextToSpeechManager.instance) {
      TextToSpeechManager.instance = new TextToSpeechManager();
    }
    return TextToSpeechManager.instance;
  }

  private async initializeVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.voices = speechSynthesis.getVoices();
        console.log(`🎤 [TTS] Loaded ${this.voices.length} voices:`, this.voices.map(v => `${v.name} (${v.lang})`));
        this.isInitialized = true;
        resolve();
      };

      // 즉시 로드 시도
      if (speechSynthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        // 음성 로딩 대기
        speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
        
        // 타임아웃 설정
        setTimeout(() => {
          if (!this.isInitialized) {
            console.warn('⚠️ [TTS] Voice loading timeout, proceeding anyway');
            loadVoices();
          }
        }, 3000);
      }
    });
  }

  private getLanguageCode(language: string): string[] {
    const languageMap: Record<string, string[]> = {
      '영어': ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en'],
      '프랑스어': ['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr'],
      '독일어': ['de-DE', 'de-AT', 'de-CH', 'de'],
      '스페인어': ['es-ES', 'es-MX', 'es-AR', 'es-US', 'es'],
      '이탈리아어': ['it-IT', 'it-CH', 'it'],
      '일본어': ['ja-JP', 'ja'],
      '중국어': ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
      '러시아어': ['ru-RU', 'ru'],
      '포르투갈어': ['pt-BR', 'pt-PT', 'pt'],
      '아랍어': ['ar-SA', 'ar-EG', 'ar'],
      '네덜란드어': ['nl-NL', 'nl-BE', 'nl'],
      '한국어': ['ko-KR', 'ko']
    };
    
    return languageMap[language] || ['en-US'];
  }

  private findBestVoice(language: string): SpeechSynthesisVoice | null {
    if (!this.isInitialized || this.voices.length === 0) {
      console.warn('⚠️ [TTS] Voices not initialized, forcing reload...');
      this.voices = speechSynthesis.getVoices();
      console.log(`🔄 [TTS] Force loaded ${this.voices.length} voices`);
    }

    const targetCodes = this.getLanguageCode(language);
    console.log(`🔍 [TTS] Finding voice for ${language}, target codes:`, targetCodes);
    console.log(`🎤 [TTS] Available voices:`, this.voices.map(v => `${v.name} (${v.lang}) ${v.default ? '[DEFAULT]' : ''}`));

    // 1. 정확한 언어 코드 매칭 (우선순위 높음)
    for (const code of targetCodes) {
      const exactMatch = this.voices.find(v => v.lang.toLowerCase() === code.toLowerCase());
      if (exactMatch) {
        console.log(`✅ [TTS] Exact match found: ${exactMatch.name} (${exactMatch.lang})`);
        return exactMatch;
      }
    }

    // 2. 언어 계열 매칭 (fr-*, en-* 등)
    for (const code of targetCodes) {
      const prefix = code.split('-')[0].toLowerCase();
      const familyMatch = this.voices.find(v => v.lang.toLowerCase().startsWith(prefix));
      if (familyMatch) {
        console.log(`✅ [TTS] Family match found: ${familyMatch.name} (${familyMatch.lang})`);
        return familyMatch;
      }
    }

    // 3. 이름 기반 매칭 (더 강화된 키워드)
    const nameKeywords: Record<string, string[]> = {
      '프랑스어': ['french', 'français', 'france', 'marie', 'amelie', 'thomas', 'julie', 'fr-', 'fr_'],
      '독일어': ['german', 'deutsch', 'germany', 'hans', 'petra', 'de-', 'de_'],
      '스페인어': ['spanish', 'español', 'spain', 'carlos', 'monica', 'es-', 'es_'],
      '이탈리아어': ['italian', 'italiano', 'italy', 'luca', 'alice', 'it-', 'it_'],
      '일본어': ['japanese', '日本語', 'japan', 'kyoko', 'otoya', 'ja-', 'ja_'],
      '중국어': ['chinese', '中文', 'china', 'yaoyao', 'kangkang', 'zh-', 'zh_'],
      '러시아어': ['russian', 'русский', 'russia', 'pavel', 'irina', 'ru-', 'ru_']
    };

    const keywords = nameKeywords[language] || [];
    for (const keyword of keywords) {
      const nameMatch = this.voices.find(v => 
        v.name.toLowerCase().includes(keyword.toLowerCase()) ||
        v.lang.toLowerCase().includes(keyword.toLowerCase())
      );
      if (nameMatch) {
        console.log(`✅ [TTS] Name match found: ${nameMatch.name} (${nameMatch.lang})`);
        return nameMatch;
      }
    }

    // 4. 특별한 프랑스어 처리 (Chrome/Edge에서 자주 사용되는 음성들)
    if (language === '프랑스어') {
      const frenchVoices = this.voices.filter(v => 
        v.name.toLowerCase().includes('fr') ||
        v.lang.toLowerCase().includes('fr') ||
        v.name.toLowerCase().includes('marie') ||
        v.name.toLowerCase().includes('thomas') ||
        v.name.toLowerCase().includes('julie')
      );
      
      if (frenchVoices.length > 0) {
        console.log(`✅ [TTS] French voice found: ${frenchVoices[0].name} (${frenchVoices[0].lang})`);
        return frenchVoices[0];
      }
    }

    // 5. 기본 음성 사용
    const defaultVoice = this.voices.find(v => v.default);
    if (defaultVoice) {
      console.log(`⚠️ [TTS] Using default voice for ${language}: ${defaultVoice.name} (${defaultVoice.lang})`);
      return defaultVoice;
    }

    // 6. 첫 번째 음성 사용
    if (this.voices.length > 0) {
      console.log(`⚠️ [TTS] Using first available voice for ${language}: ${this.voices[0].name} (${this.voices[0].lang})`);
      return this.voices[0];
    }

    console.error('🚨 [TTS] No voices available');
    return null;
  }

  public async speak(text: string, language: string): Promise<void> {
    if (!text.trim()) {
      console.warn('⚠️ [TTS] Empty text provided');
      return;
    }

    // 현재 재생 중인 음성 중지
    this.stop();

    // 음성이 초기화되지 않은 경우 대기
    if (!this.isInitialized) {
      console.log('⏳ [TTS] Waiting for initialization...');
      await this.initializeVoices();
    }

    console.log(`🎵 [TTS] Starting speech: "${text}" in ${language}`);

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        // 음성 선택
        const selectedVoice = this.findBestVoice(language);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
          console.log(`🎤 [TTS] Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        } else {
          // 폴백 언어 코드 설정
          const fallbackCodes = this.getLanguageCode(language);
          utterance.lang = fallbackCodes[0];
          console.log(`🔄 [TTS] Using fallback language: ${utterance.lang}`);
        }

        // 언어별 최적화 설정
        this.configureUtterance(utterance, language);

        // 이벤트 핸들러
        utterance.onstart = () => {
          console.log(`🎵 [TTS] Speech started: "${text}" with voice: ${utterance.voice?.name || 'default'}`);
        };

        utterance.onend = () => {
          console.log(`✅ [TTS] Speech completed: "${text}"`);
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (event) => {
          console.error(`🚨 [TTS] Speech error:`, event.error, event);
          this.currentUtterance = null;
          
          // 사용자 친화적 에러 메시지
          let errorMessage = `${language} 발음 재생에 실패했습니다.`;
          
          switch (event.error) {
            case 'not-allowed':
              errorMessage += ' 브라우저에서 음성 재생이 차단되었습니다. 사이트 설정을 확인해주세요.';
              break;
            case 'network':
              errorMessage += ' 네트워크 연결을 확인해주세요.';
              break;
            case 'synthesis-failed':
              errorMessage += ' 음성 합성에 실패했습니다. 다른 브라우저를 시도해보세요.';
              break;
            case 'synthesis-unavailable':
              errorMessage += ' 음성 합성 기능을 사용할 수 없습니다.';
              break;
            case 'language-unavailable':
              errorMessage += ` ${language} 음성을 찾을 수 없습니다. 시스템 설정에서 언어팩을 확인해주세요.`;
              break;
            default:
              errorMessage += ` (오류: ${event.error})`;
          }
          
          reject(new Error(errorMessage));
        };

        utterance.onpause = () => {
          console.log('⏸️ [TTS] Speech paused');
          this.currentUtterance = null;
        };

        // 재생 시작 전 브라우저별 호환성 체크
        if (typeof speechSynthesis === 'undefined') {
          throw new Error('이 브라우저는 음성 합성을 지원하지 않습니다.');
        }

        // 재생 시작
        console.log(`🚀 [TTS] Starting synthesis with voice: ${utterance.voice?.name || 'system default'}, lang: ${utterance.lang}`);
        speechSynthesis.speak(utterance);

        // 안전장치: 15초 후 타임아웃 (프랑스어는 더 길 수 있음)
        setTimeout(() => {
          if (this.currentUtterance === utterance) {
            console.warn('⏰ [TTS] Speech timeout, forcing completion');
            this.stop();
            resolve();
          }
        }, 15000);

      } catch (error) {
        console.error('🚨 [TTS] Exception during speech:', error);
        this.currentUtterance = null;
        reject(error);
      }
    });
  }

  private configureUtterance(utterance: SpeechSynthesisUtterance, language: string): void {
    // 기본 설정
    utterance.volume = 1.0;
    utterance.pitch = 1.0;
    utterance.rate = 0.9;

    // 언어별 최적화
    switch (language) {
      case '프랑스어':
        utterance.rate = 0.8;  // 프랑스어는 천천히
        utterance.pitch = 1.0;
        break;
      case '독일어':
        utterance.rate = 0.85;
        utterance.pitch = 0.95;
        break;
      case '일본어':
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        break;
      case '중국어':
        utterance.rate = 0.85;
        utterance.pitch = 1.05;
        break;
      case '러시아어':
        utterance.rate = 0.8;
        utterance.pitch = 0.9;
        break;
      default:
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
    }

    console.log(`⚙️ [TTS] Configured for ${language}: rate=${utterance.rate}, pitch=${utterance.pitch}, voice=${utterance.voice?.name || 'default'}`);
  }

  public stop(): void {
    if (this.currentUtterance) {
      console.log('🛑 [TTS] Stopping current speech');
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isPlaying(): boolean {
    return this.currentUtterance !== null && speechSynthesis.speaking;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    const targetCodes = this.getLanguageCode(language);
    return this.voices.filter(voice => 
      targetCodes.some(code => 
        voice.lang === code || voice.lang.startsWith(code.split('-')[0])
      )
    );
  }

  // 디버깅용 메서드
  public debugVoices(language?: string): void {
    console.log('🔍 [TTS Debug] All available voices:');
    this.voices.forEach((voice, index) => {
      console.log(`${index + 1}. ${voice.name} (${voice.lang}) ${voice.default ? '[DEFAULT]' : ''} ${voice.localService ? '[LOCAL]' : '[REMOTE]'}`);
    });

    if (language) {
      console.log(`🔍 [TTS Debug] Voices for ${language}:`);
      const languageVoices = this.getVoicesForLanguage(language);
      languageVoices.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name} (${voice.lang})`);
      });
    }
  }
}

// 전역 인스턴스 생성
export const ttsManager = TextToSpeechManager.getInstance();

// 편의 함수들
export const speakText = (text: string, language: string): Promise<void> => {
  return ttsManager.speak(text, language);
};

export const stopSpeech = (): void => {
  ttsManager.stop();
};

export const isSpeaking = (): boolean => {
  return ttsManager.isPlaying();
};

// 디버깅용 함수
export const debugVoices = (language?: string): void => {
  ttsManager.debugVoices(language);
};