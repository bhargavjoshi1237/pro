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

export function AIChatView({ userId, messages, setMessages, aiSettings }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

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

      // Call our secure API route
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
          userId,
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
    <div className="flex flex-col h-full bg-transparent">
      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-6 min-h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full mb-4">
                  <SparklesIcon className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                  AI Writing Assistant
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-8">
                  Your creative partner for storytelling, character development, and refining your prose.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-4 px-5 bg-white/50 dark:bg-[#1c1c1c]/50 backdrop-blur-sm text-gray-900 dark:text-[#e7e7e7] border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-purple-200 dark:hover:border-purple-900 transition-all group"
                    onClick={() => setInput('Help me develop a compelling protagonist for my novel')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Character Development</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Create compelling characters</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-4 px-5 bg-white/50 dark:bg-[#1c1c1c]/50 backdrop-blur-sm text-gray-900 dark:text-[#e7e7e7] border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-purple-200 dark:hover:border-purple-900 transition-all group"
                    onClick={() => setInput('What are some techniques to build tension in a thriller?')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Plot Structure</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Learn storytelling techniques</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-4 px-5 bg-white/50 dark:bg-[#1c1c1c]/50 backdrop-blur-sm text-gray-900 dark:text-[#e7e7e7] border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-purple-200 dark:hover:border-purple-900 transition-all group"
                    onClick={() => setInput('Review this paragraph and suggest improvements')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Get Feedback</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Improve your writing</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-4 px-5 bg-white/50 dark:bg-[#1c1c1c]/50 backdrop-blur-sm text-gray-900 dark:text-[#e7e7e7] border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-purple-200 dark:hover:border-purple-900 transition-all group"
                    onClick={() => setInput('Help me overcome writer&apos;s block')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Writer&apos;s Block</div>
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
                          : 'bg-white/80 dark:bg-[#2a2a2a]/80 backdrop-blur-sm text-gray-900 dark:text-[#e7e7e7] border border-gray-200 dark:border-[#333]'
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
                      <div className="inline-block px-4 py-3 rounded-lg bg-white/80 dark:bg-[#2a2a2a]/80 backdrop-blur-sm border border-gray-200 dark:border-[#333]">
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
      <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a]  ">
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
