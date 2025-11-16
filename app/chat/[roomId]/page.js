'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { LoadingPage } from '@/components/LoadingSpinner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function ChatPageContent() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId;
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [otherMember, setOtherMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRoom = async (userId) => {
    if (!supabase || !roomId) return;

    try {
      // Load room details
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*, workspace:workspace_id(id, name)')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Check if user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('chat_room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single();

      if (memberError || !memberData) {
        router.push('/chat');
        return;
      }

      // Get other member for direct chats
      if (roomData.type === 'direct') {
        const { data: members } = await supabase
          .from('chat_room_members')
          .select('user_id, profiles(email, display_name, avatar_url)')
          .eq('room_id', roomId)
          .neq('user_id', userId);

        if (members && members.length > 0) {
          setOtherMember(members[0].profiles);
        }
      }

      setRoom(roomData);
    } catch (error) {
      console.error('Error loading room:', error);
      router.push('/chat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      loadRoom(session.user.id);
    };
    
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, roomId]);

  if (loading || !user) {
    return <LoadingPage message="Loading chat..." />;
  }

  const displayName = room?.type === 'workspace' 
    ? room?.workspace?.name 
    : otherMember?.display_name || otherMember?.email || 'Direct Message';

  const displaySubtitle = room?.type === 'workspace' 
    ? 'Workspace Chat' 
    : 'Private Conversation';

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#191919] dark:to-[#151515]">
      {/* Header with improved design */}
      <div className="bg-white flex items-center gap-4 px-6 py-4  dark:bg-[#181818]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#2a2a2a] shadow-sm">
        <button
          onClick={() => router.push('/chat')}
          className="p-2.5 rounded-xl bg-gray-200 dark:bg-[#2f2f2f] dark:hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-all duration-200 hover:scale-105 shadow-sm"
          aria-label="Back to chats"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
        </button>
        
        <Avatar className="h-10 w-10 ring-2 ring-gray-200 dark:ring-[#2a2a2a]">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
            {room?.type === 'workspace' ? (
              <UserGroupIcon className="w-5 h-5" />
            ) : (
              otherMember?.email?.charAt(0).toUpperCase() || '?'
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] truncate">
            {displayName}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {displaySubtitle}
          </p>
        </div>
      </div>

      {/* Chat Room with margin */}
      <div className="flex-1 overflow-hidden" style={{ marginRight: '2%' }}>
        <ChatRoom 
          roomId={roomId}
          currentUserId={user.id}
          workspaceId={room?.workspace_id}
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ThemeProvider>
      <ChatPageContent />
    </ThemeProvider>
  );
}
