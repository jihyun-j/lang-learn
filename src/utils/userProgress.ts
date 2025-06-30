import { supabase } from '../lib/supabase';
import { format, subDays, isToday, isYesterday } from 'date-fns';

export interface UserProgressData {
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  total_sentences: number;
  sentences_mastered: number;
  total_study_time: number;
}

/**
 * Updates user progress and calculates consecutive learning days
 * @param userId - The user's ID
 * @returns Promise<void>
 */
export async function updateUserProgress(userId: string): Promise<void> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Get current user progress
    const { data: currentProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      throw progressError;
    }

    let newStreak = 1;
    let newLongestStreak = 1;

    if (currentProgress) {
      const lastStudyDate = currentProgress.last_study_date;
      
      if (lastStudyDate) {
        const lastDate = new Date(lastStudyDate);
        
        if (isToday(lastDate)) {
          // Already studied today, don't update streak
          return;
        } else if (isYesterday(lastDate)) {
          // Studied yesterday, continue streak
          newStreak = currentProgress.current_streak + 1;
        } else {
          // Gap in studying, reset streak
          newStreak = 1;
        }
      }
      
      // Update longest streak if current streak is longer
      newLongestStreak = Math.max(newStreak, currentProgress.longest_streak || 0);
    }

    // Get total sentences count for this user
    const { data: sentencesData, error: sentencesError } = await supabase
      .from('sentences')
      .select('id')
      .eq('user_id', userId);

    if (sentencesError) {
      throw sentencesError;
    }

    const totalSentences = sentencesData?.length || 0;

    // Get total review sessions count
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('review_sessions')
      .select('overall_score')
      .eq('user_id', userId);

    if (reviewsError) {
      throw reviewsError;
    }

    // Calculate sentences mastered (reviews with score >= 80)
    const sentencesMastered = reviewsData?.filter(review => review.overall_score >= 80).length || 0;

    // Estimate total study time (rough calculation based on activities)
    const estimatedStudyTime = (totalSentences * 2) + (reviewsData?.length || 0) * 1; // 2 min per sentence, 1 min per review

    // Upsert user progress
    const progressData = {
      user_id: userId,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_study_date: today,
      total_sentences: totalSentences,
      sentences_mastered: sentencesMastered,
      total_study_time: estimatedStudyTime,
      updated_at: new Date().toISOString()
    };

    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert(progressData, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      throw upsertError;
    }

    console.log(`User progress updated: streak ${newStreak}, total sentences ${totalSentences}`);
  } catch (error) {
    console.error('Failed to update user progress:', error);
    // Don't throw error to prevent disrupting the main flow
  }
}

/**
 * Gets current user progress data
 * @param userId - The user's ID
 * @returns Promise<UserProgressData | null>
 */
export async function getUserProgress(userId: string): Promise<UserProgressData | null> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No progress record found, return default values
        return {
          current_streak: 0,
          longest_streak: 0,
          last_study_date: null,
          total_sentences: 0,
          sentences_mastered: 0,
          total_study_time: 0
        };
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get user progress:', error);
    return null;
  }
}

/**
 * Checks if user has studied today
 * @param userId - The user's ID
 * @returns Promise<boolean>
 */
export async function hasStudiedToday(userId: string): Promise<boolean> {
  try {
    const progress = await getUserProgress(userId);
    if (!progress || !progress.last_study_date) {
      return false;
    }
    
    return isToday(new Date(progress.last_study_date));
  } catch (error) {
    console.error('Failed to check if studied today:', error);
    return false;
  }
}