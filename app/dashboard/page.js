'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  PlusIcon,
  FolderIcon,
  UsersIcon,
  SparklesIcon,
  HomeIcon,
  MoonIcon,
  SunIcon,
  ChevronRightIcon,
  TrashIcon,
  EnvelopeIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import SettingsDialog from '@/components/settings/SettingsDialog';
import ShareWorkspaceDialog from '@/components/workspace/ShareWorkspaceDialog';
import MemberAvatars from '@/components/workspace/MemberAvatars';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import CommandPalette from '@/components/CommandPalette';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import WorkspaceCustomization from '@/components/workspace/WorkspaceCustomization';
import { getIconById, DEFAULT_ICON } from '@/components/workspace/WorkspaceIcons';
import MobileSidebar from '@/components/layout/MobileSidebar';
import { motion, useSpring, useTransform } from 'framer-motion';
import { WaveBackground } from '@/components/landing/wave/WaveBackground';
import { ToolCase } from 'lucide-react';
import UserMenu from '@/components/layout/UserMenu';

function AnimatedCounter({ value }) {
  const spring = useSpring(0, { bounce: 0, duration: 2000 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
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
  const [totalCollaborators, setTotalCollaborators] = useState(0);
  const [totalSnippets, setTotalSnippets] = useState(0);
  const [openingWorkspaceId, setOpeningWorkspaceId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        // console.log('📂 Loaded workspaces:', data.length);
        data.forEach(ws => {
          if (ws.cover_image) {
            // console.log(`🖼️ Workspace "${ws.name}" has cover:`, ws.cover_image);
          }
        });

        // Enrich workspaces with user's role
        const enrichedWorkspaces = data.map(ws => ({
          ...ws,
          userRole: ws.workspace_members[0]?.role
        }));
        setWorkspaces(enrichedWorkspaces);

        // Load all members for each workspace
        loadAllWorkspaceMembers(enrichedWorkspaces.map(w => w.id), userId);

        // Load total snippets count
        loadTotalSnippets(enrichedWorkspaces.map(w => w.id));
      }
      setLoading(false);
    };

    const loadTotalSnippets = async (workspaceIds) => {
      if (!supabase || workspaceIds.length === 0) return;

      const { count, error } = await supabase
        .from('snippets')
        .select('*', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds);

      if (!error && count !== null) {
        setTotalSnippets(count);
      }
    };

    const loadAllWorkspaceMembers = async (workspaceIds, userId) => {
      if (!supabase || workspaceIds.length === 0) return;

      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, id, user_id, role, profiles(email, avatar_url)')
        .in('workspace_id', workspaceIds);

      if (!error && data) {
        // Group members by workspace_id
        const membersMap = {};
        const uniqueCollaborators = new Set();

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

          // Count unique collaborators (excluding current user)
          if (member.user_id !== userId) {
            uniqueCollaborators.add(member.user_id);
          }
        });

        setWorkspaceMembersMap(membersMap);
        setTotalCollaborators(uniqueCollaborators.size);
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

      // Load user profile with avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

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
    setOpeningWorkspaceId(workspaceId);
    router.push(`/workspace/${workspaceId}`);
  };

  useEffect(() => {
    if (!openingWorkspaceId) return;
    const timeout = setTimeout(() => setOpeningWorkspaceId(null), 10000);
    return () => clearTimeout(timeout);
  }, [openingWorkspaceId]);

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
  const [showCustomization, setShowCustomization] = useState(false);

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
      <div className="relative min-h-screen overflow-hidden">
        <div className="flex flex-col lg:flex-row h-screen">
          <WaveBackground />
          <div className="absolute inset-0 bg-white/40 dark:bg-[#191919]/40 backdrop-blur-xs z-0"></div>
          {/* Sidebar Skeleton */}
          <div className="hidden lg:flex lg:w-64 bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border-r border-gray-200 dark:border-[#2a2a2a] flex-col relative z-10">
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
          <div className="flex-1 overflow-auto relative z-10">
            {/* Mobile Header Skeleton */}
            <div className="lg:hidden sticky top-0 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#2a2a2a] px-3 py-2.5 flex items-center justify-between z-20">
              <div className="w-8 h-8 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg animate-pulse" />
              <div className="w-20 h-5 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg animate-pulse" />
            </div>

            <div className="hidden lg:block bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#2a2a2a] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="w-48 h-8 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse mb-2" />
              <div className="w-64 h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              {/* Stats Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
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
              <div className="bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-[#2a2a2a] rounded-lg">
                  <div className="w-32 h-6 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
                </div>
                <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a] rounded-full">
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
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="flex flex-col lg:flex-row h-screen">
        <WaveBackground />

        {/* Blurred Overlay */}
        <div className="absolute inset-0 bg-white/40 dark:bg-[#191919]/40 backdrop-blur-xs z-0"></div>

        {/* Elegant centered loader when opening a workspace */}
        {openingWorkspaceId && (
          (() => {
            const workspace = workspaces.find(w => w.id === openingWorkspaceId);
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/20 dark:bg-black/40 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="pointer-events-auto"
                >
                  <div className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="relative">
                      <svg className="animate-spin h-8 w-8 text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    </div>
                    <div className="leading-tight">
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        Opening{workspace ? ` ${workspace.name}` : ' workspace'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Preparing your workspace...
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()
        )}

        {/* Command Palette */}
        <CommandPalette workspaces={workspaces} />
        {/* Sidebar */}
        <div className="hidden lg:flex lg:w-64 bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border-r border-gray-200 dark:border-[#2a2a2a] flex-col relative z-10">
          {/* Logo with Theme Toggle */}
          <div className="px-3 py-2.5 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Prodigy</span>
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
            <button
              onClick={() => router.push('/emails')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              <EnvelopeIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Emails
            </button>
            <button
              onClick={() => router.push('/proper6k')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              <ToolCase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Proper 6K
            </button>
          </nav>
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileSidebar
          open={mobileMenuOpen}
          setOpen={setMobileMenuOpen}
          user={user}
          userProfile={userProfile}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto relative z-10 pb-14 lg:pb-0">
          {/* Mobile Header Bar */}
          <div className="lg:hidden sticky top-0 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#2a2a2a] px-3 py-2.5 flex items-center justify-between z-20">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              <Bars3Icon className="w-5 h-5 text-gray-900 dark:text-[#e7e7e7]" />
            </button>

            <div className="flex items-center">
              <SparklesIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>

            <button
              onClick={() => setShowNewWorkspace(true)}
              className="p-1.5 -mr-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
              aria-label="Create workspace"
            >
              <PlusIcon className="w-5 h-5 text-gray-900 dark:text-[#e7e7e7]" />
            </button>
          </div>

          {/* Header */}
          <div className="hidden lg:block bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#2a2a2a] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-[#e7e7e7] truncate">All Workspaces</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:flex items-center gap-2">
                  Manage and organize your writing projects
                  <span className="hidden md:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                    • Press <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup> for quick actions
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Notifications disabled */}
                {/* {user && <NotificationCenter userId={user.id} />} */}
                <button
                  onClick={() => setShowNewWorkspace(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#212121] dark:bg-[#e7e7e7] hover:bg-gray-300 dark:hover:bg-[#a5a5a5] border border-gray-300 dark:border-[#383838] text-[#e7e7e7] dark:text-gray-900 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-[40px]"
                >
                  <PlusIcon className="w-4 h-4 flex-shrink-0" />
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
                  <div className="bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Workspaces</p>
                        <p className="text-3xl font-semibold text-gray-900 dark:text-[#e7e7e7] mt-2">
                          <AnimatedCounter value={workspaces.length} />
                        </p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <FolderIcon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborators</p>
                        <p className="text-3xl font-semibold text-gray-900 dark:text-[#e7e7e7] mt-2">
                          <AnimatedCounter value={totalCollaborators} />
                        </p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <UsersIcon className="w-6 h-6 text-green-600 dark:text-green-500" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Snippets</p>
                        <p className="text-3xl font-semibold text-gray-900 dark:text-[#e7e7e7] mt-2">
                          <AnimatedCounter value={totalSnippets} />
                        </p>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workspaces Table */}
                <div className="bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Your Workspaces</h2>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                    {workspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        className="relative group"
                      >
                        {/* Cover Image Background */}
                        {workspace.cover_image && (
                          <div
                            className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none transition-opacity group-hover:opacity-15 dark:group-hover:opacity-8"
                            style={{
                              backgroundImage: `url(${workspace.cover_image})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                        )}

                        {/* Subtle hover overlay */}
                        <div className="absolute inset-0 bg-transparent group-hover:bg-gray-50/50 dark:group-hover:bg-white/5 transition-colors pointer-events-none" />

                        <div className="relative px-4 sm:px-6 py-3 sm:py-4 overflow-visible  ">
                          <div className="flex items-center justify-between gap-4">
                            <div
                              onClick={() => openWorkspace(workspace.id)}
                              className="flex flex-1 items-center gap-4 text-left cursor-pointer"
                            >
                              {/* Workspace Icon */}
                              <div className="w-12 h-12 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center shrink-0">
                                {(() => {
                                  const IconComponent = getIconById(workspace.icon || DEFAULT_ICON);
                                  return <IconComponent className="w-6 h-6 text-white dark:text-gray-900" />;
                                })()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7] group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
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
                              <div className="flex items-center gap-3">
                                {workspaceMembersMap[workspace.id] && workspaceMembersMap[workspace.id].length > 0 && (
                                  <MemberAvatars members={workspaceMembersMap[workspace.id]} max={3} />
                                )}
                              </div>
                              <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                            </div>

                            <div className="relative flex items-center">
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
                                        setShowCustomization(true);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-left"
                                    >
                                      <SparklesIcon className="w-4 h-4" />
                                      Personalise
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
                          </div>
                        </div>

                        {/* per-row loader removed in favor of a single elegant centered loader */}
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] text-gray-900 dark:text-[#e7e7e7] text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create Your First Workspace
                </button>
              </div>
            )}
          </div>
        </div>



        {/* User Menu - Available on all pages */}
        <UserMenu user={user} userProfile={userProfile} />


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
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent outline-none text-sm mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleRenameWorkspace}
                  disabled={!renameWorkspaceName.trim()}
                  className="flex-1 px-4 py-2 bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-[#e7e7e7] text-sm font-medium rounded-lg transition-colors"
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
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteWorkspace}
          title="Confirm to delete workspace"
          message={`This is permanent! Are you sure you want to delete "${selectedWorkspace?.name}"? This will delete all snippets in this workspace.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />

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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent outline-none transition-all disabled:opacity-50 text-sm"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createWorkspace}
                  disabled={creating || !newWorkspaceName.trim()}
                  className="flex-1 px-4 py-2 bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-[#e7e7e7] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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

        {/* Workspace Customization Dialog */}
        {showCustomization && selectedWorkspace && (
          <WorkspaceCustomization
            workspace={selectedWorkspace}
            onUpdate={(updatedWorkspace) => {
              setWorkspaces(workspaces.map(w =>
                w.id === updatedWorkspace.id ? updatedWorkspace : w
              ));
              setShowCustomization(false);
            }}
            onClose={() => setShowCustomization(false)}
          />
        )}
      </div>
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
