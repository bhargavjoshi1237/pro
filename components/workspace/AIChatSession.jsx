'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    SparklesIcon,
    PaperAirplaneIcon,
    TrashIcon,
    ArrowPathIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export function AIChatSession({ session, user }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiSettings, setAiSettings] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        loadAISettings();
        loadChatHistory();
        subscribeToMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.id]);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const loadAISettings = async () => {
        if (!supabase || !user) return;

        const { data } = await supabase
            .from('profiles')
            .select('ai_settings')
            .eq('id', user.id)
            .single();

        if (data?.ai_settings) {
            setAiSettings(data.ai_settings);
        }
    };

    const loadChatHistory = async () => {
        if (!supabase || !session.id) return;

        const { data } = await supabase
            .from('workspace_ai_messages')
            .select(`
        *,
        user:user_id (
          email,
          display_name,
          avatar_url
        )
      `)
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

        if (data) {
            setMessages(data);
        }
    };

    const subscribeToMessages = () => {
        if (!supabase || !session.id) return;

        const channel = supabase
            .channel(`workspace_ai_messages:${session.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'workspace_ai_messages',
                    filter: `session_id=eq.${session.id}`,
                },
                async (payload) => {
                    // Fetch user details if it's a user message
                    let newMessage = payload.new;
                    if (newMessage.user_id) {
                        const { data: userData } = await supabase
                            .from('auth.users') // This might not work directly due to permissions, usually we query profiles or rely on public view
                            // Actually, we should query profiles if available, or just use what we have.
                            // For now, let's just append. If we need user info, we might need to fetch it.
                            // But wait, realtime payload doesn't include joined data.
                            // We can fetch the single message with join.
                            .select('email, raw_user_meta_data') // This is restricted usually.
                        // Better to fetch from profiles table if it exists, or just fetch the message again.
                        // Let's fetch the message again to get the join.
                        return; // We'll rely on the fetch below
                    }

                    // Actually, for simplicity, let's just fetch the new message with relations
                    const { data } = await supabase
                        .from('workspace_ai_messages')
                        .select(`
              *,
              user:user_id (
                email,
                display_name,
                avatar_url
              )
            `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setMessages((prev) => {
                            if (prev.find(m => m.id === data.id)) return prev;
                            return [...prev, data];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const messageContent = input;
        setInput('');
        setLoading(true);

        try {
            // 1. Save user message
            const { data: userMsg, error: userMsgError } = await supabase
                .from('workspace_ai_messages')
                .insert({
                    session_id: session.id,
                    user_id: user.id,
                    role: 'user',
                    content: messageContent,
                })
                .select(`
          *,
          user:user_id (
            email,
            display_name,
            avatar_url
          )
        `)
                .single();

            if (userMsgError) throw userMsgError;

            // Optimistically add to UI (though realtime will also do it)
            setMessages(prev => [...prev, userMsg]);

            // 2. Prepare context for AI
            const conversationHistory = messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            // 3. Call AI API
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'user',
                            content: messageContent,
                        },
                    ],
                    conversationHistory,
                    userId: user.id, // Pass userId for API to use if auth check is skipped
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get response');
            }

            const data = await response.json();
            const assistantMessage = data.choices[0]?.message?.content || '';

            // 4. Save AI message
            const { data: aiMsg, error: aiMsgError } = await supabase
                .from('workspace_ai_messages')
                .insert({
                    session_id: session.id,
                    role: 'assistant',
                    content: assistantMessage,
                })
                .select('*')
                .single();

            if (aiMsgError) throw aiMsgError;

            // Optimistically add to UI
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error('AI Error:', error);
            toast.error(error.message || 'Failed to get response');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                        <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7]">
                            {session.name}
                        </h1>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Shared Workspace Chat
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {aiSettings?.apiKey ? (
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            Connected
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                            Not Configured
                        </Badge>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden bg-[#fafafa] dark:bg-[#191919]">
                <ScrollArea className="h-full" ref={scrollRef}>
                    <div className="p-4 min-h-full">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center pt-20">
                                <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full mb-4">
                                    <SparklesIcon className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">
                                    Start a conversation
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs mb-6">
                                    This is a shared chat space. Everyone in the workspace can see these messages.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${message.role === 'user' && message.user_id === user.id ? 'flex-row-reverse' : ''}`}
                                    >
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarFallback className={message.role === 'user' ? 'bg-gray-700 dark:bg-gray-600 text-white' : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'}>
                                                {message.role === 'user' ? (
                                                    message.user?.display_name?.[0] || message.user?.email?.[0] || 'U'
                                                ) : (
                                                    <SparklesIcon className="w-5 h-5" />
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={`flex-1 ${message.role === 'user' && message.user_id === user.id ? 'flex justify-end' : ''}`}>
                                            <div className="flex flex-col gap-1 max-w-[85%]">
                                                {message.role === 'user' && message.user_id !== user.id && (
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        {message.user?.display_name || message.user?.email || 'Unknown User'}
                                                    </span>
                                                )}
                                                <div
                                                    className={`px-3 py-2 rounded-lg ${message.role === 'user'
                                                        ? message.user_id === user.id
                                                            ? 'bg-gray-900 dark:bg-gray-700 text-white'
                                                            : 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7] border border-gray-200 dark:border-[#333]'
                                                        : 'bg-purple-50 dark:bg-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7] border border-purple-100 dark:border-purple-900/30'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">
                                                        {message.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                                                <SparklesIcon className="w-5 h-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="inline-block px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#2a2a2a]">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1e1e1e]">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder={aiSettings?.apiKey ? "Type a message..." : "Configure API key in Settings first"}
                        disabled={loading || !aiSettings?.apiKey}
                        className="flex-1 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] focus:border-transparent focus:ring-0 focus:outline-none relative focus:before:content-[''] focus:before:absolute focus:before:inset-0 focus:before:rounded-md focus:before:p-[1px] focus:before:bg-gradient-to-r focus:before:from-red-400 focus:before:via-yellow-400 focus:before:via-green-400 focus:before:via-blue-400 focus:before:via-indigo-400 focus:before:to-purple-400 focus:before:animate-pulse focus:before:-z-10 focus:before:opacity-30"
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || loading || !aiSettings?.apiKey}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
