'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export function ChatDrawer({ userId }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'chat'
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    // Prefer a direct DOM scroll on the scroll container if present
    const container = messagesContainerRef.current;
    if (container) {
      try {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
        return;
      } catch (e) {
        // fallback below
      }
    }

    // fallback: scroll the end ref into view
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  const loadChatRooms = useCallback(async () => {
    if (!supabase || !userId) return;

    try {
      const { data: memberData } = await supabase
        .from('chat_room_members')
        .select('room_id, last_read_at')
        .eq('user_id', userId);

      if (!memberData || memberData.length === 0) {
        setChatRooms([]);
        return;
      }

      const roomIds = memberData.map((m) => m.room_id);

      const { data: roomsData } = await supabase
        .from('chat_rooms')
        .select('*, workspace:workspace_id(name)')
        .in('id', roomIds)
        .order('updated_at', { ascending: false });

      if (!roomsData) return;

      const roomsWithDetails = await Promise.all(
        roomsData.map(async (room) => {
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          let otherMember = null;
          if (room.type === 'direct') {
            const { data: members } = await supabase
              .from('chat_room_members')
              .select('user_id')
              .eq('room_id', room.id)
              .neq('user_id', userId);

            if (members && members.length > 0) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email, display_name')
                .eq('id', members[0].user_id)
                .single();

              otherMember = profile;
            }
          }

          const memberInfo = memberData.find((m) => m.room_id === room.id);
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .gt('created_at', memberInfo?.last_read_at || '1970-01-01');

          return {
            ...room,
            lastMessage,
            otherMember,
            unreadCount: unreadCount || 0,
          };
        })
      );

      setChatRooms(roomsWithDetails);
      const totalUnread = roomsWithDetails.reduce((sum, room) => sum + room.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    }
  }, [userId]);

  const loadMessages = useCallback(async (roomId) => {
    if (!supabase || !roomId) return;

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      // Fetch user profiles for all messages
      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', userIds);

      const profileMap = {};
      profiles?.forEach((p) => {
        profileMap[p.id] = p;
      });

      const messagesWithUsers = data.map((msg) => ({
        ...msg,
        user: profileMap[msg.user_id],
      }));

      setMessages(messagesWithUsers);

      // small timeout to allow DOM to render then scroll
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, []);

  useEffect(() => {
    if (userId && open) {
      (async () => {
        await loadChatRooms();
      })();
    }
  }, [userId, open, loadChatRooms]);

  const openChat = useCallback(
    (room) => {
      setSelectedRoom(room);
      setView('chat');
      loadMessages(room.id);

      // Mark as read
      supabase
        .from('chat_room_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .then(() => loadChatRooms());
    },
    [userId, loadMessages, loadChatRooms]
  );

  useEffect(() => {
    if (!userId || !open) return;

    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          loadChatRooms();
          if (selectedRoom) {
            loadMessages(selectedRoom.id);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, open, selectedRoom, loadChatRooms, loadMessages]);

  // Listen for openChat event from People Panel
  useEffect(() => {
    const handleOpenChat = async (event) => {
      const { roomId } = event.detail;
      if (!roomId) return;

      // Open drawer
      setOpen(true);

      // Load room details
      const { data: roomData } = await supabase
        .from('chat_rooms')
        .select('*, workspace:workspace_id(name)')
        .eq('id', roomId)
        .single();

      if (roomData) {
        // Get other member for direct chats
        let otherMember = null;
        if (roomData.type === 'direct') {
          const { data: members } = await supabase
            .from('chat_room_members')
            .select('user_id')
            .eq('room_id', roomId)
            .neq('user_id', userId);

          if (members && members.length > 0) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, display_name')
              .eq('id', members[0].user_id)
              .single();

            otherMember = profile;
          }
        }

        const room = { ...roomData, otherMember };
        openChat(room);
      }
    };

    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, [userId, openChat]);

const sendMessage = async () => {
  if (!newMessage.trim() || !selectedRoom) return;

  const messageText = newMessage;
  setNewMessage('');

  const { error } = await supabase.from('chat_messages').insert([
    {
      room_id: selectedRoom.id,
      user_id: userId,
      content: messageText,
    },
  ]);

  if (!error) {
    await loadMessages(selectedRoom.id);

    // 🔥 ensure DOM renders then scroll bottom
    requestAnimationFrame(() => {
      scrollToBottom(true);
    });
  } else {
    console.error('Send message error:', error);
    setNewMessage(messageText);
  }
};


  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  };

  // whenever messages change, auto scroll
  useEffect(() => {
    // short delay so DOM updates first
    const t = setTimeout(() => scrollToBottom(false), 50);
    return () => clearTimeout(t);
  }, [messages]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white z-50"
        >
          <ChatBubbleLeftIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>

      {/* DrawerContent uses full-height flex column so footer stays fixed */}
      <DrawerContent className="h-[85vh] max-w-md ml-auto mr-[1%] bg-white dark:bg-[#181818]">
        <div className="flex flex-col h-full">
          {view === 'list' ? (
            <>
              <DrawerHeader className="border-b border-gray-200 dark:border-[#2a2a2a]">
                <DrawerTitle className="text-gray-900 dark:text-[#e7e7e7]">Messages</DrawerTitle>
                <DrawerDescription className="text-gray-600 dark:text-gray-400">
                  {chatRooms.length} conversation{chatRooms.length !== 1 ? 's' : ''}
                </DrawerDescription>
              </DrawerHeader>

              <ScrollArea className="flex-1 p-4 overflow-auto">
                {chatRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="p-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-full mb-4">
                      <ChatBubbleLeftIcon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">
                      No messages yet
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Start a conversation from the People panel
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chatRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => openChat(room)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-left"
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-600 text-white">
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
                              {room.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] truncate">
                              {room.type === 'workspace'
                                ? room.workspace?.name || 'Workspace Chat'
                                : room.otherMember?.display_name || room.otherMember?.email || 'Direct Message'}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                              {formatTime(room.lastMessage?.created_at || room.updated_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {room.lastMessage ? room.lastMessage.content : 'No messages yet'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <>
              <DrawerHeader className="border-b border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex items-center gap-3 ">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333333]"
                    onClick={() => {
                      setView('list');
                      setSelectedRoom(null);
                      setMessages([]);
                    }}
                  >
                    <ArrowLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </Button>
                  <div className="flex-1">
                    <DrawerTitle className="text-gray-900 dark:text-[#e7e7e7]">
                      {selectedRoom?.type === 'workspace'
                        ? selectedRoom?.workspace?.name
                        : selectedRoom?.otherMember?.display_name || selectedRoom?.otherMember?.email}
                    </DrawerTitle>
                    <DrawerDescription className="text-gray-600 dark:text-gray-400">
                      {selectedRoom?.type === 'workspace' ? 'Workspace Chat' : 'Direct Message'}
                    </DrawerDescription>
                  </div>
                </div>
              </DrawerHeader>

              {/* Messages area: scrollable */}
              <ScrollArea
                className="flex-1 p-4 bg-gray-50 dark:bg-[#1c1c1c] overflow-auto"
                ref={messagesContainerRef}
              >
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.user_id === userId;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {message.user?.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`flex flex-col gap-1 max-w-[70%] ${
                            isOwn ? 'items-end' : 'items-start'
                          }`}
                        >
                          {!isOwn && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                              {message.user?.display_name || message.user?.email}
                            </p>
                          )}
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7]'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-all">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Footer: input + send (fixed at bottom by flex layout) */}
              <DrawerFooter className="border-t border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#181818] sticky bottom-0 z-10">
                <div className="flex gap-2 w-full">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
