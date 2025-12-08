import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useSnippetComments(snippetId, userId) {
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  // Load current user data immediately
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!supabase || !userId) return;

      try {
        // Try to get from profiles first
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', userId)
          .single();

        if (!error && data) {
          setUsers(prev => ({ ...prev, [data.id]: data }));
        } else {
          // Fallback: try to get from auth.users metadata
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.id === userId) {
            setUsers(prev => ({ 
              ...prev, 
              [user.id]: { 
                id: user.id, 
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
              } 
            }));
          }
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };

    loadCurrentUser();
  }, [userId]);

  useEffect(() => {
    const loadComments = async () => {
      if (!supabase || !snippetId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('snippet_comments')
          .select('*')
          .eq('snippet_id', snippetId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Fetch user data for all unique user IDs
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(c => c.user_id))];
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);

          if (!userError && userData) {
            setUsers(prev => {
              const usersMap = { ...prev };
              userData.forEach(user => {
                usersMap[user.id] = user;
              });
              return usersMap;
            });
          } else {
            console.warn('Could not fetch user profiles:', userError);
          }
        }
        
        setComments(data || []);
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComments();

    // Subscribe to realtime changes
    if (supabase && snippetId) {
      const channel = supabase
        .channel(`snippet_comments:${snippetId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'snippet_comments',
            filter: `snippet_id=eq.${snippetId}`
          },
          () => {
            loadComments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [snippetId]);

  const addComment = async (content, lineNumber = null) => {
    if (!supabase || !snippetId || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('snippet_comments')
        .insert([{
          snippet_id: snippetId,
          user_id: userId,
          content,
          line_number: lineNumber
        }])
        .select()
        .single();

      if (error) throw error;

      // Immediately add the comment to the local state with user data
      if (data) {
        setComments(prev => [...prev, data]);
        
        // Ensure current user is in users map
        if (!users[userId]) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('id', userId)
            .single();
          
          if (userData) {
            setUsers(prev => ({ ...prev, [userData.id]: userData }));
          }
        }
      }

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  };

  const updateComment = async (commentId, content) => {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('snippet_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      return false;
    }
  };

  const deleteComment = async (commentId) => {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('snippet_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  };

  const getOverallComments = () => {
    return comments.filter(c => c.line_number === null);
  };

  const getLineComments = (lineNumber) => {
    return comments.filter(c => c.line_number === lineNumber);
  };

  const getCommentsByLine = () => {
    const byLine = {};
    comments.forEach(comment => {
      if (comment.line_number !== null) {
        if (!byLine[comment.line_number]) {
          byLine[comment.line_number] = [];
        }
        byLine[comment.line_number].push(comment);
      }
    });
    return byLine;
  };

  return {
    comments,
    users,
    loading,
    addComment,
    updateComment,
    deleteComment,
    getOverallComments,
    getLineComments,
    getCommentsByLine
  };
}
