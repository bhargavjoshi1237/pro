'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '@/context/ThemeContext';
import ProfileSettings from './ProfileSettings';
import PreferencesSettings from './PreferencesSettings';
import AISettings from './AISettings';
import { useState } from 'react';
import { UserIcon, Cog6ToothIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function SettingsDialog({ isOpen, onClose, user }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon, component: ProfileSettings },
    { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon, component: PreferencesSettings },
    { id: 'ai', label: 'AI Assistant', icon: SparklesIcon, component: AISettings },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || ProfileSettings;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="!max-w-5xl w-full h-full lg:w-[90vw] lg:h-[80vh] p-0 gap-0 bg-white dark:bg-[#121212] border-gray-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col lg:flex-row shadow-2xl rounded-none lg:rounded-2xl outline-none">
        <DialogTitle className="sr-only">Settings</DialogTitle>

        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-gray-50/50 dark:bg-[#181818] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col shrink-0">
          <div className="p-4 lg:p-6 lg:pb-4 flex items-center justify-between lg:block">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Settings</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage your workspace</p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex lg:flex-col px-3 gap-2 lg:gap-0 lg:space-y-1 overflow-x-auto lg:overflow-y-auto py-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex-shrink-0",
                  activeTab === tab.id
                    ? "bg-white dark:bg-[#2a2a2a] text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-200 dark:ring-[#333]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#212121] hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:block p-4 border-t border-gray-200 dark:border-[#2a2a2a]">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.user_metadata?.full_name || 'First Name'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#121212]">
          <div className="h-14 lg:h-16 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between px-4 lg:px-8 shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="hidden lg:block p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <ActiveComponent user={user} userId={user?.id} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
