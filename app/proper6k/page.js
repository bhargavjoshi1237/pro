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
    Loader2,
    List,
    CheckCircle2,
    Circle,
    Archive,
    Folder,
    Clock,
    ChevronRight,
    ChevronDown,
    Calendar,
    Hash,
    Layers,
    Inbox,
    Trello
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
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedCycle, setSelectedCycle] = useState(null);

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

        // Apply project filter
        if (selectedProject) {
            filtered = filtered.filter(issue => issue.project_id === selectedProject);
        }

        // Apply cycle filter
        if (selectedCycle) {
            filtered = filtered.filter(issue => issue.cycle_id === selectedCycle);
        }

        // Apply status filter
        if (statusFilter.length > 0) {
            filtered = filtered.filter(issue => statusFilter.includes(issue.status));
        }

        return filtered;
    }, [issues, searchQuery, activeFilter, statusFilter, selectedProject, selectedCycle]);

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

    const SidebarItem = ({ icon: Icon, label, count, active, onClick, color }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group ${
                active 
                ? 'bg-primary/10 text-primary shadow-sm' 
                : 'text-muted-foreground/60 hover:bg-white/5 hover:text-foreground'
            }`}
        >
            <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${active ? 'text-primary' : color || 'text-muted-foreground/40 group-hover:text-foreground'}`} />
                <span className={`text-sm font-medium ${active ? 'text-primary' : ''}`}>{label}</span>
            </div>
            {count !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground/40'
                }`}>
                    {count}
                </span>
            )}
        </button>
    );

    const SidebarSection = ({ title, children, action }) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">{title}</h3>
                {action}
            </div>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );

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
            <div className="flex h-full w-full bg-white/10 dark:bg-black/10 backdrop-blur-md text-foreground dark:text-[#e7e7e7] overflow-hidden">
                {/* Proper 6K Sidebar */}
                <div className="w-64 border-r border-border/50 dark:border-white/5 flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-sm p-6 space-y-8 overflow-y-auto">
                    <div className="flex items-center justify-between px-3 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <Trello className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold tracking-tight">Proper 6K</span>
                        </div>
                    </div>

                    <SidebarSection title="Views">
                        <SidebarItem 
                            icon={Inbox} 
                            label="All issues" 
                            active={activeFilter === 'all' && !selectedProject && !selectedCycle}
                            onClick={() => {
                                setActiveFilter('all');
                                setSelectedProject(null);
                                setSelectedCycle(null);
                            }}
                            count={issues.length}
                        />
                        <SidebarItem 
                            icon={CheckCircle2} 
                            label="Active" 
                            active={activeFilter === 'active' && !selectedProject && !selectedCycle}
                            onClick={() => {
                                setActiveFilter('active');
                                setSelectedProject(null);
                                setSelectedCycle(null);
                            }}
                            count={issues.filter(i => !['done', 'canceled'].includes(i.status)).length}
                            color="text-blue-500"
                        />
                        <SidebarItem 
                            icon={Archive} 
                            label="Backlog" 
                            active={activeFilter === 'backlog' && !selectedProject && !selectedCycle}
                            onClick={() => {
                                setActiveFilter('backlog');
                                setSelectedProject(null);
                                setSelectedCycle(null);
                            }}
                            count={issues.filter(i => i.status === 'backlog').length}
                            color="text-gray-500"
                        />
                    </SidebarSection>

                    <SidebarSection 
                        title="Projects" 
                        action={
                            <button className="p-1 hover:bg-white/5 rounded-md text-muted-foreground/40 hover:text-foreground transition-colors">
                                <Plus className="w-3 h-3" />
                            </button>
                        }
                    >
                        {projects.map(project => (
                            <SidebarItem 
                                key={project.id}
                                icon={Folder} 
                                label={project.name} 
                                active={selectedProject === project.id}
                                onClick={() => {
                                    setSelectedProject(project.id);
                                    setSelectedCycle(null);
                                    setActiveFilter('all');
                                }}
                                color={project.color ? `text-[${project.color}]` : 'text-purple-500'}
                            />
                        ))}
                    </SidebarSection>

                    <SidebarSection title="Cycles">
                        {cycles.map(cycle => (
                            <SidebarItem 
                                key={cycle.id}
                                icon={Clock} 
                                label={cycle.name} 
                                active={selectedCycle === cycle.id}
                                onClick={() => {
                                    setSelectedCycle(cycle.id);
                                    setSelectedProject(null);
                                    setActiveFilter('all');
                                }}
                                color="text-orange-500"
                            />
                        ))}
                        {cycles.length === 0 && (
                            <p className="px-3 text-[10px] text-muted-foreground/40 italic">No active cycles</p>
                        )}
                    </SidebarSection>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between px-8 py-4 border-b border-border/50 dark:border-white/5 backdrop-blur-xl z-10">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 dark:bg-white/5 border border-border/50 dark:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-foreground dark:hover:text-white cursor-pointer transition-all">
                                <Filter className="w-3.5 h-3.5" />
                                <span>Filter</span>
                            </div>
                            
                            <div className="relative group flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="issue-search"
                                    className="h-10 pl-10 w-full bg-white/50 dark:bg-white/5 border-border/50 dark:border-white/10 rounded-2xl focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                                    placeholder="Search issues, projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-2xl text-muted-foreground/40 hover:text-foreground dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 transition-all"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                className="h-10 bg-primary hover:bg-primary/90 text-white font-bold px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                                onClick={() => setCreateDialogOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Issue
                            </Button>
                        </div>
                    </div>

                    {/* Issue List Area */}
                    <div className="flex-1 overflow-auto p-8">
                        {filteredIssues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="space-y-6 max-w-sm">
                                    <div className="w-20 h-20 bg-muted/20 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto">
                                        <Search className="w-8 h-8 text-muted-foreground/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold dark:text-white">
                                            {searchQuery ? 'No issues found' : 'No issues yet'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground/60">
                                            {searchQuery
                                                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                                : 'Create your first issue to start tracking your progress.'
                                            }
                                        </p>
                                    </div>
                                    {!searchQuery && (
                                        <Button 
                                            onClick={() => setCreateDialogOpen(true)}
                                            className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                                        >
                                            <Plus className="w-5 h-5 mr-2" />
                                            Create Issue
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-6xl mx-auto space-y-12">
                                {Object.entries(groupedIssues).map(([status, statusIssues]) => {
                                    if (statusIssues.length === 0) return null;

                                    const statusInfo = statusConfig[status];
                                    const StatusIcon = statusInfo.icon;

                                    return (
                                        <div key={status} className="space-y-4">
                                            <div className="flex items-center gap-3 px-2">
                                                <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                                                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                                                    {statusInfo.label}
                                                    <span className="ml-2 text-muted-foreground/30">{statusIssues.length}</span>
                                                </h2>
                                            </div>
                                            <div className="grid gap-2">
                                                {statusIssues.map(issue => (
                                                    <IssueRow
                                                        key={issue.id}
                                                        issue={issue}
                                                        members={members}
                                                        onClick={() => {
                                                            setSelectedIssue(issue);
                                                            setDetailPanelOpen(true);
                                                        }}
                                                        onUpdate={updateIssue}
                                                        onDelete={deleteIssue}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Keyboard shortcuts hint */}
                        <div className="fixed bottom-8 right-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 bg-white/50 dark:bg-white/5 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-border/50 dark:border-white/10 shadow-2xl">
                            Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 border border-border/50 dark:border-white/10 rounded-md mx-1">C</kbd> to create, <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 border border-border/50 dark:border-white/10 rounded-md mx-1">/</kbd> to search
                        </div>
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
            <div className="flex h-screen w-full items-center justify-center bg-background dark:bg-[#0a0a0a]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!workspaceId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background dark:bg-[#0a0a0a]">
                <div className="text-center space-y-2">
                    <p className="text-lg font-medium dark:text-[#e7e7e7]">No workspace found</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-500">
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
