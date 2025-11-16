'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/workspace/Sidebar';
import MobileSidebar from '@/components/workspace/MobileSidebar';
import EditorTabs from '@/components/workspace/EditorTabs';
import UserMenu from '@/components/workspace/UserMenu';
import { useWorkspace } from '@/hooks/useWorkspace';
import { ThemeProvider } from '@/context/ThemeContext';
import { Bars3Icon, UserGroupIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { PeoplePanel } from '@/components/workspace/PeoplePanel';
import { CommandPalette } from '@/components/CommandPalette';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id;
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [peoplePanelOpen, setPeoplePanelOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const {
    workspace,
    folders,
    snippets,
    openTabs,
    activeTabId,
    createFolder,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    deleteFolder,
    openSnippet,
    closeTab,
    setActiveTab,
    reorderTabs,
    reorderSnippets,
    moveSnippetToFolder,
    createFinalVersion,
    loading
  } = useWorkspace(workspaceId);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
    };
    
    checkAuth();
  }, [router]);

  if (loading || !user) {
    return (
      <ThemeProvider>
        <div className="flex h-screen bg-[#fafafa] dark:bg-[#191919]">
          {/* Sidebar Skeleton */}
          <div className="w-64 bg-white dark:bg-[#181818] border-r border-gray-200 dark:border-[#2a2a2a] p-4">
            <div className="space-y-4">
              {/* Header Skeleton */}
              <div className="h-8 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg w-3/4 animate-pulse"></div>
              
              {/* Action Buttons Skeleton */}
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg animate-pulse"></div>
              </div>
              
              {/* Snippets List Skeleton */}
              <div className="space-y-2 mt-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Main Content Skeleton */}
          <div className="flex-1 flex flex-col bg-white dark:bg-[#212121]">
            {/* Tabs Skeleton */}
            <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-2 flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-32 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse"></div>
              ))}
            </div>
            
            {/* Editor Skeleton */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">Loading workspace...</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Preparing your writing environment</p>
              </div>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-[#fafafa] dark:bg-[#191919] overflow-hidden">
        {/* Command Palette */}
        <CommandPalette workspaces={[workspace]} currentWorkspaceId={workspaceId} />
        
        {/* Chat Drawer */}
        {user && <ChatDrawer userId={user.id} />}

        {/* Mobile sidebar */}
        <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
          <Sidebar
            workspace={workspace}
            folders={folders}
            snippets={snippets}
            openTabs={openTabs}
            activeTabId={activeTabId}
            onCreateFolder={createFolder}
            onCreateSnippet={createSnippet}
            onOpenSnippet={openSnippet}
            onDeleteSnippet={deleteSnippet}
            onDeleteFolder={deleteFolder}
            onReorderSnippets={reorderSnippets}
            onMoveSnippetToFolder={moveSnippetToFolder}
          />
        </MobileSidebar>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <Sidebar
            workspace={workspace}
            folders={folders}
            snippets={snippets}
            openTabs={openTabs}
            activeTabId={activeTabId}
            onCreateFolder={createFolder}
            onCreateSnippet={createSnippet}
            onOpenSnippet={openSnippet}
            onDeleteSnippet={deleteSnippet}
            onDeleteFolder={deleteFolder}
            onReorderSnippets={reorderSnippets}
            onMoveSnippetToFolder={moveSnippetToFolder}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header with menu button */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#181818] border-b border-gray-200 dark:border-[#2a2a2a]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] truncate flex-1">
              {workspace?.name || 'Workspace'}
            </h1>
            <NotificationCenter userId={user?.id} />
            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              title="AI Assistant"
            >
              <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </button>
            <button
              onClick={() => setPeoplePanelOpen(!peoplePanelOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              title="People"
            >
              <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <EditorTabs
            tabs={openTabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTab}
            onCloseTab={closeTab}
            onUpdateSnippet={updateSnippet}
            onCreateFinalVersion={createFinalVersion}
            snippets={snippets}
            onOpenSnippet={openSnippet}
            onReorderTabs={reorderTabs}
            user={user}
          />
        </div>
        
        {/* Desktop user menu */}
        <div className="hidden lg:block">
          <UserMenu user={user} onSettingsClick={() => {}} />
        </div>

        {/* AI Assistant Panel - Desktop */}
        <div className={`hidden lg:block transition-all duration-300 ${aiPanelOpen ? 'w-80' : 'w-0'}`}>
          {aiPanelOpen && user && (
            <AIAssistantPanel workspaceId={workspaceId} currentUserId={user.id} />
          )}
        </div>

        {/* People Panel - Desktop */}
        <div className={`hidden lg:block transition-all duration-300 ${peoplePanelOpen ? 'w-80' : 'w-0'}`}>
          {peoplePanelOpen && user && (
            <PeoplePanel workspaceId={workspaceId} currentUserId={user.id} />
          )}
        </div>

        {/* Panel Toggle Buttons - Desktop */}
        <div className="hidden lg:flex flex-col items-start pt-4 pr-2 gap-2">
          <button
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
            title={aiPanelOpen ? 'Hide AI assistant' : 'Show AI assistant'}
          >
            {aiPanelOpen ? (
              <XMarkIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            ) : (
              <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            )}
          </button>
          <button
            onClick={() => setPeoplePanelOpen(!peoplePanelOpen)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
            title={peoplePanelOpen ? 'Hide people panel' : 'Show people panel'}
          >
            {peoplePanelOpen ? (
              <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* AI Assistant Panel - Mobile (Full Screen Overlay) */}
        {aiPanelOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-[#181818]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">AI Assistant</h2>
              <button
                onClick={() => setAiPanelOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            {user && <AIAssistantPanel workspaceId={workspaceId} currentUserId={user.id} />}
          </div>
        )}

        {/* People Panel - Mobile (Full Screen Overlay) */}
        {peoplePanelOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-[#181818]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">People</h2>
              <button
                onClick={() => setPeoplePanelOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            {user && <PeoplePanel workspaceId={workspaceId} currentUserId={user.id} />}
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
