'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/context/ThemeContext';
import { AIChatView } from '@/components/ai/AIChatView';
import {
  SparklesIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function AIChatPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
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
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <ThemeProvider>
        <div className="flex h-screen items-center justify-center bg-[#f8f9fa] dark:bg-[#1c1c1c]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 dark:border-purple-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">Loading AI Chat...</h3>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-[#f8f9fa] dark:bg-[#1c1c1c]">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:w-64 bg-white dark:bg-[#181818] border-r border-gray-200 dark:border-[#2a2a2a] flex-col">
          <div className="px-3 py-2.5 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Prodigy</span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              <HomeIcon className="w-5 h-5" />
              Home
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-[#e7e7e7] bg-gray-100 dark:bg-[#2a2a2a] rounded-lg">
              <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              AI Chat
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#181818] border-b border-gray-200 dark:border-[#2a2a2a]">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              <HomeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] truncate flex-1 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              AI Chat
            </h1>
          </div>

          {/* Chat View */}
          {user && <AIChatView userId={user.id} />}
        </div>
      </div>
    </ThemeProvider>
  );
}
