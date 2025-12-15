import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useProper6k(workspaceId, userId) {
    const [issues, setIssues] = useState([]);
    const [projects, setProjects] = useState([]);
    const [labels, setLabels] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all data
    const fetchData = useCallback(async () => {
        if (!workspaceId || !supabase) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch projects
            const { data: projectsData, error: projectsError } = await supabase
                .from('proper6k_projects')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (projectsError) throw projectsError;

            // Fetch labels
            const { data: labelsData, error: labelsError } = await supabase
                .from('proper6k_labels')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('name');

            if (labelsError) throw labelsError;

            // Fetch cycles
            const { data: cyclesData, error: cyclesError } = await supabase
                .from('proper6k_cycles')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('starts_at', { ascending: false });

            if (cyclesError) throw cyclesError;

            // Fetch workspace members
            const { data: membersData, error: membersError } = await supabase
                .from('workspace_members')
                .select(`
                    user_id,
                    role,
                    profiles:user_id (
                        id,
                        display_name,
                        avatar_url
                    )
                `)
                .eq('workspace_id', workspaceId);

            if (membersError) throw membersError;

            // Fetch issues with related data
            const { data: issuesData, error: issuesError } = await supabase
                .from('proper6k_issues')
                .select(`
                    *,
                    project:project_id (id, name, key, color),
                    cycle:cycle_id (id, name),
                    assignee:profiles!assignee_id (id, display_name, avatar_url),
                    labels:proper6k_issue_labels (
                        label:label_id (
                            id,
                            name,
                            color
                        )
                    )
                `)
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (issuesError) throw issuesError;

            // Transform issues to flatten labels
            const transformedIssues = issuesData?.map(issue => ({
                ...issue,
                labels: issue.labels?.map(l => l.label).filter(Boolean) || []
            })) || [];

            setProjects(projectsData || []);
            setLabels(labelsData || []);
            setCycles(cyclesData || []);
            setMembers(membersData?.map(m => m.profiles).filter(Boolean) || []);
            setIssues(transformedIssues);

        } catch (err) {
            console.error('Error fetching Proper6K data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    // Subscribe to real-time changes
    useEffect(() => {
        if (!workspaceId || !supabase) return;

        fetchData();

        // Subscribe to issues changes
        const issuesChannel = supabase
            .channel(`proper6k_issues:${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'proper6k_issues',
                    filter: `workspace_id=eq.${workspaceId}`
                },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        // Subscribe to labels changes
        const labelsChannel = supabase
            .channel(`proper6k_labels:${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'proper6k_labels',
                    filter: `workspace_id=eq.${workspaceId}`
                },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        // Subscribe to projects changes
        const projectsChannel = supabase
            .channel(`proper6k_projects:${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'proper6k_projects',
                    filter: `workspace_id=eq.${workspaceId}`
                },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(issuesChannel);
            supabase.removeChannel(labelsChannel);
            supabase.removeChannel(projectsChannel);
        };
    }, [workspaceId, fetchData]);

    // Create issue
    const createIssue = async (issueData) => {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('proper6k_issues')
                .insert([{
                    workspace_id: workspaceId,
                    created_by: userId,
                    ...issueData
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error creating issue:', err);
            throw err;
        }
    };

    // Update issue
    const updateIssue = async (issueId, updates) => {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('proper6k_issues')
                .update(updates)
                .eq('id', issueId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error updating issue:', err);
            throw err;
        }
    };

    // Delete issue
    const deleteIssue = async (issueId) => {
        if (!supabase) return;

        try {
            const { error } = await supabase
                .from('proper6k_issues')
                .delete()
                .eq('id', issueId);

            if (error) throw error;
        } catch (err) {
            console.error('Error deleting issue:', err);
            throw err;
        }
    };

    // Create project
    const createProject = async (projectData) => {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('proper6k_projects')
                .insert([{
                    workspace_id: workspaceId,
                    created_by: userId,
                    ...projectData
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error creating project:', err);
            throw err;
        }
    };

    // Create label
    const createLabel = async (labelData) => {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('proper6k_labels')
                .insert([{
                    workspace_id: workspaceId,
                    ...labelData
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error creating label:', err);
            throw err;
        }
    };

    // Add label to issue
    const addLabelToIssue = async (issueId, labelId) => {
        if (!supabase) return;

        try {
            const { error } = await supabase
                .from('proper6k_issue_labels')
                .insert([{ issue_id: issueId, label_id: labelId }]);

            if (error) throw error;
        } catch (err) {
            console.error('Error adding label to issue:', err);
            throw err;
        }
    };

    // Remove label from issue
    const removeLabelFromIssue = async (issueId, labelId) => {
        if (!supabase) return;

        try {
            const { error } = await supabase
                .from('proper6k_issue_labels')
                .delete()
                .eq('issue_id', issueId)
                .eq('label_id', labelId);

            if (error) throw error;
        } catch (err) {
            console.error('Error removing label from issue:', err);
            throw err;
        }
    };

    // Add comment to issue
    const addComment = async (issueId, content) => {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('proper6k_comments')
                .insert([{
                    issue_id: issueId,
                    user_id: userId,
                    content
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error adding comment:', err);
            throw err;
        }
    };

    return {
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
        removeLabelFromIssue,
        addComment,
        refetch: fetchData
    };
}
