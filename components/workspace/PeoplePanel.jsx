'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  UserGroupIcon, 
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
};

export function PeoplePanel({ workspaceId, currentUserId }) {
  const [members, setMembers] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);

  const loadMembers = useCallback(async () => {
    if (!workspaceId) return;
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*, profiles(id, email, display_name, avatar_url)')
      .eq('workspace_id', workspaceId);

    if (!error && data) {
      setMembers(data);
    }
  }, [workspaceId]);

  const loadActiveSessions = useCallback(async () => {
    if (!workspaceId) return;
    const { data, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (!error && data) {
      setActiveSessions(data);
    }
  }, [workspaceId]);

  const updatePresence = useCallback(async () => {
    if (!workspaceId || !currentUserId) return;
    const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    
    await supabase
      .from('active_sessions')
      .upsert({
        user_id: currentUserId,
        workspace_id: workspaceId,
        color,
        status: 'online',
        last_seen: new Date().toISOString(),
      }, {
        onConflict: 'user_id,workspace_id'
      });
  }, [currentUserId, workspaceId]);

  const removePresence = useCallback(async () => {
    if (!workspaceId || !currentUserId) return;
    await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', currentUserId)
      .eq('workspace_id', workspaceId);
  }, [currentUserId, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    (async () => {
      await Promise.all([loadMembers(), loadActiveSessions()]);
    })();

    const channel = supabase
      .channel(`workspace:${workspaceId}:presence`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          loadActiveSessions();
        }
      )
      .subscribe();

    const presenceInterval = setInterval(() => {
      updatePresence();
    }, 30000);

    updatePresence();

    return () => {
      channel.unsubscribe();
      clearInterval(presenceInterval);
      removePresence();
    };
  }, [workspaceId, loadMembers, loadActiveSessions, updatePresence, removePresence]);

  const startDirectChat = useCallback(async (otherUserId) => {
    if (!currentUserId || !workspaceId) return;
    
    try {
      // First, check if a direct chat room already exists
      const { data: myRooms } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', currentUserId);

      if (myRooms && myRooms.length > 0) {
        const roomIds = myRooms.map(r => r.room_id);
        
        // Get direct chat rooms in this workspace
        const { data: directRooms } = await supabase
          .from('chat_rooms')
          .select('id')
          .in('id', roomIds)
          .eq('type', 'direct')
          .eq('workspace_id', workspaceId);

        if (directRooms && directRooms.length > 0) {
          // Check each room to see if it's with the other user
          for (const room of directRooms) {
            const { data: roomMembers } = await supabase
              .from('chat_room_members')
              .select('user_id')
              .eq('room_id', room.id);

            const memberIds = roomMembers?.map(m => m.user_id) || [];
            if (memberIds.includes(otherUserId) && memberIds.includes(currentUserId) && memberIds.length === 2) {
              // Found existing room
              window.dispatchEvent(new CustomEvent('openChat', { detail: { roomId: room.id } }));
              return;
            }
          }
        }
      }

      // Create new direct chat room
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          workspace_id: workspaceId,
          type: 'direct',
          name: null
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating chat room:', createError);
        console.error('Error details:', JSON.stringify(createError, null, 2));
        console.error('Workspace ID:', workspaceId);
        console.error('Current User ID:', currentUserId);
        alert(`Failed to create chat room: ${createError?.message || 'Unknown error'}`);
        return;
      }
      
      console.log('Chat room created successfully:', newRoom);

      // Add both users as members
      const { error: membersError } = await supabase
        .from('chat_room_members')
        .insert([
          { room_id: newRoom.id, user_id: currentUserId },
          { room_id: newRoom.id, user_id: otherUserId }
        ]);

      if (membersError) {
        console.error('Error adding members:', membersError);
        return;
      }

      // Open the new chat
      window.dispatchEvent(new CustomEvent('openChat', { detail: { roomId: newRoom.id } }));
    } catch (error) {
      console.error('Error in startDirectChat:', error);
    }
  }, [currentUserId, workspaceId]);

  const getUserStatus = (userId) => {
    const session = activeSessions.find(s => s.user_id === userId);
    if (!session) return 'offline';
    
    const lastSeen = new Date(session.last_seen);
    const now = new Date();
    const diffMinutes = (now - lastSeen) / 1000 / 60;
    
    if (diffMinutes > 5) return 'offline';
    return session.status || 'online';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'away':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'busy':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  const openWorkspaceChat = useCallback(async () => {
    if (!currentUserId || !workspaceId) return;
    
    try {
      // Check if workspace chat already exists
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('type', 'workspace')
        .single();

      if (existingRoom) {
        // Open existing workspace chat
        window.dispatchEvent(new CustomEvent('openChat', { detail: { roomId: existingRoom.id } }));
        return;
      }

      // Create new workspace chat room
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          workspace_id: workspaceId,
          type: 'workspace',
          name: 'Workspace Chat'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating workspace chat:', createError);
        alert(`Failed to create workspace chat: ${createError?.message || 'Unknown error'}`);
        return;
      }

      // Add all workspace members to the chat
      const memberInserts = members.map(member => ({
        room_id: newRoom.id,
        user_id: member.profiles.id
      }));

      const { error: membersError } = await supabase
        .from('chat_room_members')
        .insert(memberInserts);

      if (membersError) {
        console.error('Error adding members to workspace chat:', membersError);
        return;
      }

      // Open the new workspace chat
      window.dispatchEvent(new CustomEvent('openChat', { detail: { roomId: newRoom.id } }));
    } catch (error) {
      console.error('Error in openWorkspaceChat:', error);
    }
  }, [currentUserId, workspaceId, members]);

 return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-[#2a2a2a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="font-semibold text-gray-900 dark:text-[#e7e7e7]">
            People
          </h2>
          <Badge variant="secondary" className="ml-auto bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7]">
            {members.length}
          </Badge>
        </div>
      </div>

      {/* Workspace Chat Button */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
        <Button
          onClick={openWorkspaceChat}
          className="w-full bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] text-gray-900 dark:text-[#e7e7e7] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <ChatBubbleLeftIcon className="w-4 h-4" />
          <span>Workspace Chat</span>
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Chat with all workspace members
        </p>
      </div>

      {/* Members List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {members.map((member) => {
            const status = getUserStatus(member.profiles.id);
            const isCurrentUser = member.profiles.id === currentUserId;

            return (
<div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#252525] hover:bg-gray-100 dark:hover:bg-[#2f2f2f] transition-colors border border-gray-200 dark:border-[#333333]"
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-500 dark:bg-gray-600 text-white">
                      {member.profiles.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#181818]",
                    STATUS_COLORS[status]
                  )} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7] truncate">
                      {member.profiles.display_name || member.profiles.email}
                    </p>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs text-gray-900 dark:text-[#e7e7e7]">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {getStatusIcon(status)}
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {status}
                    </p>
                    {member.role && (
                      <>
                        <span className="text-gray-600 dark:text-gray-400">•</span>
                        <Badge variant="secondary" className="text-xs h-4 px-1 bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7]">
                          {member.role}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!isCurrentUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startDirectChat(member.profiles.id)}
                    title="Start chat"
                    className="hover:bg-gray-200 dark:hover:bg-[#303030]"
                  >
                    <ChatBubbleLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
