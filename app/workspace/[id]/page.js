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
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id;
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="flex h-screen bg-white dark:bg-[#191919]">
          <div className="w-64 bg-[#fafafa] dark:bg-[#191919] border-r border-gray-200 dark:border-[#2a2a2a] p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-[#2a2a2a] rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 dark:bg-[#2a2a2a] rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-[#2a2a2a] rounded"></div>
              </div>
              <div className="space-y-2 mt-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-[#2a2a2a] rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#212121]">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4">
                <svg className="animate-spin text-blue-600 dark:text-blue-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Loading workspace...</p>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-[#fafafa] dark:bg-[#191919] overflow-hidden">
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
      </div>
    </ThemeProvider>
  );
}
