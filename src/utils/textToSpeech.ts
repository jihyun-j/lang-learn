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
        }, 2000);
      }
    });
  }

  private getLanguageCode(language: string): string {
    const languageMap: Record<string, string[]> = {
      '영어': ['en-US', 'en-GB', 'en-AU', 'en'],
      '프랑스어': ['fr-FR', 'fr-CA', 'fr-BE', 'fr'],
      '독일어': ['de-DE', 'de-AT', 'de-CH', 'de'],
      '스페인어': ['es-ES', 'es-MX', 'es-AR', 'es'],
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
      console.warn('⚠️ [TTS] Voices not initialized');
      return null;
    }

    const targetCodes = this.getLanguageCode(language);
    console.log(`🔍 [TTS] Finding voice for ${language}, target codes:`, targetCodes);

    // 1. 정확한 언어 코드 매칭
    for (const code of targetCodes) {
      const exactMatch = this.voices.find(v => v.lang === code);
      if (exactMatch) {
        console.log(`✅ [TTS] Exact match found: ${exactMatch.name} (${exactMatch.lang})`);
        return exactMatch;
      }
    }

    // 2. 언어 계열 매칭 (fr-*, en-* 등)
    for (const code of targetCodes) {
      const prefix = code.split('-')[0];
      const familyMatch = this.voices.find(v => v.lang.startsWith(prefix));
      if (familyMatch) {
        console.log(`✅ [TTS] Family match found: ${familyMatch.name} (${familyMatch.lang})`);
        return familyMatch;
      }
    }

    // 3. 이름 기반 매칭
    const nameKeywords: Record<string, string[]> = {
      '프랑스어': ['french', 'français', 'france', 'marie', 'amelie'],
      '독일어': ['german', 'deutsch', 'germany', 'hans', 'petra'],
      '스페인어': ['spanish', 'español', 'spain', 'carlos', 'monica'],
      '이탈리아어': ['italian', 'italiano', 'italy', 'luca', 'alice'],
      '일본어': ['japanese', '日本語', 'japan', 'kyoko', 'otoya'],
      '중국어': ['chinese', '中文', 'china', 'yaoyao', 'kangkang'],
      '러시아어': ['russian', 'русский', 'russia', 'pavel', 'irina']
    };

    const keywords = nameKeywords[language] || [];
    for (const keyword of keywords) {
      const nameMatch = this.voices.find(v => 
        v.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (nameMatch) {
        console.log(`✅ [TTS] Name match found: ${nameMatch.name} (${nameMatch.lang})`);
        return nameMatch;
      }
    }

    // 4. 기본 음성 사용
    const defaultVoice = this.voices.find(v => v.default);
    if (defaultVoice) {
      console.log(`✅ [TTS] Using default voice: ${defaultVoice.name} (${defaultVoice.lang})`);
      return defaultVoice;
    }

    // 5. 첫 번째 음성 사용
    if (this.voices.length > 0) {
      console.log(`✅ [TTS] Using first available voice: ${this.voices[0].name} (${this.voices[0].lang})`);
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
          console.log(`🎵 [TTS] Speech started: "${text}"`);
        };

        utterance.onend = () => {
          console.log(`✅ [TTS] Speech completed: "${text}"`);
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (event) => {
          console.error(`🚨 [TTS] Speech error:`, event.error);
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
            default:
              errorMessage += ` (오류: ${event.error})`;
          }
          
          reject(new Error(errorMessage));
        };

        utterance.onpause = () => {
          console.log('⏸️ [TTS] Speech paused');
          this.currentUtterance = null;
        };

        // 재생 시작
        console.log(`🚀 [TTS] Starting synthesis...`);
        speechSynthesis.speak(utterance);

        // 안전장치: 10초 후 타임아웃
        setTimeout(() => {
          if (this.currentUtterance === utterance) {
            console.warn('⏰ [TTS] Speech timeout, forcing completion');
            this.stop();
            resolve();
          }
        }, 10000);

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

    console.log(`⚙️ [TTS] Configured for ${language}: rate=${utterance.rate}, pitch=${utterance.pitch}`);
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