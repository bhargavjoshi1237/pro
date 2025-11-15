import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// Generate a random color for the user's cursor
const generateUserColor = () => {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export function useRealtimeCollaboration(workspaceId, snippetId, userId) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [userColor] = useState(() => generateUserColor());
  const sessionRef = useRef(null);
  const heartbeatRef = useRef(null);

  // Initialize user session
  const initializeSession = useCallback(async () => {
    if (!supabase || !userId || !workspaceId) return;

    try {
      // Upsert user session
      const { data, error } = await supabase
        .from('active_sessions')
        .upsert({
          user_id: userId,
          workspace_id: workspaceId,
          snippet_id: snippetId,
          color: userColor,
          last_seen: new Date().toISOString(),
        }, {
          onConflict: 'user_id,workspace_id'
        })
        .select('id')
        .single();

      if (error) throw error;
      sessionRef.current = data.id;
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  }, [userId, workspaceId, snippetId, userColor]);

  // Update cursor position
  const updateCursorPosition = useCallback(async (position, selectionStart, selectionEnd) => {
    if (!supabase || !sessionRef.current) return;

    try {
      await supabase
        .from('active_sessions')
        .update({
          cursor_position: position,
          selection_start: selectionStart,
          selection_end: selectionEnd,
          snippet_id: snippetId,
          last_seen: new Date().toISOString(),
        })
        .eq('id', sessionRef.current);
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }, [snippetId]);

  // Heartbeat to keep session alive
  const sendHeartbeat = useCallback(async () => {
    if (!supabase || !sessionRef.current) return;

    try {
      await supabase
        .from('active_sessions')
        .update({
          last_seen: new Date().toISOString(),
        })
        .eq('id', sessionRef.current);
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }, []);

  // Cleanup session on unmount
  const cleanupSession = useCallback(async () => {
    if (!supabase || !sessionRef.current) return;

    try {
      await supabase
        .from('active_sessions')
        .delete()
        .eq('id', sessionRef.current);
    } catch (error) {
      console.error('Error cleaning up session:', error);
    }
  }, []);

  // Load active sessions
  const loadActiveSessions = useCallback(async () => {
    if (!supabase || !workspaceId) return;

    try {
      const { data, error } = await supabase
        .from('active_sessions')
        .select(`
          *,
          profiles(email, display_name, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .neq('user_id', userId);

      if (error) throw error;
      setActiveSessions(data || []);
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  }, [workspaceId, userId]);

  // Initialize session and realtime subscriptions
  useEffect(() => {
    if (!supabase || !workspaceId || !userId) return;

    initializeSession();
    loadActiveSessions();

    // Set up heartbeat (every 30 seconds)
    heartbeatRef.current = setInterval(sendHeartbeat, 30000);

    // Subscribe to active sessions changes
    const channel = supabase
      .channel(`workspace:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new.user_id !== userId) {
              // Fetch profile data for the session
              const { data: profileData } = await supabase
                .from('profiles')
                .select('email, display_name, avatar_url')
                .eq('id', payload.new.user_id)
                .single();

              const sessionWithProfile = {
                ...payload.new,
                profiles: profileData
              };

              setActiveSessions((prev) => {
                const filtered = prev.filter((s) => s.user_id !== payload.new.user_id);
                return [...filtered, sessionWithProfile];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setActiveSessions((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      cleanupSession();
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [workspaceId, userId, initializeSession, loadActiveSessions, sendHeartbeat, cleanupSession]);

  return {
    activeSessions,
    userColor,
    updateCursorPosition,
  };
}
