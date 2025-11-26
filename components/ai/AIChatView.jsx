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
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export function AIChatView({ userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSettings, setAiSettings] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadAISettings();
    loadChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
    if (!supabase || !userId) return;

    const { data } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', userId)
      .single();

    if (data?.ai_settings) {
      setAiSettings(data.ai_settings);
    }
  };

  const loadChatHistory = async () => {
    if (!supabase || !userId) return;

    const { data } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      setMessages(data);
    }
  };



  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    const messageContent = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Save user message
    await supabase
      .from('ai_chat_history')
      .insert({
        user_id: userId,
        role: 'user',
        content: messageContent,
      });

    try {
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call our secure API route instead of directly calling the AI provider
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
          userId, // Pass userId for API to use if auth check is skipped
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || '';

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantMessage,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message
      await supabase
        .from('ai_chat_history')
        .insert({
          user_id: userId,
          role: 'assistant',
          content: assistantMessage,
        });

    } catch (error) {
      console.error('AI Error:', error);
      toast.error(error.message || 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history?')) return;

    await supabase
      .from('ai_chat_history')
      .delete()
      .eq('user_id', userId);

    setMessages([]);
    toast.success('Chat history cleared');
  };

  const regenerateLastResponse = async () => {
    if (messages.length < 2) return;

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove last AI response
    const newMessages = messages.filter(m =>
      !(m.role === 'assistant' && new Date(m.created_at) > new Date(lastUserMessage.created_at))
    );
    setMessages(newMessages);

    // Delete from database
    await supabase
      .from('ai_chat_history')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'assistant')
      .gt('created_at', lastUserMessage.created_at);

    // Resend
    setInput(lastUserMessage.content);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#181818]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-[#e7e7e7]">
              AI Writing Assistant
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Chat with AI about your writing
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
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            disabled={messages.length === 0}
            className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-6 min-h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full mb-4">
                  <SparklesIcon className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
                  Ask me anything about writing, storytelling, character development, or get feedback on your work.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-3 px-4 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    onClick={() => setInput('Help me develop a compelling protagonist for my novel')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7]">Character Development</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Create compelling characters</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-3 px-4 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    onClick={() => setInput('What are some techniques to build tension in a thriller?')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7]">Plot Structure</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Learn storytelling techniques</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-3 px-4 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    onClick={() => setInput('Review this paragraph and suggest improvements')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7]">Get Feedback</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Improve your writing</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-3 px-4 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    onClick={() => setInput('Help me overcome writer&apos;s block')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7]">Writer&apos;s Block</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Get unstuck and inspired</div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className={message.role === 'user' ? 'bg-gray-700 dark:bg-gray-600 text-white' : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'}>
                        {message.role === 'user' ? 'U' : <SparklesIcon className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div
                        className={`inline-block max-w-[85%] px-4 py-3 rounded-lg ${message.role === 'user'
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7]'
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
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
                      <div className="inline-block px-4 py-3 rounded-lg bg-gray-100 dark:bg-[#2a2a2a]">
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
      <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#181818]">
        <div className="flex gap-3 max-w-4xl mx-auto">
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={regenerateLastResponse}
              disabled={loading || messages.length < 2}
              title="Regenerate last response"
              className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </Button>
          )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={aiSettings?.apiKey ? "Ask me anything about writing..." : "Configure API key in Settings first"}
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
