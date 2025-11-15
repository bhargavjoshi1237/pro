import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useSnippets() {
  const [folders, setFolders] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [activeSnippet, setActiveSnippet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        console.warn('Supabase not configured');
        setLoading(false);
        return;
      }

      const [foldersRes, snippetsRes] = await Promise.all([
        supabase.from('folders').select('*').order('created_at', { ascending: true }),
        supabase.from('snippets').select('*').order('updated_at', { ascending: false })
      ]);

      if (foldersRes.data) setFolders(foldersRes.data);
      if (snippetsRes.data) setSnippets(snippetsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('folders')
      .insert([{ name }])
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
        word_count: 0
      }])
      .select()
      .single();

    if (!error && data) {
      setSnippets([data, ...snippets]);
      setActiveSnippet(data);
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
      setActiveSnippet(data);
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
      if (activeSnippet?.id === id) {
        setActiveSnippet(null);
      }
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

  const selectSnippet = (snippet) => {
    setActiveSnippet(snippet);
  };

  return {
    folders,
    snippets,
    activeSnippet,
    createFolder,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    deleteFolder,
    selectSnippet,
    loading
  };
}
