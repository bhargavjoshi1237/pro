'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/context/ThemeContext';
import AppLayout from '@/components/layout/AppLayout';
import {
    Search,
    Filter,
    LayoutGrid,
    Plus,
    Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useProper6k } from '@/hooks/useProper6k';
import { IssueRow } from '@/components/proper-6k/IssueRow';
import { IssueCreateDialog } from '@/components/proper-6k/IssueCreateDialog';
import { IssueDetailPanel } from '@/components/proper-6k/IssueDetailPanel';
import { statusConfig } from '@/components/proper-6k/StatusSelector';

function LinearDashboard({ userProfile, workspaceId, userId }) {
    const {
        issues,
        projects,
        labels,
        cycles,
        members,
        loading,
        error,
        createIssue,
        updateIssue,
        deleteIssue,
        createProject,
        createLabel,
        addLabelToIssue,
        removeLabelFromIssue
    } = useProper6k(workspaceId, userId);

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [detailPanelOpen, setDetailPanelOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('active'); // 'all', 'active', 'backlog'
    const [statusFilter, setStatusFilter] = useState([]);
    const [defaultProject, setDefaultProject] = useState(null);

    // Ensure default project exists
    useEffect(() => {
        const initializeDefaultProject = async () => {
            if (!workspaceId || !userId || !supabase || loading) return;

            // Check if any projects exist
            if (projects.length === 0) {
                // Create default project only if none exist
                try {
                    const newProject = await createProject({
                        name: 'General',
                        key: 'GEN',
                        description: 'Default project for issues',
                        icon: '📋'
                    });
                    if (newProject) {
                        setDefaultProject(newProject.id);
                    }
                } catch (error) {
                    // Silently ignore duplicate key errors - project already exists
                    if (error.code !== '23505') {
                        console.error('Error creating default project:', error);
                    }
                }
            } else {
                setDefaultProject(projects[0].id);
            }
        };

        initializeDefaultProject();
    }, [workspaceId, userId, projects.length, loading]);

    // Filter issues
    const filteredIssues = useMemo(() => {
        let filtered = issues;

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(issue =>
                issue.title.toLowerCase().includes(query) ||
                issue.description?.toLowerCase().includes(query) ||
                (issue.project?.name.toLowerCase().includes(query))
            );
        }

        // Apply active filter
        if (activeFilter === 'active') {
            filtered = filtered.filter(issue =>
                !['done', 'canceled'].includes(issue.status)
            );
        } else if (activeFilter === 'backlog') {
            filtered = filtered.filter(issue => issue.status === 'backlog');
        }

        // Apply status filter
        if (statusFilter.length > 0) {
            filtered = filtered.filter(issue => statusFilter.includes(issue.status));
        }

        return filtered;
    }, [issues, searchQuery, activeFilter, statusFilter]);

    // Group issues by status
    const groupedIssues = useMemo(() => {
        const groups = {};

        Object.keys(statusConfig).forEach(status => {
            groups[status] = filteredIssues.filter(issue => issue.status === status);
        });

        return groups;
    }, [filteredIssues]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // C - Create issue
            if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                const target = e.target;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    setCreateDialogOpen(true);
                }
            }

            // / - Focus search
            if (e.key === '/') {
                const target = e.target;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    document.getElementById('issue-search')?.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleCreateIssue = async (issueData, selectedLabels) => {
        try {
            // Ensure project_id is set
            if (!issueData.project_id && defaultProject) {
                issueData.project_id = defaultProject;
            }

            const newIssue = await createIssue(issueData);

            // Add labels if any
            if (newIssue && selectedLabels.length > 0) {
                for (const labelId of selectedLabels) {
                    await addLabelToIssue(newIssue.id, labelId);
                }
            }
        } catch (error) {
            console.error('Failed to create issue:', error);
            alert('Failed to create issue. Please try again.');
        }
    };

    const handleIssueClick = (issue) => {
        setSelectedIssue(issue);
        setDetailPanelOpen(true);
    };

    const handleCreateLabel = async (labelData) => {
        try {
            return await createLabel(labelData);
        } catch (error) {
            console.error('Failed to create label:', error);
            return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                    <p className="text-red-500 font-medium">Error loading issues</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-full w-full bg-background text-foreground">
                {/* Top Filter Bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border dark:border-gray-600">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                            <Filter className="w-4 h-4 mr-1" />
                            <span>Filter</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center space-x-4 text-sm font-medium">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={`${activeFilter === 'all'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    } cursor-pointer transition-colors`}
                            >
                                All issues
                            </button>
                            <button
                                onClick={() => setActiveFilter('active')}
                                className={`${activeFilter === 'active'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    } cursor-pointer transition-colors`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setActiveFilter('backlog')}
                                className={`${activeFilter === 'backlog'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    } cursor-pointer transition-colors`}
                            >
                                Backlog
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="issue-search"
                                className="h-8 pl-8 w-[200px] bg-muted/50 border-transparent focus:bg-background focus:border-border transition-all"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-3"
                            onClick={() => setCreateDialogOpen(true)}
                        >
                            New Issue
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto p-6">
                    {filteredIssues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="space-y-3">
                                <p className="text-lg font-medium text-muted-foreground">
                                    {searchQuery ? 'No issues found' : 'No issues yet'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery
                                        ? 'Try adjusting your search or filters'
                                        : 'Create your first issue to get started'
                                    }
                                </p>
                                {!searchQuery && (
                                    <Button onClick={() => setCreateDialogOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Issue
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        Object.entries(groupedIssues).map(([status, statusIssues]) => {
                            if (statusIssues.length === 0) return null;

                            const statusInfo = statusConfig[status];
                            const StatusIcon = statusInfo.icon;

                            return (
                                <div key={status} className="mb-8">
                                    <div className="flex items-center justify-between mb-2 group">
                                        <div className="flex items-center space-x-2">
                                            <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                                            <h3 className="font-medium text-sm dark:text-white">
                                                {statusInfo.label}
                                            </h3>
                                            <span className="text-muted-foreground dark:text-gray-400 text-sm ml-2">
                                                {statusIssues.length}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-[1px]">
                                        {statusIssues.map(issue => (
                                            <IssueRow
                                                key={issue.id}
                                                issue={issue}
                                                onClick={handleIssueClick}
                                                onDelete={deleteIssue}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Keyboard shortcuts hint */}
                    <div className="fixed bottom-4 right-4 text-xs text-muted-foreground bg-muted/50 backdrop-blur px-3 py-2 rounded-md border border-border">
                        Press <kbd className="px-1 py-0.5 bg-background border border-border rounded">C</kbd> to create issue, <kbd className="px-1 py-0.5 bg-background border border-border rounded">/</kbd> to search
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <IssueCreateDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onCreateIssue={handleCreateIssue}
                projects={projects}
                labels={labels}
                members={members}
                defaultProject={defaultProject}
            />

            <IssueDetailPanel
                issue={selectedIssue}
                open={detailPanelOpen}
                onOpenChange={setDetailPanelOpen}
                onUpdateIssue={updateIssue}
                onDeleteIssue={deleteIssue}
                labels={labels}
                members={members}
                onCreateLabel={handleCreateLabel}
                userId={userId}
            />
        </>
    );
}

function Proper6kContent() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!supabase) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            setUser(session.user);

            // Load user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url, display_name')
                .eq('id', session.user.id)
                .single();

            if (profile) setUserProfile(profile);

            // Get user's first workspace
            const { data: workspaces } = await supabase
                .from('workspace_members')
                .select('workspace_id')
                .eq('user_id', session.user.id)
                .limit(1)
                .single();

            if (workspaces) {
                setWorkspaceId(workspaces.workspace_id);
            }

            setLoading(false);
        };
        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!workspaceId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="text-center space-y-2">
                    <p className="text-lg font-medium">No workspace found</p>
                    <p className="text-sm text-muted-foreground">
                        Please create a workspace to use Proper 6K
                    </p>
                </div>
            </div>
        );
    }

    return (
        <AppLayout
            title="Proper 6K"
            description="Manage your projects efficiently"
            user={user}
            userProfile={userProfile}
        >
            <LinearDashboard
                userProfile={userProfile}
                workspaceId={workspaceId}
                userId={user?.id}
            />
        </AppLayout>
    );
}

export default function Proper6kPage() {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <Proper6kContent />
        </ThemeProvider>
    );
}
