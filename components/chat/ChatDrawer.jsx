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
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const previousScrollHeight = useRef(0);

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

      // Single query to get rooms with workspace info
      const { data: roomsData } = await supabase
        .from('chat_rooms')
        .select('*, workspace:workspace_id(name)')
        .in('id', roomIds)
        .order('updated_at', { ascending: false });

      if (!roomsData) return;

      // Batch fetch all last messages in one query
      const { data: allLastMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false });

      // Group messages by room_id and get the latest one
      const lastMessagesByRoom = {};
      allLastMessages?.forEach((msg) => {
        if (!lastMessagesByRoom[msg.room_id]) {
          lastMessagesByRoom[msg.room_id] = msg;
        }
      });

      // Batch fetch all direct chat members
      const directRoomIds = roomsData.filter(r => r.type === 'direct').map(r => r.id);
      const { data: allMembers } = directRoomIds.length > 0 ? await supabase
        .from('chat_room_members')
        .select('room_id, user_id')
        .in('room_id', directRoomIds)
        .neq('user_id', userId) : { data: [] };

      // Batch fetch all member profiles
      const memberUserIds = allMembers?.map(m => m.user_id) || [];
      const { data: allProfiles } = memberUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', memberUserIds) : { data: [] };

      // Create profile lookup map
      const profileMap = {};
      allProfiles?.forEach(p => {
        profileMap[p.id] = p;
      });

      // Create member lookup map
      const membersByRoom = {};
      allMembers?.forEach(m => {
        membersByRoom[m.room_id] = profileMap[m.user_id];
      });

      // Build rooms with details (no more individual queries)
      const roomsWithDetails = roomsData.map((room) => {
        const memberInfo = memberData.find((m) => m.room_id === room.id);
        const lastMessage = lastMessagesByRoom[room.id] || null;
        const otherMember = room.type === 'direct' ? membersByRoom[room.id] : null;
        
        // Calculate unread count from messages we already have
        const unreadCount = allLastMessages?.filter(
          msg => msg.room_id === room.id && 
          msg.created_at > (memberInfo?.last_read_at || '1970-01-01')
        ).length || 0;

        return {
          ...room,
          lastMessage,
          otherMember,
          unreadCount,
        };
      });

      setChatRooms(roomsWithDetails);
      const totalUnread = roomsWithDetails.reduce((sum, room) => sum + room.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    }
  }, [userId]);

  const loadMessages = useCallback(async (roomId, offset = 0, append = false) => {
    if (!supabase || !roomId) return;

    const MESSAGES_PER_PAGE = 20;

    const { data, count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact' })
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + MESSAGES_PER_PAGE - 1);

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

      const messagesWithUsers = data.reverse().map((msg) => ({
        ...msg,
        user: profileMap[msg.user_id],
      }));

      if (append) {
        setMessages(prev => [...messagesWithUsers, ...prev]);
      } else {
        setMessages(messagesWithUsers);
      }

      setHasMoreMessages(count > offset + MESSAGES_PER_PAGE);
      setMessageOffset(offset + MESSAGES_PER_PAGE);

      // Scroll to bottom only on initial load
      if (!append) {
        setTimeout(() => scrollToBottom(false), 50);
      }
    }
  }, []);

  useEffect(() => {
    if (userId && open) {
      (async () => {
        await loadChatRooms();
      })();
    }
  }, [userId, open, loadChatRooms]);

  const loadMoreMessages = useCallback(async () => {
    if (!selectedRoom || loadingMore || !hasMoreMessages) return;

    setLoadingMore(true);
    const container = messagesContainerRef.current;
    if (container) {
      previousScrollHeight.current = container.scrollHeight;
    }

    await loadMessages(selectedRoom.id, messageOffset, true);

    // Maintain scroll position after loading older messages
    if (container) {
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - previousScrollHeight.current;
      });
    }

    setLoadingMore(false);
  }, [selectedRoom, loadingMore, hasMoreMessages, messageOffset, loadMessages]);

  const openChat = useCallback(
    (room) => {
      setSelectedRoom(room);
      setView('chat');
      setMessageOffset(0);
      setHasMoreMessages(false);
      loadMessages(room.id, 0, false);

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

  // Handle scroll to load more messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !selectedRoom) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMoreMessages && !loadingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [selectedRoom, hasMoreMessages, loadingMore, loadMoreMessages]);

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
    // Optimistically add message to UI
    const optimisticMessage = {
      id: Date.now(),
      room_id: selectedRoom.id,
      user_id: userId,
      content: messageText,
      created_at: new Date().toISOString(),
      user: { id: userId, email: 'You' }
    };
    setMessages(prev => [...prev, optimisticMessage]);

    // Scroll to bottom
    requestAnimationFrame(() => {
      scrollToBottom(true);
    });

    // Reload to get actual message from server
    setTimeout(() => loadMessages(selectedRoom.id, 0, false), 500);
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
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 z-50"
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

      <DrawerContent className="h-[85vh] max-w-md ml-auto mr-[1%] bg-white dark:bg-[#191919] border-l border-gray-200 dark:border-[#2a2a2a] pb-safe">
        <div className="flex flex-col h-full overflow-hidden">
          {view === 'list' ? (
            <>
              {/* Header - Fixed */}
              <DrawerHeader className="shrink-0 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#191919] px-6 py-4">
                <DrawerTitle className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Messages</DrawerTitle>
                <DrawerDescription className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {chatRooms.length} conversation{chatRooms.length !== 1 ? 's' : ''}
                </DrawerDescription>
              </DrawerHeader>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {chatRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                    <div className="p-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-full mb-4">
                      <ChatBubbleLeftIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">
                      No messages yet
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Start a conversation from the People panel
                    </p>
                  </div>
                ) : (
                  <div className="px-3 py-2">
                    {chatRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => openChat(room)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#212121] transition-colors text-left"
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11">
                            <AvatarFallback className="bg-gray-700 dark:bg-gray-600 text-white text-sm">
                              {room.type === 'workspace' ? (
                                <UserGroupIcon className="w-5 h-5" />
                              ) : (
                                room.otherMember?.email?.charAt(0).toUpperCase() || '?'
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {room.unreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-semibold"
                            >
                              {room.unreadCount > 9 ? '9+' : room.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] truncate">
                              {room.type === 'workspace'
                                ? room.workspace?.name || 'Workspace Chat'
                                : room.otherMember?.display_name || room.otherMember?.email || 'Direct Message'}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-500 shrink-0">
                              {formatTime(room.lastMessage?.created_at || room.updated_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
                            {room.lastMessage ? room.lastMessage.content : 'No messages yet'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Header - Fixed */}
              <div className="shrink-0 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#191919] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg"
                    onClick={() => {
                      setView('list');
                      setSelectedRoom(null);
                      setMessages([]);
                    }}
                  >
                    <ArrowLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </Button>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] truncate leading-tight">
                      {selectedRoom?.type === 'workspace'
                        ? selectedRoom?.workspace?.name
                        : selectedRoom?.otherMember?.display_name || selectedRoom?.otherMember?.email}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-500 leading-tight">
                      {selectedRoom?.type === 'workspace' ? 'Workspace Chat' : 'Direct Message'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages - Scrollable */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto bg-[#fafafa] dark:bg-[#1a1a1a] px-4 py-4"
              >
                <div className="space-y-4">
                  {loadingMore && (
                    <div className="flex justify-center py-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  )}
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-500 dark:text-gray-500">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.user_id === userId;
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-gray-700 dark:bg-gray-600 text-white text-xs">
                              {message.user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`flex flex-col gap-1 max-w-[75%] ${
                              isOwn ? 'items-end' : 'items-start'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 px-1">
                                {message.user?.display_name || message.user?.email}
                              </p>
                            )}
                            <div
                              className={`px-3 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-gray-900 dark:bg-gray-700 text-white rounded-br-md'
                                  : 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7] border border-gray-200 dark:border-[#383838] rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-600 px-1">
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input - Sticky at bottom */}
              <div className="shrink-0 border-t border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#191919] px-4 py-4">
                <div className="flex gap-2 items-center">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 h-10 bg-white dark:bg-[#212121] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 rounded-lg"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="icon"
                    className="h-10 w-10 shrink-0 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
