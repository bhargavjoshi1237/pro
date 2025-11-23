import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useSnippetMetadata(snippetId) {
    const [attachedEntities, setAttachedEntities] = useState([]);
    const [attachedTags, setAttachedTags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMetadata = async () => {
            if (!supabase || !snippetId) return;

            try {
                setLoading(true);
                const [entitiesRes, tagsRes] = await Promise.all([
                    supabase.from('snippet_entities').select('entity_id').eq('snippet_id', snippetId),
                    supabase.from('snippet_workspace_tags').select('tag_id').eq('snippet_id', snippetId)
                ]);

                if (entitiesRes.data) setAttachedEntities(entitiesRes.data.map(r => r.entity_id));
                if (tagsRes.data) setAttachedTags(tagsRes.data.map(r => r.tag_id));
            } catch (error) {
                console.error('Error loading snippet metadata:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMetadata();
    }, [snippetId]);

    const attachEntity = async (entityId) => {
        if (!supabase || !snippetId) return;

        // Optimistic update
        setAttachedEntities(prev => [...prev, entityId]);

        const { error } = await supabase
            .from('snippet_entities')
            .insert([{ snippet_id: snippetId, entity_id: entityId }]);

        if (error) {
            console.error('Error attaching entity:', error);
            setAttachedEntities(prev => prev.filter(id => id !== entityId));
        }
    };

    const detachEntity = async (entityId) => {
        if (!supabase || !snippetId) return;

        // Optimistic update
        setAttachedEntities(prev => prev.filter(id => id !== entityId));

        const { error } = await supabase
            .from('snippet_entities')
            .delete()
            .eq('snippet_id', snippetId)
            .eq('entity_id', entityId);

        if (error) {
            console.error('Error detaching entity:', error);
            setAttachedEntities(prev => [...prev, entityId]);
        }
    };

    const attachTag = async (tagId) => {
        if (!supabase || !snippetId) return;

        // Optimistic update
        setAttachedTags(prev => [...prev, tagId]);

        const { error } = await supabase
            .from('snippet_workspace_tags')
            .insert([{ snippet_id: snippetId, tag_id: tagId }]);

        if (error) {
            console.error('Error attaching tag:', error);
            setAttachedTags(prev => prev.filter(id => id !== tagId));
        }
    };

    const detachTag = async (tagId) => {
        if (!supabase || !snippetId) return;

        // Optimistic update
        setAttachedTags(prev => prev.filter(id => id !== tagId));

        const { error } = await supabase
            .from('snippet_workspace_tags')
            .delete()
            .eq('snippet_id', snippetId)
            .eq('tag_id', tagId);

        if (error) {
            console.error('Error detaching tag:', error);
            setAttachedTags(prev => [...prev, tagId]);
        }
    };

    return {
        attachedEntities,
        attachedTags,
        attachEntity,
        detachEntity,
        attachTag,
        detachTag,
        loading
    };
}
