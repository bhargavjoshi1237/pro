import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useWorkspace(workspaceId) {
  const [workspace, setWorkspace] = useState(null);
  const [folders, setFolders] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (!supabase) return;

      try {
        setLoading(true);

        const [workspaceRes, foldersRes, snippetsRes] = await Promise.all([
          supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
          supabase.from('folders').select('*').eq('workspace_id', workspaceId).order('name'),
          supabase.from('snippets').select('*').eq('workspace_id', workspaceId).order('updated_at', { ascending: false })
        ]);

        if (workspaceRes.data) setWorkspace(workspaceRes.data);
        if (foldersRes.data) setFolders(foldersRes.data);
        if (snippetsRes.data) setSnippets(snippetsRes.data);
      } catch (error) {
        console.error('Error loading workspace:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      loadWorkspaceData();
    }
  }, [workspaceId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!supabase || !workspaceId) return;

    // Subscribe to snippets changes
    const snippetsChannel = supabase
      .channel(`snippets:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'snippets',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          setSnippets((prev) => {
            // Check if snippet already exists
            if (prev.find(s => s.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'snippets',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          setSnippets((prev) => prev.map(s => s.id === payload.new.id ? payload.new : s));
          setOpenTabs((prev) => prev.map(tab => tab.id === payload.new.id ? payload.new : tab));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'snippets',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          setSnippets((prev) => prev.filter(s => s.id !== payload.old.id));
          setOpenTabs((prev) => prev.filter(tab => tab.id !== payload.old.id));
        }
      )
      .subscribe();

    // Subscribe to folders changes
    const foldersChannel = supabase
      .channel(`folders:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'folders',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          setFolders((prev) => {
            if (prev.find(f => f.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'folders',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          setFolders((prev) => prev.map(f => f.id === payload.new.id ? payload.new : f));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'folders',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          setFolders((prev) => prev.filter(f => f.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(snippetsChannel);
      supabase.removeChannel(foldersChannel);
    };
  }, [workspaceId]);

  const createFolder = async (name) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('folders')
      .insert([{ name, workspace_id: workspaceId }])
      .select()
      .single();

    if (!error && data) {
      setFolders([...folders, data]);
    }
  };

  const createSnippet = async (title, folderId = null) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('snippets')
      .insert([{
        title,
        content: '',
        folder_id: folderId,
        workspace_id: workspaceId,
        word_count: 0,
        is_final: false
      }])
      .select()
      .single();

    if (!error && data) {
      setSnippets([data, ...snippets]);
      openSnippet(data);
    }
  };

  const updateSnippet = async (id, updates) => {
    if (!supabase) return;

    const wordCount = updates.content 
      ? updates.content.trim().split(/\s+/).filter(w => w.length > 0).length 
      : 0;

    const { data, error } = await supabase
      .from('snippets')
      .update({ ...updates, word_count: wordCount, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setSnippets(snippets.map(s => s.id === id ? data : s));
      setOpenTabs(openTabs.map(tab => tab.id === id ? data : tab));
    }
  };

  const deleteSnippet = async (id) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('snippets')
      .delete()
      .eq('id', id);

    if (!error) {
      setSnippets(snippets.filter(s => s.id !== id));
      closeTab(id);
    }
  };

  const deleteFolder = async (id) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (!error) {
      setFolders(folders.filter(f => f.id !== id));
      setSnippets(snippets.map(s => s.folder_id === id ? { ...s, folder_id: null } : s));
    }
  };

  const openSnippet = useCallback((snippet) => {
    if (!openTabs.find(tab => tab.id === snippet.id)) {
      setOpenTabs([...openTabs, snippet]);
    }
    setActiveTabId(snippet.id);
  }, [openTabs]);

  const closeTab = useCallback((tabId) => {
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    setOpenTabs(newTabs);
    
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    } else if (newTabs.length === 0) {
      setActiveTabId(null);
    }
  }, [openTabs, activeTabId]);

  const setActiveTab = useCallback((tabId) => {
    setActiveTabId(tabId);
  }, []);

  const reorderTabs = useCallback((newTabs) => {
    setOpenTabs(newTabs);
  }, []);

  const reorderSnippets = useCallback((reorderedSnippets) => {
    // Update the snippets array with new order
    const otherSnippets = snippets.filter(s => 
      !reorderedSnippets.find(rs => rs.id === s.id)
    );
    setSnippets([...reorderedSnippets, ...otherSnippets]);
  }, [snippets]);

  const moveSnippetToFolder = async (snippetId, folderId) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('snippets')
      .update({ folder_id: folderId })
      .eq('id', snippetId)
      .select()
      .single();

    if (!error && data) {
      setSnippets(snippets.map(s => s.id === snippetId ? data : s));
      setOpenTabs(openTabs.map(tab => tab.id === snippetId ? data : tab));
    }
  };

  const createFinalVersion = async (snippetId) => {
    if (!supabase) return;

    const snippet = snippets.find(s => s.id === snippetId);
    if (!snippet) return;

    const { data, error } = await supabase
      .from('snippets')
      .insert([{
        title: `${snippet.title} (Final)`,
        content: snippet.content,
        folder_id: snippet.folder_id,
        workspace_id: workspaceId,
        word_count: snippet.word_count,
        is_final: true,
        draft_id: snippetId
      }])
      .select()
      .single();

    if (!error && data) {
      setSnippets([data, ...snippets]);
      openSnippet(data);
    }
  };

  return {
    workspace,
    folders,
    snippets,
    openTabs,
    activeTabId,
    createFolder,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    deleteFolder,
    openSnippet,
    closeTab,
    setActiveTab,
    reorderTabs,
    reorderSnippets,
    moveSnippetToFolder,
    createFinalVersion,
    loading
  };
}
