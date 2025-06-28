import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface UserGoals {
  id: string;
  user_id: string;
  daily_sentence_goal: number;
  daily_review_goal: number;
  created_at: string;
  updated_at: string;
}

export function useUserGoals() {
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserGoals();
    }
  }, [user]);

  const loadUserGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setGoals(data);
      } else {
        // Create default goals if none exist
        await createDefaultGoals();
      }
    } catch (error) {
      console.error('Failed to load user goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          daily_sentence_goal: 3,
          daily_review_goal: 5,
        })
        .select()
        .single();

      if (error) throw error;
      setGoals(data);
    } catch (error) {
      console.error('Failed to create default goals:', error);
    }
  };

  const updateGoals = async (newGoals: Partial<Pick<UserGoals, 'daily_sentence_goal' | 'daily_review_goal'>>) => {
    if (!user || !goals) return;

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .update(newGoals)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setGoals(data);
      return { data, error: null };
    } catch (error) {
      console.error('Failed to update goals:', error);
      return { data: null, error };
    }
  };

  return {
    goals,
    loading,
    updateGoals,
    refreshGoals: loadUserGoals,
  };
}