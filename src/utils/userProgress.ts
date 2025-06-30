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
 * Calculates actual study time based on review sessions
 * @param userId - The user's ID
 * @returns Promise<number> - Total study time in minutes
 */
async function calculateActualStudyTime(userId: string): Promise<number> {
  try {
    // Get all review sessions for the user
    const { data: reviewSessions, error } = await supabase
      .from('review_sessions')
      .select('created_at, overall_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    if (!reviewSessions || reviewSessions.length === 0) {
      return 0;
    }

    // Calculate study time based on review sessions
    // Each review session represents approximately 1-3 minutes of study time
    // We'll use a more sophisticated calculation:
    // - Base time per review: 2 minutes
    // - Additional time for lower scores (more practice needed): up to 1 extra minute
    let totalMinutes = 0;

    reviewSessions.forEach(session => {
      let sessionTime = 2; // Base 2 minutes per review
      
      // Add extra time for lower scores (indicates more practice/repetition)
      if (session.overall_score < 60) {
        sessionTime += 1.5; // Extra 1.5 minutes for very low scores
      } else if (session.overall_score < 80) {
        sessionTime += 1; // Extra 1 minute for medium scores
      } else if (session.overall_score < 90) {
        sessionTime += 0.5; // Extra 0.5 minutes for good scores
      }
      // Perfect scores (90+) get no extra time
      
      totalMinutes += sessionTime;
    });

    // Also add time for sentence creation (learning new sentences)
    const { data: sentences, error: sentencesError } = await supabase
      .from('sentences')
      .select('created_at')
      .eq('user_id', userId);

    if (!sentencesError && sentences) {
      // Each new sentence creation takes approximately 3-5 minutes
      // (thinking, typing, translation, saving)
      totalMinutes += sentences.length * 4; // 4 minutes average per sentence
    }

    return Math.round(totalMinutes);
  } catch (error) {
    console.error('Failed to calculate study time:', error);
    return 0;
  }
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
          // Already studied today, don't update streak but update other stats
          newStreak = currentProgress.current_streak;
          newLongestStreak = currentProgress.longest_streak;
        } else if (isYesterday(lastDate)) {
          // Studied yesterday, continue streak
          newStreak = currentProgress.current_streak + 1;
          newLongestStreak = Math.max(newStreak, currentProgress.longest_streak || 0);
        } else {
          // Gap in studying, reset streak
          newStreak = 1;
          newLongestStreak = Math.max(1, currentProgress.longest_streak || 0);
        }
      } else {
        newLongestStreak = Math.max(1, currentProgress.longest_streak || 0);
      }
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

    // Calculate actual study time based on real activity
    const totalStudyTime = await calculateActualStudyTime(userId);

    // Upsert user progress
    const progressData = {
      user_id: userId,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_study_date: today,
      total_sentences: totalSentences,
      sentences_mastered: sentencesMastered,
      total_study_time: totalStudyTime,
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

    console.log(`User progress updated: streak ${newStreak}, total sentences ${totalSentences}, study time ${totalStudyTime} minutes`);
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
        // No progress record found, calculate and return current values
        const totalStudyTime = await calculateActualStudyTime(userId);
        
        return {
          current_streak: 0,
          longest_streak: 0,
          last_study_date: null,
          total_sentences: 0,
          sentences_mastered: 0,
          total_study_time: totalStudyTime
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

/**
 * Gets detailed study time breakdown for a user
 * @param userId - The user's ID
 * @returns Promise<{reviewTime: number, learningTime: number, totalTime: number}>
 */
export async function getStudyTimeBreakdown(userId: string): Promise<{
  reviewTime: number;
  learningTime: number;
  totalTime: number;
}> {
  try {
    // Calculate review time
    const { data: reviewSessions, error: reviewError } = await supabase
      .from('review_sessions')
      .select('overall_score')
      .eq('user_id', userId);

    let reviewTime = 0;
    if (!reviewError && reviewSessions) {
      reviewSessions.forEach(session => {
        let sessionTime = 2; // Base 2 minutes per review
        
        if (session.overall_score < 60) {
          sessionTime += 1.5;
        } else if (session.overall_score < 80) {
          sessionTime += 1;
        } else if (session.overall_score < 90) {
          sessionTime += 0.5;
        }
        
        reviewTime += sessionTime;
      });
    }

    // Calculate learning time (sentence creation)
    const { data: sentences, error: sentencesError } = await supabase
      .from('sentences')
      .select('id')
      .eq('user_id', userId);

    let learningTime = 0;
    if (!sentencesError && sentences) {
      learningTime = sentences.length * 4; // 4 minutes per sentence
    }

    const totalTime = reviewTime + learningTime;

    return {
      reviewTime: Math.round(reviewTime),
      learningTime: Math.round(learningTime),
      totalTime: Math.round(totalTime)
    };
  } catch (error) {
    console.error('Failed to get study time breakdown:', error);
    return {
      reviewTime: 0,
      learningTime: 0,
      totalTime: 0
    };
  }
}