'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/workspace/Sidebar';
import EditorTabs from '@/components/workspace/EditorTabs';
import UserMenu from '@/components/workspace/UserMenu';
import MobileUserMenu from '@/components/workspace/MobileUserMenu';
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
import { UserGroupIcon, XMarkIcon, SparklesIcon, ChatBubbleLeftRightIcon, ViewColumnsIcon, FolderIcon, ChevronDoubleRightIcon, ChevronDoubleLeftIcon, PresentationChartBarIcon, Square2StackIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline';
import WhiteboardPanel from '@/components/whiteboard/WhiteboardPanel';
import { SharedBoardsPanel } from '@/components/whiteboard/SharedBoardsPanel';
import { NotesPanel } from '@/components/notes/NotesPanel';
import NotesBoard from '@/components/notes/NotesBoard';
import { WorkspaceLoading } from '@/components/LoadingSpinner';

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
  const [sharedBoardsPanelOpen, setSharedBoardsPanelOpen] = useState(false);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);

  const [activeView, setActiveView] = useState('editor'); // 'editor' | 'kanban' | 'whiteboard' | 'notes'
  const [activeBoard, setActiveBoard] = useState(null);
  const [activeWhiteboardId, setActiveWhiteboardId] = useState(null);
  const [activeNotesBoardId, setActiveNotesBoardId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showMobileUI, setShowMobileUI] = useState(true); // Toggle header/footer visibility

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
    setKanbanPanelOpen(false);
  };

  const handleOpenWhiteboard = (boardId) => {
    setActiveWhiteboardId(boardId);
    setActiveView('whiteboard');
    setSharedBoardsPanelOpen(false); // Optional: keep open or close? Usually close on mobile, maybe keep on desktop. Let's close for focus.
    if (window.innerWidth < 1024) {
      setSharedBoardsPanelOpen(false);
    }
  };

  const handleOpenNotesBoard = (boardId) => {
    setActiveNotesBoardId(boardId);
    setActiveView('notes');
    setNotesPanelOpen(false);
    if (window.innerWidth < 1024) {
      setNotesPanelOpen(false);
    }
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
        setKanbanPanelOpen(false);
        setStoragePanelOpen(false);
        setSharedBoardsPanelOpen(false);
        setNotesPanelOpen(false);
      }
    } else if (panel === 'people') {
      setPeoplePanelOpen(!peoplePanelOpen);
      if (!peoplePanelOpen) {
        setAiPanelOpen(false);
        setWorkspaceChatOpen(false);
        setKanbanPanelOpen(false);
        setStoragePanelOpen(false);
        setSharedBoardsPanelOpen(false);
        setNotesPanelOpen(false);
      }
    } else if (panel === 'chat') {
      setWorkspaceChatOpen(!workspaceChatOpen);
      if (!workspaceChatOpen) {
        setAiPanelOpen(false);
        setPeoplePanelOpen(false);
        setKanbanPanelOpen(false);
        setStoragePanelOpen(false);
        setSharedBoardsPanelOpen(false);
        setNotesPanelOpen(false);
      }
    } else if (panel === 'kanban') {
      setKanbanPanelOpen(!kanbanPanelOpen);
      if (!kanbanPanelOpen) {
        setAiPanelOpen(false);
        setPeoplePanelOpen(false);
        setWorkspaceChatOpen(false);
        setStoragePanelOpen(false);
        setSharedBoardsPanelOpen(false);
        setNotesPanelOpen(false);
      }
    } else if (panel === 'storage') {
      setStoragePanelOpen(!storagePanelOpen);
      if (!storagePanelOpen) {
        setAiPanelOpen(false);
        setPeoplePanelOpen(false);
        setWorkspaceChatOpen(false);
        setKanbanPanelOpen(false);
        setSharedBoardsPanelOpen(false);
        setNotesPanelOpen(false);
      }
    } else if (panel === 'sharedBoards') {
      setSharedBoardsPanelOpen(!sharedBoardsPanelOpen);
      if (!sharedBoardsPanelOpen) {
        setAiPanelOpen(false);
        setPeoplePanelOpen(false);
        setWorkspaceChatOpen(false);
        setKanbanPanelOpen(false);
        setStoragePanelOpen(false);
        setNotesPanelOpen(false);
      }
    } else if (panel === 'notes') {
      setNotesPanelOpen(!notesPanelOpen);
      if (!notesPanelOpen) {
        setAiPanelOpen(false);
        setPeoplePanelOpen(false);
        setWorkspaceChatOpen(false);
        setKanbanPanelOpen(false);
        setStoragePanelOpen(false);
        setSharedBoardsPanelOpen(false);
      }
    }
  };

  const isRightPanelOpen = aiPanelOpen || workspaceChatOpen || peoplePanelOpen || kanbanPanelOpen || storagePanelOpen || sharedBoardsPanelOpen || notesPanelOpen;

  return (
    <div className="flex h-full bg-white dark:bg-[#191919] overflow-hidden">
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col flex-1 h-full w-full min-h-0">
        {/* Mobile Header - Sticky */}
        <div className={`sticky top-0 z-40 items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#191919] ${showMobileUI ? 'flex' : 'hidden'}`}>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] truncate flex-1">
            {workspace?.name || 'Workspace'}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileUI(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
              title="Hide UI for full screen"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <MobileUserMenu user={user} onSettingsClick={() => setSettingsOpen(true)} />
          </div>
        </div>

        {/* Mobile Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {activeView === 'kanban' && activeBoard ? (
            <KanbanBoard
              board={activeBoard}
              workspaceId={workspaceId}
              onClose={() => setActiveView('editor')}
            />
          ) : activeView === 'whiteboard' && activeWhiteboardId ? (
            <div className="h-full">
              <WhiteboardPanel
                workspaceId={workspaceId}
                whiteboardId={activeWhiteboardId}
                onClose={() => setActiveView('editor')}
              />
            </div>
          ) : activeView === 'notes' && activeNotesBoardId ? (
            <div className="h-full">
              <NotesBoard
                boardId={activeNotesBoardId}
                workspaceId={workspaceId}
                onClose={() => setActiveView('editor')}
              />
            </div>
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
              workspace={workspace}
            />
          )}
        </div>

        {/* Mobile Bottom Navigation - Sticky + Full Screen Toggle */}
        <div className={`sticky bottom-0 z-40 items-center justify-around px-2 py-2 border-t border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#191919] ${showMobileUI ? 'flex' : 'hidden'}`}>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors tap-target"
            title="Menu"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">Menu</span>
          </button>

          <button
            onClick={() => togglePanel('ai')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors tap-target ${aiPanelOpen ? 'bg-purple-100 dark:bg-purple-900/20' : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
              }`}
            title="AI Assistant"
          >
            <SparklesIcon className={`w-6 h-6 ${aiPanelOpen ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
            <span className={`text-xs mt-1 ${aiPanelOpen ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}>AI</span>
          </button>

          <button
            onClick={() => togglePanel('chat')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors tap-target ${workspaceChatOpen ? 'bg-blue-100 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
              }`}
            title="Chat"
          >
            <ChatBubbleLeftRightIcon className={`w-6 h-6 ${workspaceChatOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
            <span className={`text-xs mt-1 ${workspaceChatOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>Chat</span>
          </button>

          <button
            onClick={() => togglePanel('kanban')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors tap-target ${kanbanPanelOpen ? 'bg-blue-100 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
              }`}
            title="Boards"
          >
            <ViewColumnsIcon className={`w-6 h-6 ${kanbanPanelOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
            <span className={`text-xs mt-1 ${kanbanPanelOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>Boards</span>
          </button>

          <button
            onClick={() => togglePanel('storage')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors tap-target ${storagePanelOpen ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
              }`}
            title="Files"
          >
            <FolderIcon className={`w-6 h-6 ${storagePanelOpen ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`} />
            <span className={`text-xs mt-1 ${storagePanelOpen ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>Files</span>
          </button>

          <button
            onClick={() => togglePanel('notes')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors tap-target ${notesPanelOpen ? 'bg-green-100 dark:bg-green-900/20' : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
              }`}
            title="Notes"
          >
            <Square3Stack3DIcon className={`w-6 h-6 ${notesPanelOpen ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
            <span className={`text-xs mt-1 ${notesPanelOpen ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>Notes</span>
          </button>

          <button
            onClick={() => togglePanel('sharedBoards')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors tap-target ${sharedBoardsPanelOpen ? 'bg-orange-100 dark:bg-orange-900/20' : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
              }`}
            title="Shared Boards"
          >
            <PresentationChartBarIcon className={`w-6 h-6 ${sharedBoardsPanelOpen ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`} />
            <span className={`text-xs mt-1 ${sharedBoardsPanelOpen ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>Boards</span>
          </button>


          <button
            onClick={() => togglePanel('people')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors tap-target ${peoplePanelOpen ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
              }`}
            title="People"
          >
            <UserGroupIcon className={`w-6 h-6 ${peoplePanelOpen ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`} />
            <span className={`text-xs mt-1 ${peoplePanelOpen ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>People</span>
          </button>
        </div>

        {/* Full Screen Toggle - Visible when UI is hidden */}
        {!showMobileUI && (
          <button
            onClick={() => setShowMobileUI(true)}
            className="fixed top-4 right-4 z-50 p-2 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg shadow-lg hover:shadow-xl transition-all"
            title="Show UI"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>

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
                  <div className="h-full overflow-hidden relative">
                    {/* Right sidebar expand button when collapsed */}
                    {isRightPanelCollapsed && (
                      <button
                        onClick={() => setIsRightPanelCollapsed(false)}
                        className="absolute bottom-3 right-3 z-50 p-1.5 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        title="Show Panels"
                      >
                        <ChevronDoubleLeftIcon className="w-4 h-4" />
                      </button>
                    )}
                    {activeView === 'kanban' && activeBoard ? (
                      <KanbanBoard
                        board={activeBoard}
                        workspaceId={workspaceId}
                        onClose={() => setActiveView('editor')}
                      />
                    ) : activeView === 'whiteboard' ? (
                      <WhiteboardPanel
                        workspaceId={workspaceId}
                        whiteboardId={activeWhiteboardId}
                        userId={user?.id}
                        onClose={() => setActiveView('editor')}
                      />
                    ) : activeView === 'notes' && activeNotesBoardId ? (
                      <NotesBoard
                        boardId={activeNotesBoardId}
                        workspaceId={workspaceId}
                        userId={user?.id}
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
                        workspace={workspace}
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
                      {notesPanelOpen && <NotesPanel workspaceId={workspaceId} onOpenBoard={handleOpenNotesBoard} />}
                      {sharedBoardsPanelOpen && <SharedBoardsPanel workspaceId={workspaceId} onOpenBoard={handleOpenWhiteboard} />}
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

      {/* Panel Toggle Buttons - Desktop - Only show when not collapsed */}
      {!isRightPanelCollapsed && (
        <div className="hidden lg:flex flex-col h-full relative overflow-hidden">
          {/* Subtle background from cover image */}
          {workspace?.cover_image && (
            <div
              className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none"
              style={{
                backgroundImage: `url(${workspace.cover_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
          )}

          {/* Top buttons */}
          <div className="flex flex-col items-start pt-4 pl-2 pr-2 gap-2 relative z-10">
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
            <button
              onClick={() => togglePanel('notes')}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
              title={notesPanelOpen ? 'Hide Notes' : 'Show Notes'}
            >
              {notesPanelOpen ? (
                <XMarkIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Square3Stack3DIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
            </button>
            <button
              onClick={() => togglePanel('sharedBoards')}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
              title={sharedBoardsPanelOpen ? 'Hide Shared Boards' : 'Show Shared Boards'}
            >
              {sharedBoardsPanelOpen ? (
                <XMarkIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              ) : (
                <Square2StackIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              )}
            </button>
          </div>

          {/* Collapse button at bottom */}
          <div className="mt-auto flex flex-col items-start pl-2 pr-2 pb-4 gap-2 relative z-10">
            <div className="w-full h-px bg-gray-200 dark:bg-[#2a2a2a] mb-2" />
            <button
              onClick={() => {
                setIsRightPanelCollapsed(true);
                setAiPanelOpen(false);
                setWorkspaceChatOpen(false);
                setPeoplePanelOpen(false);
                setPeoplePanelOpen(false);
                setKanbanPanelOpen(false);
                setStoragePanelOpen(false);
                setNotesPanelOpen(false);
                setSharedBoardsPanelOpen(false);
              }}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
              title="Hide panels"
            >
              <ChevronDoubleRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      )}

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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Boards</h2>
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

      {/* Shared Boards Panel - Mobile (Full Screen Overlay) */}
      {sharedBoardsPanelOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-[#181818]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Shared Boards</h2>
            <button
              onClick={() => setSharedBoardsPanelOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="h-[calc(100vh-60px)]">
            <SharedBoardsPanel workspaceId={workspaceId} onOpenBoard={handleOpenWhiteboard} />
          </div>
        </div>
      )}

      {/* Notes Panel - Mobile (Full Screen Overlay) */}
      {notesPanelOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-[#181818]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Notes Boards</h2>
            <button
              onClick={() => setNotesPanelOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="h-[calc(100vh-60px)]">
            <NotesPanel workspaceId={workspaceId} onOpenBoard={handleOpenNotesBoard} />
          </div>
        </div>
      )}

      {/* Mobile Sidebar Modal */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileSidebarOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-white dark:bg-[#191919] shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Menu</h2>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="h-[calc(100vh-60px)]">
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
                onOpenSnippet={(snippet) => {
                  openSnippet(snippet);
                  setMobileSidebarOpen(false);
                }}
                onDeleteSnippet={deleteSnippet}
                onDeleteFolder={deleteFolder}
                onDeleteEntity={deleteEntity}
                onDeleteTag={deleteTag}
                onReorderSnippets={reorderSnippets}
                onMoveSnippetToFolder={moveSnippetToFolder}
                onOpenKanban={(board) => {
                  handleOpenKanban(board);
                  setMobileSidebarOpen(false);
                }}
                onToggleSidebar={() => setMobileSidebarOpen(false)}
              />
            </div>
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
