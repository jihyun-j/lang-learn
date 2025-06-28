import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

interface DailyProgress {
  todaySentences: number;
  todayReviews: number;
  sentenceGoal: number;
  reviewGoal: number;
}

export function useDailyProgress(selectedLanguage: string) {
  const [progress, setProgress] = useState<DailyProgress>({
    todaySentences: 0,
    todayReviews: 0,
    sentenceGoal: 3,
    reviewGoal: 5,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadDailyProgress();
    }
  }, [user, selectedLanguage]);

  const loadDailyProgress = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Load user goals
      const { data: goalsData } = await supabase
        .from('user_goals')
        .select('daily_sentence_goal, daily_review_goal')
        .eq('user_id', user.id)
        .single();

      // Load today's sentences for selected language
      const { data: sentencesData } = await supabase
        .from('sentences')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_language', selectedLanguage)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Load today's reviews for selected language
      const { data: reviewsData } = await supabase
        .from('review_sessions')
        .select('id, sentence_id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Filter reviews by language (need to join with sentences)
      let todayReviews = 0;
      if (reviewsData && reviewsData.length > 0) {
        const sentenceIds = reviewsData.map(r => r.sentence_id);
        const { data: reviewSentences } = await supabase
          .from('sentences')
          .select('id')
          .eq('target_language', selectedLanguage)
          .in('id', sentenceIds);

        todayReviews = reviewSentences?.length || 0;
      }

      setProgress({
        todaySentences: sentencesData?.length || 0,
        todayReviews,
        sentenceGoal: goalsData?.daily_sentence_goal || 3,
        reviewGoal: goalsData?.daily_review_goal || 5,
      });
    } catch (error) {
      console.error('Failed to load daily progress:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    progress,
    loading,
    refreshProgress: loadDailyProgress,
  };
}