'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/context/ThemeContext';
import { AIChatView } from '@/components/ai/AIChatView';
import AppLayout from '@/components/layout/AppLayout';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function AIChatPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

  // AI Chat State
  const [messages, setMessages] = useState([]);
  const [aiSettings, setAiSettings] = useState(null);
  const [chatLoading, setChatLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, display_name, ai_settings')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        if (profile.ai_settings) setAiSettings(profile.ai_settings);
      }

      setAppLoading(false);

      // Load History
      if (session?.user?.id) {
        const { data } = await supabase
          .from('ai_chat_history')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true })
          .limit(50);
        if (data) setMessages(data);
        setChatLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history?')) return;

    await supabase
      .from('ai_chat_history')
      .delete()
      .eq('user_id', user.id);

    setMessages([]);
    toast.success('Chat history cleared');
  };

  const actions = (
    <div className="flex items-center gap-2">
      {aiSettings?.apiKey ? (
        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0">
          Connected
        </Badge>
      ) : (
        <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-0">
          Not Configured
        </Badge>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearHistory}
        disabled={messages.length === 0}
        className="text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <TrashIcon className="w-4 h-4 mr-1" />
        Clear
      </Button>
    </div>
  );

  return (
    <ThemeProvider>
      <AppLayout
        title="AI Chat"
        description="Chat with your intelligent assistant"
        user={user}
        userProfile={userProfile}
        actions={actions}
      >
        {appLoading || chatLoading ? (
          <div className="flex flex-col h-full animate-pulse">
            <div className="flex-1 p-6 space-y-6">
              <div className="flex gap-4 flex-row-reverse">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="h-12 w-64 rounded-lg bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="h-24 w-96 rounded-lg bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </div>
        ) : (
          <AIChatView
            userId={user?.id}
            messages={messages}
            setMessages={setMessages}
            aiSettings={aiSettings}
            userProfile={userProfile}
          />
        )}
      </AppLayout>
    </ThemeProvider>
  );
}
