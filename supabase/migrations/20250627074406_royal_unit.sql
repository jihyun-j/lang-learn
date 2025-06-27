/*
  # Create review_sessions table

  1. New Tables
    - `review_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `sentence_id` (uuid, foreign key to sentences)
      - `pronunciation_score` (integer, pronunciation score)
      - `grammar_score` (integer, grammar score)
      - `overall_score` (integer, overall score)
      - `feedback` (text, feedback message)
      - `audio_url` (text, optional audio recording URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `review_sessions` table
    - Add policies for authenticated users to manage their own review sessions

  3. Indexes
    - Add indexes for efficient querying by user_id and sentence_id
*/

CREATE TABLE IF NOT EXISTS review_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sentence_id uuid NOT NULL,
  pronunciation_score integer NOT NULL DEFAULT 0,
  grammar_score integer NOT NULL DEFAULT 0,
  overall_score integer NOT NULL DEFAULT 0,
  feedback text NOT NULL DEFAULT '',
  audio_url text,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE review_sessions 
ADD CONSTRAINT review_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE review_sessions 
ADD CONSTRAINT review_sessions_sentence_id_fkey 
FOREIGN KEY (sentence_id) REFERENCES sentences(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_sessions_user_id ON review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_sentence_id ON review_sessions(sentence_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_created_at ON review_sessions(created_at);

-- Enable Row Level Security
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert own review sessions"
  ON review_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own review sessions"
  ON review_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own review sessions"
  ON review_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own review sessions"
  ON review_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);