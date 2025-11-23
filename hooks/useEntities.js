import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useEntities(workspaceId) {
    const [entities, setEntities] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEntities = async () => {
            if (!supabase || !workspaceId) return;

            try {
                setLoading(true);
                console.log('Fetching entities for workspace:', workspaceId);
                const [entitiesRes, tagsRes] = await Promise.all([
                    supabase.from('workspace_entities').select('*').eq('workspace_id', workspaceId).order('name'),
                    supabase.from('workspace_tags').select('*').eq('workspace_id', workspaceId).order('name')
                ]);

                console.log('Entities response:', entitiesRes);
                console.log('Tags response:', tagsRes);

                if (entitiesRes.data) setEntities(entitiesRes.data);
                if (tagsRes.data) setTags(tagsRes.data);
            } catch (error) {
                console.error('Error loading entities:', error);
            } finally {
                setLoading(false);
            }
        };

        loadEntities();
    }, [workspaceId]);

    // Realtime subscriptions
    useEffect(() => {
        if (!supabase || !workspaceId) return;

        const entitiesChannel = supabase
            .channel(`entities:${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'workspace_entities',
                    filter: `workspace_id=eq.${workspaceId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setEntities((prev) => [...prev, payload.new].sort((a, b) => a.name.localeCompare(b.name)));
                    } else if (payload.eventType === 'UPDATE') {
                        setEntities((prev) => prev.map((e) => (e.id === payload.new.id ? payload.new : e)));
                    } else if (payload.eventType === 'DELETE') {
                        setEntities((prev) => prev.filter((e) => e.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        const tagsChannel = supabase
            .channel(`tags:${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'workspace_tags',
                    filter: `workspace_id=eq.${workspaceId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setTags((prev) => [...prev, payload.new].sort((a, b) => a.name.localeCompare(b.name)));
                    } else if (payload.eventType === 'UPDATE') {
                        setTags((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
                    } else if (payload.eventType === 'DELETE') {
                        setTags((prev) => prev.filter((t) => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(entitiesChannel);
            supabase.removeChannel(tagsChannel);
        };
    }, [workspaceId]);

    const createEntity = async (name, type, description = '', attributes = {}) => {
        if (!supabase) return;

        const { data, error } = await supabase
            .from('workspace_entities')
            .insert([{
                workspace_id: workspaceId,
                name,
                type,
                description,
                attributes
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating entity:', error);
            return null;
        }
        return data;
    };

    const deleteEntity = async (id) => {
        if (!supabase) return;

        const { error } = await supabase
            .from('workspace_entities')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting entity:', error);
        }
    };

    const createTag = async (name, color = '#808080') => {
        if (!supabase) return;

        const { data, error } = await supabase
            .from('workspace_tags')
            .insert([{
                workspace_id: workspaceId,
                name,
                color
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating tag:', error);
            return null;
        }
        return data;
    };

    const deleteTag = async (id) => {
        if (!supabase) return;

        const { error } = await supabase
            .from('workspace_tags')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting tag:', error);
        }
    };

    return {
        entities,
        tags,
        createEntity,
        deleteEntity,
        createTag,
        deleteTag,
        loading
    };
}
