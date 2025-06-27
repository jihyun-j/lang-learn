/*
  # Add language support to sentences table

  1. Changes to Tables
    - Add `target_language` column to `sentences` table
    - Add `target_language` column to `community_sentences` table
    - Update indexes to include language filtering
    - Update RLS policies to maintain security

  2. Security
    - Maintain existing RLS policies
    - Add indexes for efficient language-based queries
*/

-- Add target_language column to sentences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sentences' AND column_name = 'target_language'
  ) THEN
    ALTER TABLE sentences ADD COLUMN target_language text DEFAULT '영어' NOT NULL;
  END IF;
END $$;

-- Add target_language column to community_sentences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_sentences' AND column_name = 'target_language'
  ) THEN
    ALTER TABLE community_sentences ADD COLUMN target_language text DEFAULT '영어' NOT NULL;
  END IF;
END $$;

-- Add indexes for efficient language-based queries
CREATE INDEX IF NOT EXISTS idx_sentences_user_language ON sentences(user_id, target_language);
CREATE INDEX IF NOT EXISTS idx_sentences_language_difficulty ON sentences(target_language, difficulty);
CREATE INDEX IF NOT EXISTS idx_community_sentences_language ON community_sentences(target_language, is_public);

-- Update existing sentences to have default language if null
UPDATE sentences SET target_language = '영어' WHERE target_language IS NULL;
UPDATE community_sentences SET target_language = '영어' WHERE target_language IS NULL;