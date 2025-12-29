'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '@/context/ThemeContext';
import ProfileSettings from './ProfileSettings';
import PreferencesSettings from './PreferencesSettings';
import AISettings from './AISettings';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';
import { UserIcon, Cog6ToothIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function SettingsDialog({ isOpen, onClose, user }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  const getInitials = (displayName, fullName, email) => {
    const name = displayName || fullName || email || '';
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon, component: ProfileSettings },
    { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon, component: PreferencesSettings },
    { id: 'ai', label: 'AI Assistant', icon: SparklesIcon, component: AISettings },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || ProfileSettings;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false} 
        className="!max-w-5xl w-full h-[100dvh] lg:h-[85vh] p-0 gap-0 bg-white dark:bg-[#121212] border-0 lg:border border-gray-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col lg:flex-row shadow-2xl rounded-none lg:rounded-2xl outline-none"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>

        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-gray-50/50 dark:bg-[#181818] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col shrink-0">
          {/* Header - Fixed */}
          <div className="p-4 lg:p-6 lg:pb-4 flex items-center justify-between lg:block shrink-0">
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 lg:mt-1 hidden sm:block">Manage your workspace</p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label="Close settings"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex lg:flex-col px-2 lg:px-3 gap-1 lg:gap-0 lg:space-y-1 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto py-2 shrink-0 lg:flex-1 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap flex items-center gap-2 lg:gap-3 px-3 lg:px-3 py-2 lg:py-2.5 text-xs lg:text-sm font-medium rounded-lg transition-all duration-200 flex-shrink-0",
                  activeTab === tab.id
                    ? "bg-white dark:bg-[#2a2a2a] text-black dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-[#333]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#212121] hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <tab.icon className={cn("w-4 h-4 lg:w-5 lg:h-5", activeTab === tab.id ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-500")} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* User Info - Desktop only */}
          <div className="hidden lg:block p-4 border-t border-gray-200 dark:border-[#2a2a2a] shrink-0">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-[#2a2a2a] shrink-0">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold text-center flex items-center justify-center">
                    {getInitials(user?.user_metadata?.display_name, user?.user_metadata?.full_name, user?.email)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.user_metadata?.display_name || user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#121212] overflow-hidden">
          {/* Content Header - Fixed */}
          <div className="h-12 lg:h-16 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between px-4 lg:px-8 shrink-0">
            <div className="min-w-0 flex-1">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
              aria-label="Close settings"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-2xl mx-auto">
                <ActiveComponent user={user} userId={user?.id} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
