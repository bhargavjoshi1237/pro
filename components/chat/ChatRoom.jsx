'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PaperAirplaneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow, cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ChatRoom({ roomId, currentUserId, workspaceId = null }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const messagesEndRef = useRef(null);

  const loadMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, user:user_id(email, display_name)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [roomId]);

  const loadMembers = useCallback(async () => {
    if (!workspaceId) {
      setLoadingMembers(false);
      return;
    }
    
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('user_id, profiles(email, display_name)')
        .eq('workspace_id', workspaceId);

      if (!error && data) {
        setMembers(data.map(m => ({ 
          id: m.user_id, 
          email: m.profiles.email,
          displayName: m.profiles.display_name 
        })));
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [workspaceId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!roomId) return;

    // Load initial data
    (async () => {
      await Promise.all([loadMessages(), loadMembers()]);
    })();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [loadMembers, loadMessages, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Check for @ mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionSearch('');
    } else if (lastAtIndex !== -1) {
      const searchTerm = value.slice(lastAtIndex + 1);
      if (!searchTerm.includes(' ')) {
        setShowMentions(true);
        setMentionSearch(searchTerm);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (email) => {
    const lastAtIndex = newMessage.lastIndexOf('@');
    const beforeMention = newMessage.slice(0, lastAtIndex);
    setNewMessage(`${beforeMention}@${email} `);
    setShowMentions(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Extract mentions
    const mentionRegex = /@([^\s]+)/g;
    const mentionedEmails = [...newMessage.matchAll(mentionRegex)].map(m => m[1]);
    
    // Get user IDs for mentioned emails
    const mentionedUserIds = members
      .filter(m => mentionedEmails.includes(m.email))
      .map(m => m.id);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        room_id: roomId,
        user_id: currentUserId,
        content: newMessage,
        mentions: mentionedUserIds.length > 0 ? mentionedUserIds : null,
      }])
      .select()
      .single();

    if (!error && data) {
      // Send notifications to mentioned users
      for (const userId of mentionedUserIds) {
        await supabase.rpc('send_notification', {
          to_user_id: userId,
          notif_type: 'mention',
          notif_title: 'You were mentioned',
          notif_message: `${newMessage.slice(0, 100)}...`,
          notif_link: `/chat/${roomId}`,
        });
      }

      setNewMessage('');
    }
  };

  const filteredMembers = members.filter(m =>
    m.email.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Render message content with highlighted mentions
  const renderMessageContent = (content, isOwn) => {
    const mentionRegex = /@([^\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // Add mention with styling
      const mentionEmail = match[1];
      const isMentioningCurrentUser = members.find(m => m.email === mentionEmail)?.id === currentUserId;
      
      parts.push(
        <span
          key={match.index}
          className={cn(
            "font-semibold px-1 rounded",
            isMentioningCurrentUser
              ? isOwn 
                ? "bg-white/20 text-white" 
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : isOwn
                ? "bg-white/10 text-white"
                : "text-blue-600 dark:text-blue-400"
          )}
        >
          @{mentionEmail}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50 dark:from-[#1a1a1a] dark:to-[#151515]">
      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="p-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-full inline-block mb-3">
                <ChatBubbleLeftIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => {
              const isOwn = message.user_id === currentUserId;
              const displayName = message.user?.display_name || message.user?.email;
              
              return (
                <div
                  key={message.id}
                  className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300", isOwn && "flex-row-reverse")}
                >
                  <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-[#2a2a2a] shadow-sm">
                    <AvatarFallback className={cn(
                      "text-xs font-semibold",
                      isOwn 
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" 
                        : "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                    )}>
                      {message.user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("flex flex-col gap-1.5", isOwn ? "items-end" : "items-start", "max-w-[75%]")}>
                    {!isOwn && (
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 px-2">
                        {displayName}
                      </p>
                    )}
                    <div
                      className={cn(
                        "px-4 py-2.5 rounded-2xl shadow-sm",
                        isOwn
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
                          : "bg-white dark:bg-[#242424] text-gray-900 dark:text-[#e7e7e7] border border-gray-200 dark:border-[#2a2a2a] rounded-bl-md"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {renderMessageContent(message.content, isOwn)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 px-2">
                      {formatDistanceToNow(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Mention Suggestions */}
      {showMentions && filteredMembers.length > 0 && (
        <div className="border-t border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-2 shadow-lg">
          <ScrollArea className="max-h-40">
            <div className="space-y-1">
              {filteredMembers.map((member) => (
                <Button
                  key={member.id}
                  variant="ghost"
                  onClick={() => insertMention(member.email)}
                  className="w-full justify-start text-sm text-gray-900 dark:text-[#e7e7e7] hover:bg-blue-50 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                      {member.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{member.displayName || member.email}</span>
                    {member.displayName && (
                      <span className="text-xs text-gray-500">{member.email}</span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-[#2a2a2a] bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm p-4 shadow-lg">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message... (use @ to mention)"
            className="flex-1 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl h-12 w-12 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
