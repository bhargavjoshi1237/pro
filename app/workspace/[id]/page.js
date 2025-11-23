'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/workspace/Sidebar';
import MobileSidebar from '@/components/workspace/MobileSidebar';
import EditorTabs from '@/components/workspace/EditorTabs';
import UserMenu from '@/components/workspace/UserMenu';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useEntities } from '@/hooks/useEntities';
import { ThemeProvider } from '@/context/ThemeContext';
import { Bars3Icon, UserGroupIcon, XMarkIcon, SparklesIcon, ChatBubbleLeftRightIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import { PeoplePanel } from '@/components/workspace/PeoplePanel';
import CommandPalette from '@/components/CommandPalette';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { WorkspaceChatPanel } from '@/components/workspace/WorkspaceChatPanel';
import { KanbanPanel } from '@/components/kanban/KanbanPanel';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import SettingsDialog from '@/components/settings/SettingsDialog';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id;

  // State declarations
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [peoplePanelOpen, setPeoplePanelOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [workspaceChatOpen, setWorkspaceChatOpen] = useState(false);
  const [kanbanPanelOpen, setKanbanPanelOpen] = useState(false);
  const [activeView, setActiveView] = useState('editor'); // 'editor' | 'kanban'
  const [activeBoard, setActiveBoard] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    workspace,
    folders,
    snippets,
    aiSessions,
    openTabs,
    activeTabId,
    createFolder,
    createSnippet,
    createAISession,
    updateSnippet,
    deleteSnippet,
    deleteFolder,
    deleteAISession,
    openSnippet,
    openChat,
    closeTab,
    setActiveTab,
    reorderTabs,
    reorderSnippets,
    moveSnippetToFolder,
    createFinalVersion,
    loading
  } = useWorkspace(workspaceId);

  const {
    entities,
    tags,
    createEntity,
    deleteEntity,
    createTag,
    deleteTag
  } = useEntities(workspaceId);

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

  // Close other panels when one is opened
  const togglePanel = (panel) => {
    if (panel === 'ai') {
      setAiPanelOpen(!aiPanelOpen);
      if (!aiPanelOpen) {
        setPeoplePanelOpen(false);
        setWorkspaceChatOpen(false);
      }
    } else if (panel === 'people') {
      setPeoplePanelOpen(!peoplePanelOpen);
      if (!peoplePanelOpen) {
        setAiPanelOpen(false);
        setWorkspaceChatOpen(false);
      }
    } else if (panel === 'chat') {
      setWorkspaceChatOpen(!workspaceChatOpen);
      if (!workspaceChatOpen) {
        setAiPanelOpen(false);
        setPeoplePanelOpen(false);
        setKanbanPanelOpen(false);
      }
    } else if (panel === 'kanban') {
      setKanbanPanelOpen(!kanbanPanelOpen);
      if (!kanbanPanelOpen) {
        setAiPanelOpen(false);
        setPeoplePanelOpen(false);
        setWorkspaceChatOpen(false);
      }
    }
  };

  const isRightPanelOpen = aiPanelOpen || workspaceChatOpen || peoplePanelOpen || kanbanPanelOpen;

  const handleOpenKanban = (board) => {
    setActiveBoard(board);
    setActiveView('kanban');
  };

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
        <CommandPalette
          isOpen={commandPaletteOpen}
          setIsOpen={setCommandPaletteOpen}
          snippets={snippets}
          folders={folders}
          entities={entities}
          tags={tags}
          onOpenSnippet={openSnippet}
        />

        {/* Chat Drawer */}
        {user && <ChatDrawer userId={user.id} />}



        {/* Mobile sidebar */}
        <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
          <Sidebar
            workspace={workspace}
            folders={folders}
            snippets={snippets}
            entities={entities}
            tags={tags}
            openTabs={openTabs}
            activeTabId={activeTabId}
            onCreateFolder={createFolder}
            onCreateSnippet={createSnippet}
            onCreateEntity={createEntity}
            onCreateTag={createTag}
            onOpenSnippet={openSnippet}
            onDeleteSnippet={deleteSnippet}
            onDeleteFolder={deleteFolder}
            onDeleteEntity={deleteEntity}
            onDeleteTag={deleteTag}
            onReorderSnippets={reorderSnippets}
            onMoveSnippetToFolder={moveSnippetToFolder}
            onOpenKanban={handleOpenKanban}
          />
        </MobileSidebar>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <Sidebar
            workspace={workspace}
            folders={folders}
            snippets={snippets}
            entities={entities}
            tags={tags}
            openTabs={openTabs}
            activeTabId={activeTabId}
            onCreateFolder={createFolder}
            onCreateSnippet={createSnippet}
            onCreateEntity={createEntity}
            onCreateTag={createTag}
            onOpenSnippet={openSnippet}
            onDeleteSnippet={deleteSnippet}
            onDeleteFolder={deleteFolder}
            onDeleteEntity={deleteEntity}
            onDeleteTag={deleteTag}
            onReorderSnippets={reorderSnippets}
            onMoveSnippetToFolder={moveSnippetToFolder}
            onOpenKanban={handleOpenKanban}
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
              onClick={() => togglePanel('ai')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              title="AI Assistant"
            >
              <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </button>
            <button
              onClick={() => togglePanel('chat')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              title="Workspace Chat"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={() => togglePanel('people')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              title="People"
            >
              <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">
            <ResizablePanel defaultSize={isRightPanelOpen ? 75 : 100} minSize={30}>
              <div className="h-full overflow-hidden">
                {activeView === 'kanban' && activeBoard ? (
                  <KanbanBoard
                    board={activeBoard}
                    workspaceId={workspaceId}
                    onClose={() => setActiveView('editor')}
                  />
                ) : (
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
                    entities={entities}
                    tags={tags}
                  />
                )}
              </div>
            </ResizablePanel>

            {isRightPanelOpen && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={25} minSize={15} maxSize={40} className="bg-white dark:bg-[#181818] border-l border-gray-200 dark:border-[#2a2a2a]">
                  {aiPanelOpen && user && <AIAssistantPanel workspaceId={workspaceId} currentUserId={user.id} />}
                  {workspaceChatOpen && user && <WorkspaceChatPanel workspaceId={workspaceId} currentUserId={user.id} />}
                  {peoplePanelOpen && user && <PeoplePanel workspaceId={workspaceId} currentUserId={user.id} />}
                  {kanbanPanelOpen && user && <KanbanPanel workspaceId={workspaceId} onOpenBoard={handleOpenKanban} />}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        {/* Desktop user menu */}
        <div className="hidden lg:block">
          <UserMenu user={user} onSettingsClick={() => setSettingsOpen(true)} />
        </div>



        {/* Panel Toggle Buttons - Desktop */}
        <div className="hidden lg:flex flex-col items-start pt-4 pl-2 pr-2 gap-2">
          <button
            onClick={() => togglePanel('ai')}
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
            onClick={() => togglePanel('chat')}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
            title={workspaceChatOpen ? 'Hide Workspace Chat' : 'Show Workspace Chat'}
          >
            {workspaceChatOpen ? (
              <XMarkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </button>
          <button
            onClick={() => togglePanel('people')}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
            title={peoplePanelOpen ? 'Hide people panel' : 'Show people panel'}
          >
            {peoplePanelOpen ? (
              <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <button
            onClick={() => togglePanel('kanban')}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
            title={kanbanPanelOpen ? 'Hide Kanban' : 'Show Kanban'}
          >
            {kanbanPanelOpen ? (
              <XMarkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <ViewColumnsIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="h-[calc(100vh-60px)]">
              {user && <AIAssistantPanel workspaceId={workspaceId} currentUserId={user.id} />}
            </div>
          </div>
        )}

        {/* Workspace Chat Panel - Mobile (Full Screen Overlay) */}
        {workspaceChatOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-[#181818]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Workspace Chat</h2>
              <button
                onClick={() => setWorkspaceChatOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="h-[calc(100vh-60px)]">
              {user && <WorkspaceChatPanel workspaceId={workspaceId} currentUserId={user.id} />}
            </div>
          </div>
        )}

        {/* People Panel - Mobile (Full Screen Overlay) */}
        {peoplePanelOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-[#181818]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">People</h2>
              <button
                onClick={() => setPeoplePanelOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="h-[calc(100vh-60px)]">
              {user && <PeoplePanel workspaceId={workspaceId} currentUserId={user.id} />}
            </div>
          </div>
        )}

        {/* Kanban Panel - Mobile (Full Screen Overlay) */}
        {kanbanPanelOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-[#181818]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Projects</h2>
              <button
                onClick={() => setKanbanPanelOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="h-[calc(100vh-60px)]">
              {user && <KanbanPanel workspaceId={workspaceId} onOpenBoard={handleOpenKanban} />}
            </div>
          </div>
        )}
        {/* Settings Dialog */}
        {user && (
          <SettingsDialog
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            user={user}
          />
        )}
      </div>
    </ThemeProvider >
  );
}
