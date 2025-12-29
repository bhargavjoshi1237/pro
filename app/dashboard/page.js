'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  PlusIcon,
  FolderIcon,
  UsersIcon,
  SparklesIcon,
  ChevronRightIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import SettingsDialog from '@/components/settings/SettingsDialog';
import ShareWorkspaceDialog from '@/components/workspace/ShareWorkspaceDialog';
import MemberAvatars from '@/components/workspace/MemberAvatars';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import CommandPalette from '@/components/CommandPalette';
import WorkspaceCustomization from '@/components/workspace/WorkspaceCustomization';
import { getIconById, DEFAULT_ICON } from '@/components/workspace/WorkspaceIcons';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import { Edit, Edit2, EditIcon } from 'lucide-react';

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
  const [isClosingCreate, setIsClosingCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [workspaceMembersMap, setWorkspaceMembersMap] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [totalCollaborators, setTotalCollaborators] = useState(0);
  const [totalSnippets, setTotalSnippets] = useState(0);
  const [openingWorkspaceId, setOpeningWorkspaceId] = useState(null);

  useEffect(() => {
    const loadWorkspaces = async (userId) => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members!inner(role, user_id)
        `)
        .eq('workspace_members.user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const enrichedWorkspaces = data.map(ws => ({
          ...ws,
          userRole: ws.workspace_members[0]?.role
        }));
        setWorkspaces(enrichedWorkspaces);
        loadAllWorkspaceMembers(enrichedWorkspaces.map(w => w.id), userId);
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
        setIsClosingCreate(true);
        setTimeout(() => {
          setShowNewWorkspace(false);
          setIsClosingCreate(false);
        }, 200);
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
  const [renaming, setRenaming] = useState(false);
  const [isClosingRename, setIsClosingRename] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isClosingDelete, setIsClosingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);

  const handleRenameWorkspace = async () => {
    if (!supabase || !selectedWorkspace || !renameWorkspaceName.trim() || renaming) return;

    setRenaming(true);

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
        setRenameWorkspaceName('');
        setIsClosingRename(true);
        setTimeout(() => {
          setShowRenameDialog(false);
          setIsClosingRename(false);
          setSelectedWorkspace(null);
        }, 200);
      }
    } catch (error) {
      console.error('Error renaming workspace:', error);
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!supabase || !selectedWorkspace || deleting) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', selectedWorkspace.id);

      if (!error) {
        setWorkspaces(workspaces.filter(w => w.id !== selectedWorkspace.id));
        setIsClosingDelete(true);
        setTimeout(() => {
          setShowDeleteConfirm(false);
          setSelectedWorkspace(null);
          setIsClosingDelete(false);
        }, 200);
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout user={user} userProfile={userProfile} title="All Workspaces" description="Loading...">
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
            <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
              {[1, 2, 3].map(i => (
                <div key={i} className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-4 ">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg animate-pulse shrink-0" />
                      <div className="flex-1">
                        <div className="w-18 h-5 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse mb-2" />
                        <div className="w-16 h-3 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
                      </div>
                      <div className="w-8 h-8 bg-gray-200 dark:bg-[#2a2a2a] rounded-full animate-pulse shrink-0" />
                      <div className="w-5 h-5 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse shrink-0" />
                    </div>
                    <div className="w-6 h-6 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      user={user}
      userProfile={userProfile}
      title="All Workspaces"
      description="Manage and organize your writing projects"
    >
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
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Your Workspaces</h2>
                <button
                  onClick={() => setShowNewWorkspace(true)}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] text-gray-900 dark:text-[#e7e7e7] text-xs sm:text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Workspace</span>

                </button>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className="relative group"
                  >
                   
                    {workspace.cover_image && (
                      <div
                        className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none transition-opacity group-hover:opacity-15 dark:group-hover:opacity-8"
                        style={{
                          backgroundImage: `url(${workspace.cover_image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          overflow: 'hidden',
                        }}
                      />
                    )}

                   
                    <div className="absolute inset-0 bg-transparent rounde group-hover:bg-gray-50/50 dark:group-hover:bg-white/5 transition-colors pointer-events-none" />

                    <div className="relative px-4 sm:px-6 py-3 sm:py-4 overflow-visible">
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
                                  <Edit2 className="w-4 h-4" />
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
      {showRenameDialog && !isClosingRename && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => !renaming && setShowRenameDialog(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white dark:bg-[#181818] rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-[#2a2a2a]"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-4">Rename Workspace</h3>
            <input
              type="text"
              value={renameWorkspaceName}
              onChange={(e) => setRenameWorkspaceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameWorkspace()}
              placeholder="Workspace name"
              disabled={renaming}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent outline-none text-sm mb-4 disabled:opacity-50"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleRenameWorkspace}
                disabled={!renameWorkspaceName.trim() || renaming}
                className="flex-1 px-4 py-2 bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-[#e7e7e7] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {renaming ? (
                  <>
                    <div className="flex gap-2 items-center">
                      <LoadingSpinner className=' scale-50 -mt-1 w-5 h-5' />
                      Renaming...
                    </div>
                  </>
                ) : (
                  'Rename'
                )}
              </button>
              <button
                onClick={() => {
                  setIsClosingRename(true);
                  setTimeout(() => {
                    setShowRenameDialog(false);
                    setIsClosingRename(false);
                  }, 200);
                }}
                disabled={renaming}
                className="px-4 py-2 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-[#e7e7e7] text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {showDeleteConfirm && !isClosingDelete && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white dark:bg-[#212121] rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">
              Confirm to delete workspace
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This is permanent! Are you sure you want to delete <span className="font-semibold">"{selectedWorkspace?.name}"</span>? This will delete all snippets in this workspace.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsClosingDelete(true);
                  setTimeout(() => {
                    setShowDeleteConfirm(false);
                    setIsClosingDelete(false);
                  }, 200);
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium bg-[#e53935] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
              >
                {deleting ? (
                  <div className="flex gap-2 items-center">
                    <LoadingSpinner className=' scale-50 -mt-1 w-5 h-5' />
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Create Workspace Modal */}
{showNewWorkspace && !isClosingCreate && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" 
            onClick={() => !creating && setShowNewWorkspace(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-white dark:bg-[#181818] rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-[#2a2a2a]" 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
            >
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
                    <div className="flex gap-2 items-center">
                      <LoadingSpinner className=' scale-50 -mt-1 w-5 h-5' />
                      Creating...
                    </div>
                  ) : (
                    'Create Workspace'
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsClosingCreate(true);
                    setTimeout(() => {
                      setShowNewWorkspace(false);
                      setIsClosingCreate(false);
                    }, 200);
                  }}
                disabled={creating}
                className="px-4 py-2 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-[#e7e7e7] text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
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
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}
