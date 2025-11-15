'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { SparklesIcon, FolderIcon, DocumentTextIcon, UsersIcon, BoltIcon, CheckCircleIcon, ArrowRightIcon, MoonIcon, SunIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

function LandingContent() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    
    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] overflow-hidden">
      <div>
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <span className="text-xl font-bold">Novel Snippets</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <SunIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-[#e7e7e7] hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative z-10 px-6 pt-20 pb-32 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-full text-sm font-medium text-blue-700 dark:text-blue-400 mb-8 animate-fade-in">
              <SparklesIcon className="w-4 h-4" />
              Your creative writing companion
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-[#e7e7e7] dark:via-white dark:to-[#e7e7e7] bg-clip-text text-transparent animate-fade-in-up">
              Write, Organize,
              <br />
              Create Masterpieces
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in-up delay-100">
              The modern workspace for novelists. Organize your ideas, manage drafts, and collaborate seamlessly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-200">
              <button
                onClick={() => router.push('/login')}
                className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center gap-2"
              >
                Get Started Free
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-gray-100 dark:bg-[#212121] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7] rounded-xl font-semibold transition-all hover:scale-105"
              >
                Learn More
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                Free forever
              </div>
            </div>
          </div>

          {/* Floating Cards Preview */}
          <div className="mt-20 relative h-96 animate-fade-in-up delay-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl">
              <div className="relative">
                {/* Main card */}
                <div className="bg-white dark:bg-[#212121] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] p-8 animate-float">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-5/6"></div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-8 -left-8 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-float delay-100">
                  Auto-save ✓
                </div>
                <div className="absolute -bottom-8 -right-8 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-float delay-200">
                  Multi-tab editing
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative z-10 px-6 py-32 bg-gray-50 dark:bg-[#212121]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need to write</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">Powerful features designed for creative writers</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<FolderIcon className="w-8 h-8" />}
                title="Organized Workspaces"
                description="Create separate workspaces for each project. Organize novels, short stories, and ideas with folders and snippets."
                color="blue"
              />
              <FeatureCard
                icon={<DocumentTextIcon className="w-8 h-8" />}
                title="Multi-Tab Editor"
                description="Work on multiple snippets at once with VS Code-style tabs. Switch between chapters and scenes seamlessly."
                color="purple"
              />
              <FeatureCard
                icon={<UsersIcon className="w-8 h-8" />}
                title="Real-Time Collaboration"
                description="Share workspaces with co-authors and editors. Assign roles and collaborate in real-time on your stories."
                color="green"
              />
              <FeatureCard
                icon={<BoltIcon className="w-8 h-8" />}
                title="Auto-Save & Sync"
                description="Never lose your work. Changes are automatically saved every second and synced across all your devices."
                color="yellow"
              />
              <FeatureCard
                icon={<CheckCircleIcon className="w-8 h-8" />}
                title="Draft Management"
                description="Create finalized versions of your drafts. Mark snippets as final and track your progress effortlessly."
                color="indigo"
              />
              <FeatureCard
                icon={<ShieldCheckIcon className="w-8 h-8" />}
                title="Secure & Private"
                description="Your work is encrypted and secure. Control who can view and edit your content with granular permissions."
                color="pink"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 px-6 py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to start writing?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
              Join thousands of writers who trust Novel Snippets for their creative work.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="group px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 inline-flex items-center gap-2"
            >
              Get Started Now
              <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 px-6 py-8 border-t border-gray-200 dark:border-[#2a2a2a]">
          <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-500 text-sm">
            <p>© 2024 Novel Snippets. Built for writers, by writers.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    pink: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  };

  return (
    <div className="group bg-white dark:bg-[#191919] p-8 rounded-2xl border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-all hover:shadow-xl hover:-translate-y-1">
      <div className={`inline-flex p-3 rounded-xl mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <ThemeProvider>
      <LandingContent />
    </ThemeProvider>
  );
}
