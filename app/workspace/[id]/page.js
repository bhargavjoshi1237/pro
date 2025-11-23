'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/workspace/Sidebar';
import EditorTabs from '@/components/workspace/EditorTabs';
import UserMenu from '@/components/workspace/UserMenu';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useEntities } from '@/hooks/useEntities';
import { ThemeProvider } from '@/context/ThemeContext';
import { PeoplePanel } from '@/components/workspace/PeoplePanel';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { WorkspaceChatPanel } from '@/components/workspace/WorkspaceChatPanel';
import { KanbanPanel } from '@/components/kanban/KanbanPanel';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import StoragePanel from '@/components/workspace/StoragePanel';
import SettingsDialog from '@/components/settings/SettingsDialog';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { UserGroupIcon, XMarkIcon, SparklesIcon, ChatBubbleLeftRightIcon, ViewColumnsIcon, FolderIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id;
  const sidebarRef = useRef(null);

  // State declarations
  const [user, setUser] = useState(null);
  const [peoplePanelOpen, setPeoplePanelOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [workspaceChatOpen, setWorkspaceChatOpen] = useState(false);
  const [kanbanPanelOpen, setKanbanPanelOpen] = useState(false);
  const [storagePanelOpen, setStoragePanelOpen] = useState(false);
  const [activeView, setActiveView] = useState('editor'); // 'editor' | 'kanban'
  const [activeBoard, setActiveBoard] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    const panel = sidebarRef.current;
    if (panel) {
      if (isSidebarCollapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const handleOpenKanban = (board) => {
    setActiveBoard(board);
    setActiveView('kanban');
    setKanbanPanelOpen(false); // Close the panel on mobile/desktop when opening board
  };

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
        setStoragePanelOpen(false);
      }
    } else if (panel === 'storage') {
      setStoragePanelOpen(!storagePanelOpen);
      if (!storagePanelOpen) {
        setAiPanelOpen(false);
        setPeoplePanelOpen(false);
        setWorkspaceChatOpen(false);
        setKanbanPanelOpen(false);
      }
    }
  };

  const isRightPanelOpen = aiPanelOpen || workspaceChatOpen || peoplePanelOpen || kanbanPanelOpen || storagePanelOpen;

  return (
    <div className="flex h-screen bg-white dark:bg-[#191919] overflow-hidden">
      {/* Desktop Resizable Layout */}
      <div className="hidden lg:flex flex-1 min-w-0 h-full">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel
            ref={sidebarRef}
            defaultSize={20}
            minSize={15}
            maxSize={30}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setIsSidebarCollapsed(true)}
            onExpand={() => setIsSidebarCollapsed(false)}
            className="border-r border-gray-200 dark:border-[#2a2a2a]"
          >
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
              onToggleSidebar={toggleSidebar}
            />
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={80}>
            <div className="flex flex-col h-full min-w-0 relative">
              {isSidebarCollapsed && (
                <button
                  onClick={toggleSidebar}
                  className="absolute top-3 left-3 z-50 p-1.5 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Expand Sidebar"
                >
                  <ChevronDoubleRightIcon className="w-4 h-4" />
                </button>
              )}
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
                      {storagePanelOpen && <StoragePanel workspaceId={workspaceId} />}
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
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
        <button
          onClick={() => togglePanel('storage')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
          title={storagePanelOpen ? 'Hide Files' : 'Show Files'}
        >
          {storagePanelOpen ? (
            <XMarkIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          ) : (
            <FolderIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
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

      {/* Storage Panel - Mobile (Full Screen Overlay) */}
      {storagePanelOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-[#181818]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Files</h2>
            <button
              onClick={() => setStoragePanelOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="h-[calc(100vh-60px)]">
            <StoragePanel workspaceId={workspaceId} />
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
  );
}
