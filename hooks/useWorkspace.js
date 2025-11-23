import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useWorkspace(workspaceId) {
  const [workspace, setWorkspace] = useState(null);
  const [folders, setFolders] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [aiSessions, setAiSessions] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (!supabase) return;

      try {
        setLoading(true);

        const [workspaceRes, foldersRes, snippetsRes, aiSessionsRes] = await Promise.all([
          supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
          supabase.from('folders').select('*').eq('workspace_id', workspaceId).order('name'),
          supabase.from('snippets').select('*').eq('workspace_id', workspaceId).order('updated_at', { ascending: false }),
          supabase.from('workspace_ai_sessions').select('*').eq('workspace_id', workspaceId).order('updated_at', { ascending: false })
        ]);

        if (workspaceRes.data) setWorkspace(workspaceRes.data);
        if (foldersRes.data) setFolders(foldersRes.data);
        if (snippetsRes.data) setSnippets(snippetsRes.data.map(s => ({ ...s, type: 'snippet' })));
        if (aiSessionsRes.data) setAiSessions(aiSessionsRes.data.map(s => ({ ...s, type: 'chat' })));
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
            if (prev.find(s => s.id === payload.new.id)) return prev;
            return [{ ...payload.new, type: 'snippet' }, ...prev];
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
          const updatedSnippet = { ...payload.new, type: 'snippet' };
          setSnippets((prev) => prev.map(s => s.id === payload.new.id ? updatedSnippet : s));
          setOpenTabs((prev) => prev.map(tab => tab.id === payload.new.id ? updatedSnippet : tab));
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

    // Subscribe to AI sessions changes
    const aiSessionsChannel = supabase
      .channel(`workspace_ai_sessions:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_ai_sessions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          setAiSessions((prev) => {
            if (prev.find(s => s.id === payload.new.id)) return prev;
            return [{ ...payload.new, type: 'chat' }, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workspace_ai_sessions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const updatedSession = { ...payload.new, type: 'chat' };
          setAiSessions((prev) => prev.map(s => s.id === payload.new.id ? updatedSession : s));
          // We don't update openTabs for chats anymore as they are not tabs
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'workspace_ai_sessions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          setAiSessions((prev) => prev.filter(s => s.id !== payload.old.id));
          // We don't update openTabs for chats anymore as they are not tabs
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(snippetsChannel);
      supabase.removeChannel(foldersChannel);
      supabase.removeChannel(aiSessionsChannel);
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
      const newSnippet = { ...data, type: 'snippet' };
      setSnippets([newSnippet, ...snippets]);
      openSnippet(newSnippet);
    }
  };

  const createAISession = async (name) => {
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('workspace_ai_sessions')
      .insert([{
        name,
        workspace_id: workspaceId,
        created_by: user.id
      }])
      .select()
      .single();

    if (!error && data) {
      const newSession = { ...data, type: 'chat' };
      setAiSessions([newSession, ...aiSessions]);
      // We don't automatically open chat in tabs anymore
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
      const updatedSnippet = { ...data, type: 'snippet' };
      setSnippets(snippets.map(s => s.id === id ? updatedSnippet : s));
      setOpenTabs(openTabs.map(tab => tab.id === id ? updatedSnippet : tab));
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

  const deleteAISession = async (id) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('workspace_ai_sessions')
      .delete()
      .eq('id', id);

    if (!error) {
      setAiSessions(aiSessions.filter(s => s.id !== id));
      // No tab to close
    }
  };

  const openSnippet = useCallback((snippet) => {
    const snippetWithType = { ...snippet, type: 'snippet' };
    if (!openTabs.find(tab => tab.id === snippet.id)) {
      setOpenTabs([...openTabs, snippetWithType]);
    }
    setActiveTabId(snippet.id);
  }, [openTabs]);

  const openChat = useCallback((session) => {
    // No-op for now as chats are in panel
  }, []);

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
      const updatedSnippet = { ...data, type: 'snippet' };
      setSnippets(snippets.map(s => s.id === snippetId ? updatedSnippet : s));
      setOpenTabs(openTabs.map(tab => tab.id === snippetId ? updatedSnippet : tab));
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
      const newSnippet = { ...data, type: 'snippet' };
      setSnippets([newSnippet, ...snippets]);
      openSnippet(newSnippet);
    }
  };

  return {
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
  };
}
