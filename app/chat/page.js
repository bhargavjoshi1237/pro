'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/context/ThemeContext';
import { 
  ChatBubbleLeftIcon, 
  UserGroupIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import { LoadingPage } from '@/components/LoadingSpinner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

function ChatListContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      loadChatRooms(session.user.id);
    };
    
    checkAuth();
  }, [router]);

  const loadChatRooms = async (userId) => {
    if (!supabase) return;

    try {
      // Get all rooms user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('chat_room_members')
        .select('room_id, last_read_at')
        .eq('user_id', userId);

      if (memberError) throw memberError;

      const roomIds = memberData.map(m => m.room_id);

      if (roomIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get room details
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*, workspace:workspace_id(name)')
        .in('id', roomIds)
        .order('updated_at', { ascending: false });

      if (roomsError) throw roomsError;

      // Get last message for each room
      const roomsWithMessages = await Promise.all(
        roomsData.map(async (room) => {
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('*, user:user_id(email)')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get other members for direct chats
          let otherMember = null;
          if (room.type === 'direct') {
            const { data: members } = await supabase
              .from('chat_room_members')
              .select('user_id, profiles(email, display_name)')
              .eq('room_id', room.id)
              .neq('user_id', userId);

            if (members && members.length > 0) {
              otherMember = members[0].profiles;
            }
          }

          // Count unread messages
          const memberInfo = memberData.find(m => m.room_id === room.id);
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .gt('created_at', memberInfo?.last_read_at || '1970-01-01');

          return {
            ...room,
            lastMessage,
            otherMember,
            unreadCount: unreadCount || 0
          };
        })
      );

      setChatRooms(roomsWithMessages);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading || !user) {
    return <LoadingPage message="Loading chats..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#191919]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white dark:bg-[#181818] border-b border-gray-200 dark:border-[#2a2a2a]">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-[#e7e7e7]">Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {chatRooms.length} conversation{chatRooms.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-auto">
        {chatRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="p-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-full mb-4">
              <ChatBubbleLeftIcon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">
              No messages yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
              Start a conversation from the People panel in any workspace
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
            {/* Workspace chats first */}
            {chatRooms.filter(room => room.type === 'workspace').map((room) => (
              <button
                key={room.id}
                onClick={() => router.push(`/chat/${room.id}`)}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-blue-50 dark:hover:bg-[#1c1c1c] transition-colors text-left border-l-4 border-blue-500"
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-blue-200 dark:ring-blue-900">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      <UserGroupIcon className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  {room.unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] truncate">
                        {room.workspace?.name || 'Workspace Chat'}
                      </h3>
                      <Badge variant="secondary" className="text-xs">Workspace</Badge>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                      {formatTime(room.lastMessage?.created_at || room.updated_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {room.lastMessage ? (
                      <>
                        {room.lastMessage.user_id === user.id && 'You: '}
                        {room.lastMessage.content}
                      </>
                    ) : (
                      'No messages yet'
                    )}
                  </p>
                </div>
              </button>
            ))}
            
            {/* Direct messages */}
            {chatRooms.filter(room => room.type === 'direct').map((room) => (
              <button
                key={room.id}
                onClick={() => router.push(`/chat/${room.id}`)}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#1c1c1c] transition-colors text-left"
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {room.type === 'workspace' ? (
                        <UserGroupIcon className="w-6 h-6" />
                      ) : (
                        room.otherMember?.email?.charAt(0).toUpperCase() || '?'
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {room.unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] truncate">
                      {room.type === 'workspace' 
                        ? room.workspace?.name || 'Workspace Chat'
                        : room.otherMember?.display_name || room.otherMember?.email || 'Direct Message'
                      }
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                      {formatTime(room.lastMessage?.created_at || room.updated_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {room.lastMessage ? (
                      <>
                        {room.lastMessage.user_id === user.id && 'You: '}
                        {room.lastMessage.content}
                      </>
                    ) : (
                      'No messages yet'
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatListPage() {
  return (
    <ThemeProvider>
      <ChatListContent />
    </ThemeProvider>
  );
}
