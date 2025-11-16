'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  PlusIcon, 
  FolderIcon, 
  UsersIcon, 
  SparklesIcon, 
  HomeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
  ChevronRightIcon,
  ClockIcon,
  TrashIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { LoadingPage } from '@/components/LoadingSpinner';
import SettingsDialog from '@/components/settings/SettingsDialog';
import ShareWorkspaceDialog from '@/components/workspace/ShareWorkspaceDialog';
import MemberAvatars from '@/components/workspace/MemberAvatars';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { CommandPalette } from '@/components/CommandPalette';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { ChatDrawer } from '@/components/chat/ChatDrawer';

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [workspaceMembersMap, setWorkspaceMembersMap] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const loadWorkspaces = async (userId) => {
      if (!supabase) return;

      // Load workspaces where user is a member
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members!inner(role, user_id)
        `)
        .eq('workspace_members.user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Enrich workspaces with user's role
        const enrichedWorkspaces = data.map(ws => ({
          ...ws,
          userRole: ws.workspace_members[0]?.role
        }));
        setWorkspaces(enrichedWorkspaces);

        // Load all members for each workspace
        loadAllWorkspaceMembers(enrichedWorkspaces.map(w => w.id));
      }
      setLoading(false);
    };

    const loadAllWorkspaceMembers = async (workspaceIds) => {
      if (!supabase || workspaceIds.length === 0) return;

      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, id, user_id, role, profiles(email, avatar_url)')
        .in('workspace_id', workspaceIds);

      if (!error && data) {
        // Group members by workspace_id
        const membersMap = {};
        data.forEach(member => {
          if (!membersMap[member.workspace_id]) {
            membersMap[member.workspace_id] = [];
          }
          membersMap[member.workspace_id].push({
            id: member.id,
            user_id: member.user_id,
            role: member.role,
            email: member.profiles?.email,
            avatar_url: member.profiles?.avatar_url
          });
        });
        setWorkspaceMembersMap(membersMap);
      }
    };

    const checkAuth = async () => {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      loadWorkspaces(session.user.id);
    };
    
    checkAuth();
  }, [router]);

  const createWorkspace = async () => {
    if (!supabase || !newWorkspaceName.trim() || creating) return;

    setCreating(true);

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert([{ name: newWorkspaceName.trim(), owner_id: user.id }])
        .select()
        .single();

      if (!error && data) {
        await supabase
          .from('workspace_members')
          .insert([{ workspace_id: data.id, user_id: user.id, role: 'owner' }]);

        // Add userRole to the new workspace
        const newWorkspace = { ...data, userRole: 'owner' };
        setWorkspaces([newWorkspace, ...workspaces]);
        
        // Add to members map
        setWorkspaceMembersMap({
          ...workspaceMembersMap,
          [data.id]: [{
            id: data.id,
            user_id: user.id,
            role: 'owner',
            email: user.email,
            avatar_url: null
          }]
        });

        setNewWorkspaceName('');
        setShowNewWorkspace(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const openWorkspace = (workspaceId) => {
    router.push(`/workspace/${workspaceId}`);
  };

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!supabase) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  const loadWorkspaceMembers = async (workspaceId) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('workspace_members')
      .select('*, profiles(email, avatar_url)')
      .eq('workspace_id', workspaceId);

    if (!error && data) {
      const members = data.map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        email: m.profiles?.email,
        avatar_url: m.profiles?.avatar_url
      }));
      setWorkspaceMembers(members);
    }
  };

  const handleShareWorkspace = async (workspace) => {
    setSelectedWorkspace(workspace);
    await loadWorkspaceMembers(workspace.id);
    setShowShareDialog(true);
    setOpenMenuId(null);
  };

  const handleMembersUpdate = async () => {
    if (selectedWorkspace) {
      await loadWorkspaceMembers(selectedWorkspace.id);
      
      // Also refresh the members map for the workspace list
      const { data, error } = await supabase
        .from('workspace_members')
        .select('id, user_id, role, profiles(email, avatar_url)')
        .eq('workspace_id', selectedWorkspace.id);

      if (!error && data) {
        const members = data.map(m => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          email: m.profiles?.email,
          avatar_url: m.profiles?.avatar_url
        }));
        
        setWorkspaceMembersMap({
          ...workspaceMembersMap,
          [selectedWorkspace.id]: members
        });
      }
    }
  };

  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameWorkspaceName, setRenameWorkspaceName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRenameWorkspace = async () => {
    if (!supabase || !selectedWorkspace || !renameWorkspaceName.trim()) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ name: renameWorkspaceName.trim() })
        .eq('id', selectedWorkspace.id);

      if (!error) {
        setWorkspaces(workspaces.map(w => 
          w.id === selectedWorkspace.id 
            ? { ...w, name: renameWorkspaceName.trim() }
            : w
        ));
        setShowRenameDialog(false);
        setRenameWorkspaceName('');
        setSelectedWorkspace(null);
      }
    } catch (error) {
      console.error('Error renaming workspace:', error);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!supabase || !selectedWorkspace) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', selectedWorkspace.id);

      if (!error) {
        setWorkspaces(workspaces.filter(w => w.id !== selectedWorkspace.id));
        setShowDeleteConfirm(false);
        setSelectedWorkspace(null);
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row h-screen bg-[#f8f9fa] dark:bg-[#1c1c1c]">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:flex lg:w-64 bg-white dark:bg-[#181818] border-r border-gray-200 dark:border-[#2a2a2a] flex-col">
          <div className="px-3 py-2.5 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
              <div className="w-24 h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            <div className="w-full h-10 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg animate-pulse" />
          </nav>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 overflow-auto">
          <div className="bg-white dark:bg-[#181818] border-b border-gray-200 dark:border-[#2a2a2a] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="w-48 h-8 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse mb-2" />
            <div className="w-64 h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
          </div>
          
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="w-24 h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse mb-3" />
                      <div className="w-16 h-8 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
                    </div>
                    <div className="w-12 h-12 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Workspaces Skeleton */}
            <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-lg">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                <div className="w-32 h-6 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
              </div>
              <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                {[1, 2, 3].map(i => (
                  <div key={i} className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg animate-pulse" />
                      <div className="flex-1">
                        <div className="w-48 h-5 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse mb-2" />
                        <div className="w-32 h-3 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
                      </div>
                      <div className="w-6 h-6 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#f8f9fa] dark:bg-[#1c1c1c] relative overflow-hidden">
        {/* Command Palette */}
        <CommandPalette workspaces={workspaces} />
        
        {/* Chat Drawer */}
        {user && <ChatDrawer userId={user.id} />}
        
        {/* Sidebar */}
        <div className="hidden lg:flex lg:w-64 bg-white dark:bg-[#181818] border-r border-gray-200 dark:border-[#2a2a2a] flex-col">
          {/* Logo with Theme Toggle */}
          <div className="px-3 py-2.5 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Novel Snippets</span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <SunIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-[#e7e7e7] bg-gray-100 dark:bg-[#2a2a2a] rounded-lg">
              <HomeIcon className="w-5 h-5" />
              Home
            </button>
            <button
              onClick={() => router.push('/ai-chat')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              AI Chat
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-white dark:bg-[#181818] border-b border-gray-200 dark:border-[#2a2a2a] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-[#e7e7e7]">All Workspaces</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                  Manage and organize your writing projects
                  <span className="hidden md:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                    • Press <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup> for quick actions
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {user && <NotificationCenter userId={user.id} />}
                <button
                  onClick={() => setShowNewWorkspace(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">New Workspace</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {workspaces.length > 0 ? (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Workspaces</p>
                        <p className="text-3xl font-semibold text-gray-900 dark:text-[#e7e7e7] mt-2">{workspaces.length}</p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <FolderIcon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborators</p>
                        <p className="text-3xl font-semibold text-gray-900 dark:text-[#e7e7e7] mt-2">0</p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <UsersIcon className="w-6 h-6 text-green-600 dark:text-green-500" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Active</p>
                        <p className="text-3xl font-semibold text-gray-900 dark:text-[#e7e7e7] mt-2">Today</p>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <ClockIcon className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workspaces Table */}
                     <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-visible">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Your Workspaces</h2>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a] overflow-visible">
                    {workspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-[#1c1c1c] transition-colors group"
                      >
                        <button
                          onClick={() => openWorkspace(workspace.id)}
                          className="flex-1 flex items-center gap-4 text-left"
                        >
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FolderIcon className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {workspace.name}
                              </h3>
                              {workspace.userRole && workspace.userRole !== 'owner' && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                  Shared
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                              Created {new Date(workspace.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-3">
                          {/* Member Avatars */}
                          {workspaceMembersMap[workspace.id] && workspaceMembersMap[workspace.id].length > 0 && (
                            <MemberAvatars members={workspaceMembersMap[workspace.id]} max={3} />
                          )}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === workspace.id ? null : workspace.id);
                              }}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                            >
                              <EllipsisVerticalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>

                            {openMenuId === workspace.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#212121] rounded-lg shadow-xl border border-gray-200 dark:border-[#2a2a2a] z-50 py-1">
                                  <button
                                    onClick={() => handleShareWorkspace(workspace)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-left"
                                  >
                                    <UsersIcon className="w-4 h-4" />
                                    Share Workspace
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setOpenMenuId(null);
                                      const { exportWorkspace } = await import('@/lib/workspaceExport');
                                      await exportWorkspace(workspace.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-left"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export Workspace
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedWorkspace(workspace);
                                      setRenameWorkspaceName(workspace.name);
                                      setShowRenameDialog(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-left"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedWorkspace(workspace);
                                      setShowDeleteConfirm(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-12 text-center">
                <div className="inline-flex p-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-full mb-4">
                  <FolderIcon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">No workspaces yet</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Create your first workspace to start organizing your writing projects
                </p>
                <button
                  onClick={() => setShowNewWorkspace(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create Your First Workspace
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Menu - Bottom Left */}
        <div className="absolute bottom-4 left-4 z-10">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-semibold shadow-lg transition-colors"
          >
            {user?.email?.charAt(0).toUpperCase()}
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute bottom-12 left-0 w-56 bg-white dark:bg-[#212121] rounded-lg shadow-xl border border-gray-200 dark:border-[#2a2a2a] z-30">
                <div className="p-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                  <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7] truncate">
                    {user?.email}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loggingOut ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Logging out...
                      </>
                    ) : (
                      <>
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Logout
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Settings Dialog */}
        <SettingsDialog 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          user={user} 
        />

        {/* Share Workspace Dialog */}
        <ShareWorkspaceDialog
          isOpen={showShareDialog}
          onClose={() => {
            setShowShareDialog(false);
            setSelectedWorkspace(null);
          }}
          workspace={selectedWorkspace}
          members={workspaceMembers}
          onMembersUpdate={handleMembersUpdate}
        />

        {/* Rename Workspace Dialog */}
        {showRenameDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRenameDialog(false)}>
            <div 
              className="bg-white dark:bg-[#181818] rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-[#2a2a2a]" 
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-4">Rename Workspace</h3>
              <input
                type="text"
                value={renameWorkspaceName}
                onChange={(e) => setRenameWorkspaceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameWorkspace()}
                placeholder="Workspace name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleRenameWorkspace}
                  disabled={!renameWorkspaceName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={() => setShowRenameDialog(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
            <div 
              className="bg-white dark:bg-[#181818] rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-[#2a2a2a]" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">Delete Workspace</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to delete &ldquo;{selectedWorkspace?.name}&rdquo;? This action cannot be undone and will delete all snippets in this workspace.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteWorkspace}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] text-sm font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Workspace Modal */}
        {showNewWorkspace && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => !creating && setShowNewWorkspace(false)}>
            <div className="bg-white dark:bg-[#181818] rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-[#2a2a2a]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-4">Create New Workspace</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !creating && createWorkspace()}
                  placeholder="My Novel Project"
                  disabled={creating}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 text-sm"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createWorkspace}
                  disabled={creating || !newWorkspaceName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Workspace'
                  )}
                </button>
                <button
                  onClick={() => setShowNewWorkspace(false)}
                  disabled={creating}
                  className="px-4 py-2 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-[#e7e7e7] text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}
