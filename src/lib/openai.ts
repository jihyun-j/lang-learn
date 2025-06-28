const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface TranslationResponse {
  translation: string;
  explanation?: string;
  useful_expressions?: string[];
}

export interface PronunciationFeedback {
  pronunciation_score: number;
  grammar_score: number;
  overall_score: number;
  feedback: string;
  suggestions?: string[];
}

export interface KeywordExplanation {
  explanation: string;
  usage_examples: string[];
  grammar_notes?: string;
  similar_expressions?: string[];
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

// Fallback keyword explanations
const fallbackKeywordExplanations: Record<string, KeywordExplanation> = {
  'hello': {
    explanation: '인사할 때 사용하는 기본적인 표현입니다.',
    usage_examples: ['Hello, how are you?', 'Hello there!', 'Hello, nice to meet you.'],
    grammar_notes: '가장 일반적인 인사 표현으로 격식과 비격식 상황 모두에서 사용 가능합니다.',
    similar_expressions: ['Hi', 'Hey', 'Good morning', 'Good afternoon']
  },
  'thank you': {
    explanation: '감사를 표현할 때 사용하는 정중한 표현입니다.',
    usage_examples: ['Thank you for your help.', 'Thank you very much.', 'Thank you so much!'],
    grammar_notes: '격식적인 상황에서 사용하며, 줄여서 "Thanks"라고도 할 수 있습니다.',
    similar_expressions: ['Thanks', 'Thanks a lot', 'I appreciate it', 'Much obliged']
  }
};

function getFallbackTranslation(sentence: string): string {
  const lowerSentence = sentence.toLowerCase().trim();
  return fallbackTranslations[lowerSentence] || `번역 서비스를 일시적으로 사용할 수 없습니다. "${sentence}"의 번역을 위해 나중에 다시 시도해주세요.`;
}

function getFallbackKeywordExplanation(keyword: string): KeywordExplanation {
  const lowerKeyword = keyword.toLowerCase().trim();
  return fallbackKeywordExplanations[lowerKeyword] || {
    explanation: `"${keyword}"에 대한 설명을 일시적으로 제공할 수 없습니다. 나중에 다시 시도해주세요.`,
    usage_examples: [`Example with ${keyword}`],
    grammar_notes: '자세한 문법 설명을 위해 나중에 다시 시도해주세요.',
    similar_expressions: []
  };
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

export async function analyzePronunciation(
  originalSentence: string,
  spokenText: string,
  targetLang: string
): Promise<PronunciationFeedback> {
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
            content: `You are a language pronunciation coach. Compare the original ${targetLang} sentence with what the user actually said. Analyze pronunciation accuracy, grammar correctness, and provide constructive feedback. 

Return response in JSON format with these fields:
- pronunciation_score: score from 0-100 for pronunciation accuracy
- grammar_score: score from 0-100 for grammar correctness  
- overall_score: overall score from 0-100
- feedback: constructive feedback in Korean explaining what was good and what can be improved
- suggestions: array of specific suggestions for improvement (optional)

Be encouraging but honest in your assessment.`
          },
          {
            role: 'user',
            content: `Original sentence: "${originalSentence}"\nUser's spoken text: "${spokenText}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle quota exceeded error specifically
      if (errorData.error?.code === 'insufficient_quota' || 
          errorData.error?.message?.includes('exceeded your current quota')) {
        console.warn('OpenAI API quota exceeded, providing basic feedback');
        return {
          pronunciation_score: 75,
          grammar_score: 75,
          overall_score: 75,
          feedback: "발음 분석 서비스의 사용량이 초과되어 기본 피드백을 제공합니다. 계속 연습하시면 실력이 향상될 거예요! API 크레딧을 충전하시면 더 자세한 분석을 받을 수 있습니다.",
          suggestions: ["꾸준한 연습이 가장 중요합니다", "원어민 발음을 많이 들어보세요"]
        };
      }
      
      throw new Error(`OpenAI API 오류: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return {
        pronunciation_score: parsed.pronunciation_score || 70,
        grammar_score: parsed.grammar_score || 70,
        overall_score: parsed.overall_score || 70,
        feedback: parsed.feedback || "좋은 시도입니다! 계속 연습하시면 더 나아질 거예요.",
        suggestions: parsed.suggestions
      };
    } catch (parseError) {
      // If JSON parsing fails, return default scores with the content as feedback
      return {
        pronunciation_score: 70,
        grammar_score: 70,
        overall_score: 70,
        feedback: extractCleanTranslation(content) || "좋은 시도입니다! 계속 연습하시면 더 나아질 거예요."
      };
    }
  } catch (error) {
    console.error('Pronunciation analysis error:', error);
    
    // Provide fallback feedback for quota/network errors
    if (error instanceof Error && 
        (error.message.includes('quota') || error.message.includes('network') || error.message.includes('fetch'))) {
      console.warn('Using fallback pronunciation feedback due to API unavailability');
      return {
        pronunciation_score: 75,
        grammar_score: 75,
        overall_score: 75,
        feedback: "발음 분석 서비스에 일시적인 문제가 있어 기본 피드백을 제공합니다. 계속 연습하시면 실력이 향상될 거예요!",
        suggestions: ["꾸준한 연습이 가장 중요합니다", "원어민 발음을 많이 들어보세요"]
      };
    }
    
    if (error instanceof Error) {
      throw new Error(`발음 분석 실패: ${error.message}`);
    }
    throw new Error('발음 분석에 실패했습니다. 네트워크 연결을 확인해주세요.');
  }
}

export async function explainKeyword(
  keyword: string,
  context: string,
  targetLang: string
): Promise<KeywordExplanation> {
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
            content: `You are a language learning assistant. Explain the keyword "${keyword}" in the context of "${context}" for someone learning ${targetLang}. 

Return response in JSON format with these fields:
- explanation: detailed explanation in Korean about what the keyword means and how it's used
- usage_examples: array of 3-5 example sentences showing different uses of the keyword
- grammar_notes: grammar information about the keyword (optional)
- similar_expressions: array of similar words or expressions (optional)

Provide clear, educational explanations that help language learners understand the keyword better.`
          },
          {
            role: 'user',
            content: `Keyword: "${keyword}"\nContext: "${context}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle quota exceeded error specifically
      if (errorData.error?.code === 'insufficient_quota' || 
          errorData.error?.message?.includes('exceeded your current quota')) {
        console.warn('OpenAI API quota exceeded, providing fallback keyword explanation');
        return getFallbackKeywordExplanation(keyword);
      }
      
      throw new Error(`OpenAI API 오류: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return {
        explanation: parsed.explanation || `"${keyword}"에 대한 설명입니다.`,
        usage_examples: parsed.usage_examples || [`Example with ${keyword}`],
        grammar_notes: parsed.grammar_notes,
        similar_expressions: parsed.similar_expressions || []
      };
    } catch (parseError) {
      // If JSON parsing fails, try to extract information from text
      const lines = content.split('\n').filter(line => line.trim());
      let explanation = `"${keyword}"에 대한 설명입니다.`;
      let examples: string[] = [];
      let grammarNotes = '';
      let similarExpressions: string[] = [];
      
      for (const line of lines) {
        if (line.toLowerCase().includes('explanation') || line.includes('설명')) {
          explanation = line.replace(/^[^:]*:\s*/, '').trim();
        } else if (line.toLowerCase().includes('example') || line.includes('예문')) {
          const example = line.replace(/^[^:]*:\s*/, '').trim();
          if (example) examples.push(example);
        } else if (line.toLowerCase().includes('grammar') || line.includes('문법')) {
          grammarNotes = line.replace(/^[^:]*:\s*/, '').trim();
        } else if (line.toLowerCase().includes('similar') || line.includes('유사')) {
          const similar = line.replace(/^[^:]*:\s*/, '').trim();
          if (similar) similarExpressions = similar.split(',').map(s => s.trim());
        }
      }
      
      return {
        explanation: explanation || extractCleanTranslation(content) || `"${keyword}"에 대한 설명입니다.`,
        usage_examples: examples.length > 0 ? examples : [`Example with ${keyword}`],
        grammar_notes: grammarNotes || undefined,
        similar_expressions: similarExpressions
      };
    }
  } catch (error) {
    console.error('Keyword explanation error:', error);
    
    // Provide fallback explanation for quota/network errors
    if (error instanceof Error && 
        (error.message.includes('quota') || error.message.includes('network') || error.message.includes('fetch'))) {
      console.warn('Using fallback keyword explanation due to API unavailability');
      return getFallbackKeywordExplanation(keyword);
    }
    
    if (error instanceof Error) {
      throw new Error(`키워드 설명 실패: ${error.message}`);
    }
    throw new Error('키워드 설명에 실패했습니다. 네트워크 연결을 확인해주세요.');
  }
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