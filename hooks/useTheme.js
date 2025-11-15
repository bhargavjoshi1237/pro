import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useTheme(userId) {
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, [userId]);

  const loadTheme = async () => {
    if (!userId || !supabase) {
      // Fallback to localStorage if no user
      const savedTheme = localStorage.getItem('theme') || 'light';
      applyTheme(savedTheme);
      setTheme(savedTheme);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('theme')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const userTheme = data?.theme || 'light';
      applyTheme(userTheme);
      setTheme(userTheme);
    } catch (error) {
      console.error('Error loading theme:', error);
      const savedTheme = localStorage.getItem('theme') || 'light';
      applyTheme(savedTheme);
      setTheme(savedTheme);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (newTheme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  const updateTheme = async (newTheme) => {
    applyTheme(newTheme);
    setTheme(newTheme);

    if (!userId || !supabase) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          theme: newTheme,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    updateTheme(newTheme);
  };

  return { theme, toggleTheme, updateTheme, loading };
}
