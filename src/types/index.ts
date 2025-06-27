export interface User {
  id: string;
  email: string;
  native_language: string;
  target_language: string;
  created_at: string;
}

export interface Sentence {
  id: string;
  user_id: string;
  english_text: string;
  korean_translation: string;
  keywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
}

export interface ReviewSession {
  id: string;
  user_id: string;
  sentence_id: string;
  pronunciation_score: number;
  grammar_score: number;
  overall_score: number;
  feedback: string;
  audio_url?: string;
  created_at: string;
}

export interface VoiceRecording {
  blob: Blob;
  url: string;
  duration: number;
}