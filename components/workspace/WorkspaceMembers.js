import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function WorkspaceMembers({ workspaceId }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!supabase || !workspaceId || !currentUser) return;

    // Load initial active sessions with profiles
    const loadActiveSessions = async () => {
      const { data, error } = await supabase
        .from('active_sessions')
        .select(`
          *,
          profiles (
            email,
            display_name,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId)
        .neq('user_id', currentUser.id);

      if (!error && data) {
        setActiveSessions(data);
      }
    };

    loadActiveSessions();

    // Subscribe to changes
    const channel = supabase
      .channel(`workspace_members:${workspaceId}`)
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
            if (payload.new.user_id !== currentUser.id) {
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, currentUser]);

  const getInitials = (email, displayName) => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    return email?.charAt(0).toUpperCase() || 'U';
  };

  if (activeSessions.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-3 py-3">
      <div className="flex items-center justify-end mb-2 ">
        <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase">
          Active ({activeSessions.length})
        </h4>
      </div>

      <div className="flex justify-end -space-x-2 ">
        <TooltipProvider>
          {activeSessions.slice(0, 5).map((session) => (
            <Tooltip key={session.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="w-10 h-10 border-2 border-white dark:border-[#191919]">
                    {session.profiles?.avatar_url ? (
                      <img
                        src={session.profiles.avatar_url}
                        alt={session.profiles.display_name || session.profiles.email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback
                        className="text-white text-xs font-semibold"
                        style={{ backgroundColor: session.color || '#3b82f6' }}
                      >
                        {getInitials(session.profiles?.email, session.profiles?.display_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {/* Active indicator */}
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#191919]"
                    style={{ backgroundColor: session.color || '#3b82f6' }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs font-medium">
                  {session.profiles?.display_name || session.profiles?.email || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-400">Active in workspace</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {activeSessions.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-[#2a2a2a] border-2 border-white dark:border-[#191919] flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    +{activeSessions.length - 5}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {activeSessions.slice(5).map((session) => (
                    <p key={session.id} className="text-xs">
                      {session.profiles?.display_name || session.profiles?.email || 'Unknown User'}
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}
