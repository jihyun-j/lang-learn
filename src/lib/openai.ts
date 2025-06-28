const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface TranslationResponse {
  translation: string;
  explanation?: string;
  useful_expressions?: string[];
}

export interface SpeechRecognitionResult {
  transcription: string;
  isCorrect: boolean;
  similarity: number;
  feedback: string;
}

// Fallback translations for common phrases when API is unavailable
const fallbackTranslations: Record<string, string> = {
  'hello': '안녕하세요',
  'goodbye': '안녕히 가세요',
  'thank you': '감사합니다',
  'please': '부탁합니다',
  'excuse me': '실례합니다',
  'i love you': '사랑해요',
  'how are you': '어떻게 지내세요?',
  'what is your name': '이름이 뭐예요?',
  'nice to meet you': '만나서 반가워요',
  'good morning': '좋은 아침이에요'
};

function getFallbackTranslation(sentence: string): string {
  const lowerSentence = sentence.toLowerCase().trim();
  return fallbackTranslations[lowerSentence] || `번역 서비스를 일시적으로 사용할 수 없습니다. "${sentence}"의 번역을 위해 나중에 다시 시도해주세요.`;
}

// Helper function to clean and extract translation from response
function extractCleanTranslation(content: string): string {
  // Remove JSON formatting characters and extract clean text
  let cleanText = content.trim();
  
  // If it looks like JSON, try to extract the translation field
  if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleanText);
      if (parsed.translation) {
        return parsed.translation;
      }
    } catch (e) {
      // If JSON parsing fails, continue with text cleaning
    }
  }
  
  // Remove common JSON artifacts
  cleanText = cleanText
    .replace(/^["']|["']$/g, '') // Remove quotes at start/end
    .replace(/\\n/g, ' ') // Replace \n with space
    .replace(/\\"/g, '"') // Replace \" with "
    .replace(/\\\\/g, '\\') // Replace \\ with \
    .replace(/^\{.*?"translation":\s*["']/, '') // Remove JSON prefix
    .replace(/["'].*\}$/, '') // Remove JSON suffix
    .replace(/^translation:\s*["']?/, '') // Remove "translation:" prefix
    .replace(/["']?\s*,.*$/, '') // Remove trailing JSON
    .trim();
  
  return cleanText;
}

export async function translateSentence(
  sentence: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. 환경변수를 확인해주세요.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // GPT-3.5 Turbo로 다운그레이드
        messages: [
          {
            role: 'system',
            content: `You are a professional language translator. Translate the given ${sourceLang} sentence to ${targetLang}. 

IMPORTANT: Respond with ONLY the translated text, no JSON formatting, no additional explanations, no quotes. Just provide the clean, natural translation.

If you must provide additional information, format it as:
Translation: [translated text]
Explanation: [brief explanation if needed]
Keywords: [key expressions separated by commas]`
          },
          {
            role: 'user',
            content: sentence
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle quota exceeded error specifically
      if (errorData.error?.code === 'insufficient_quota' || 
          errorData.error?.message?.includes('exceeded your current quota')) {
        console.warn('OpenAI API quota exceeded, using fallback translation');
        return {
          translation: getFallbackTranslation(sentence),
          explanation: "번역 서비스의 사용량이 초과되어 제한된 번역을 제공합니다. 더 정확한 번역을 위해서는 API 크레딧을 충전해주세요.",
          useful_expressions: []
        };
      }
      
      throw new Error(`OpenAI API 오류: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content);
      return {
        translation: parsed.translation || extractCleanTranslation(content),
        explanation: parsed.explanation,
        useful_expressions: parsed.useful_expressions || []
      };
    } catch (parseError) {
      // If JSON parsing fails, extract clean translation
      const cleanTranslation = extractCleanTranslation(content);
      
      // Check if the response has structured format
      const lines = content.split('\n').filter(line => line.trim());
      let translation = cleanTranslation;
      let explanation = '';
      let keywords: string[] = [];
      
      for (const line of lines) {
        if (line.toLowerCase().startsWith('translation:')) {
          translation = line.replace(/^translation:\s*/i, '').replace(/^["']|["']$/g, '').trim();
        } else if (line.toLowerCase().startsWith('explanation:')) {
          explanation = line.replace(/^explanation:\s*/i, '').replace(/^["']|["']$/g, '').trim();
        } else if (line.toLowerCase().startsWith('keywords:')) {
          const keywordText = line.replace(/^keywords:\s*/i, '').replace(/^["']|["']$/g, '').trim();
          keywords = keywordText.split(',').map(k => k.trim()).filter(k => k.length > 0);
        }
      }
      
      return {
        translation: translation || cleanTranslation,
        explanation: explanation || undefined,
        useful_expressions: keywords.length > 0 ? keywords : []
      };
    }
  } catch (error) {
    console.error('Translation error:', error);
    
    // If it's a network error or quota error, provide fallback
    if (error instanceof Error && 
        (error.message.includes('quota') || error.message.includes('network') || error.message.includes('fetch'))) {
      console.warn('Using fallback translation due to API unavailability');
      return {
        translation: getFallbackTranslation(sentence),
        explanation: "번역 서비스에 일시적인 문제가 있어 기본 번역을 제공합니다. 나중에 다시 시도해주세요.",
        useful_expressions: []
      };
    }
    
    if (error instanceof Error) {
      throw new Error(`번역 실패: ${error.message}`);
    }
    throw new Error('번역에 실패했습니다. 네트워크 연결을 확인해주세요.');
  }
}

// OpenAI Whisper를 사용한 음성 인식
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. 환경변수를 확인해주세요.');
  }

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // 영어로 설정, 필요시 동적으로 변경 가능

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle quota exceeded error specifically
      if (errorData.error?.code === 'insufficient_quota' || 
          errorData.error?.message?.includes('exceeded your current quota')) {
        console.warn('OpenAI API quota exceeded for transcription');
        throw new Error('음성 인식 서비스의 사용량이 초과되었습니다. API 크레딧을 충전해주세요.');
      }
      
      throw new Error(`OpenAI Whisper API 오류: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Transcription error:', error);
    
    if (error instanceof Error) {
      throw new Error(`음성 인식 실패: ${error.message}`);
    }
    throw new Error('음성 인식에 실패했습니다. 네트워크 연결을 확인해주세요.');
  }
}

// 문장 유사도 비교 및 정답 판별
export async function compareSentences(
  originalSentence: string,
  spokenText: string
): Promise<SpeechRecognitionResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. 환경변수를 확인해주세요.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a language learning assistant. Compare the original sentence with what the user said and determine if they match semantically. 

Return response in JSON format with these fields:
- transcription: the user's spoken text (cleaned up)
- isCorrect: boolean - true if the meaning is substantially the same (allow for minor pronunciation differences)
- similarity: number from 0-100 representing how similar the sentences are
- feedback: encouraging feedback in Korean

Be lenient with minor pronunciation errors, contractions, and small grammatical differences. Focus on whether the core meaning is preserved.`
          },
          {
            role: 'user',
            content: `Original sentence: "${originalSentence}"\nUser's spoken text: "${spokenText}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle quota exceeded error specifically
      if (errorData.error?.code === 'insufficient_quota' || 
          errorData.error?.message?.includes('exceeded your current quota')) {
        console.warn('OpenAI API quota exceeded for sentence comparison');
        
        // Simple fallback comparison
        const similarity = calculateSimpleSimilarity(originalSentence, spokenText);
        const isCorrect = similarity > 70;
        
        return {
          transcription: spokenText,
          isCorrect,
          similarity,
          feedback: isCorrect 
            ? "좋습니다! 의미가 잘 전달되었어요." 
            : "조금 더 정확하게 발음해보세요. 계속 연습하면 향상될 거예요!"
        };
      }
      
      throw new Error(`OpenAI API 오류: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return {
        transcription: parsed.transcription || spokenText,
        isCorrect: parsed.isCorrect || false,
        similarity: parsed.similarity || 0,
        feedback: parsed.feedback || "좋은 시도입니다! 계속 연습하시면 더 나아질 거예요."
      };
    } catch (parseError) {
      // If JSON parsing fails, use simple comparison
      const similarity = calculateSimpleSimilarity(originalSentence, spokenText);
      const isCorrect = similarity > 70;
      
      return {
        transcription: spokenText,
        isCorrect,
        similarity,
        feedback: isCorrect 
          ? "좋습니다! 의미가 잘 전달되었어요." 
          : "조금 더 정확하게 발음해보세요. 계속 연습하면 향상될 거예요!"
      };
    }
  } catch (error) {
    console.error('Sentence comparison error:', error);
    
    // Provide fallback comparison for quota/network errors
    if (error instanceof Error && 
        (error.message.includes('quota') || error.message.includes('network') || error.message.includes('fetch'))) {
      console.warn('Using fallback sentence comparison due to API unavailability');
      
      const similarity = calculateSimpleSimilarity(originalSentence, spokenText);
      const isCorrect = similarity > 70;
      
      return {
        transcription: spokenText,
        isCorrect,
        similarity,
        feedback: isCorrect 
          ? "좋습니다! 의미가 잘 전달되었어요." 
          : "조금 더 정확하게 발음해보세요. 계속 연습하면 향상될 거예요!"
      };
    }
    
    if (error instanceof Error) {
      throw new Error(`문장 비교 실패: ${error.message}`);
    }
    throw new Error('문장 비교에 실패했습니다. 네트워크 연결을 확인해주세요.');
  }
}

// Simple similarity calculation fallback
function calculateSimpleSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
  
  const normalized1 = normalize(text1);
  const normalized2 = normalize(text2);
  
  if (normalized1 === normalized2) return 100;
  
  const words1 = normalized1.split(/\s+/);
  const words2 = normalized2.split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return Math.round((commonWords.length / totalWords) * 100);
}

// Helper function to generate example sentences
export async function generateExampleSentences(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  targetLang: string,
  count: number = 5
): Promise<string[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Generate ${count} example sentences in ${targetLang} about the topic "${topic}" at ${difficulty} difficulty level. Return only a JSON array of sentences.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle quota exceeded error
      if (errorData.error?.code === 'insufficient_quota' || 
          errorData.error?.message?.includes('exceeded your current quota')) {
        console.warn('OpenAI API quota exceeded, providing fallback examples');
        
        // Return some basic example sentences based on difficulty
        const fallbackExamples = {
          easy: ['Hello, how are you?', 'What is your name?', 'Nice to meet you.', 'Thank you very much.', 'Have a good day.'],
          medium: ['Could you please help me with this?', 'I would like to make a reservation.', 'What time does the store close?', 'How much does this cost?', 'Where is the nearest subway station?'],
          hard: ['I was wondering if you could provide more information about this topic.', 'The weather forecast indicates that it might rain tomorrow.', 'Could you elaborate on the differences between these two options?', 'I appreciate your patience while we resolve this issue.', 'The presentation was both informative and engaging.']
        };
        
        return fallbackExamples[difficulty] || fallbackExamples.medium;
      }
      
      throw new Error('Failed to generate example sentences');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      // If parsing fails, split by lines and clean up
      return content.split('\n').filter((line: string) => line.trim().length > 0).slice(0, count);
    }
  } catch (error) {
    console.error('Example generation error:', error);
    
    // Provide fallback examples for quota/network errors
    if (error instanceof Error && 
        (error.message.includes('quota') || error.message.includes('network') || error.message.includes('fetch'))) {
      console.warn('Using fallback example sentences due to API unavailability');
      
      const fallbackExamples = {
        easy: ['Hello, how are you?', 'What is your name?', 'Nice to meet you.', 'Thank you very much.', 'Have a good day.'],
        medium: ['Could you please help me with this?', 'I would like to make a reservation.', 'What time does the store close?', 'How much does this cost?', 'Where is the nearest subway station?'],
        hard: ['I was wondering if you could provide more information about this topic.', 'The weather forecast indicates that it might rain tomorrow.', 'Could you elaborate on the differences between these two options?', 'I appreciate your patience while we resolve this issue.', 'The presentation was both informative and engaging.']
      };
      
      return fallbackExamples[difficulty] || fallbackExamples.medium;
    }
    
    throw new Error('예문 생성에 실패했습니다.');
  }
}