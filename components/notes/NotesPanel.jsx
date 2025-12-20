'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PlusIcon, Square3Stack3DIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export function NotesPanel({ workspaceId, onOpenBoard }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const fetchBoards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notes_boards')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoards(data || []);
    } catch (err) {
      console.error('Error fetching boards:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      fetchBoards();

      // Subscribe to realtime changes
      const channel = supabase
        .channel(`notes_boards_${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notes_boards',
            filter: `workspace_id=eq.${workspaceId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setBoards(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setBoards(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
            } else if (payload.eventType === 'DELETE') {
              setBoards(prev => prev.filter(b => b.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [workspaceId, fetchBoards]);

  const handleCreateBoard = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const name = `Notes Board ${boards.length + 1}`;
      const { data, error } = await supabase
        .from('notes_boards')
        .insert({
          workspace_id: workspaceId,
          name: name,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      onOpenBoard(data.id);
    } catch (err) {
      console.error('Error creating board:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBoard = async (id) => {
    try {
      const { error } = await supabase
        .from('notes_boards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting board:', err);
    }
  };

  const handleRenameBoard = async (id) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('notes_boards')
        .update({ name: editingName.trim() })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      console.error('Error renaming board:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#191919]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] flex items-center gap-2">
          <Square3Stack3DIcon className="w-5 h-5" />
          Notes Boards
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCreateBoard}
          disabled={creating}
          className="h-8 w-8 p-0"
          title="Create new notes board"
        >
          <PlusIcon className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-8">
            <Square3Stack3DIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No notes boards yet
            </p>
            <Button
              size="sm"
              onClick={handleCreateBoard}
              disabled={creating}
              className="mx-auto"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create your first board
            </Button>
          </div>
        ) : (
          boards.map((board) => (
            <div
              key={board.id}
              className="group p-3 bg-gray-50 dark:bg-[#212121] rounded-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                {editingId === board.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameBoard(board.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameBoard(board.id);
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditingName('');
                      }
                    }}
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#3a3a3a] rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div
                    onClick={() => onOpenBoard(board.id)}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7] truncate">
                      {board.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(board.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(board.id);
                      setEditingName(board.name);
                    }}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                    title="Rename board"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(board);
                    }}
                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete board"
                  >
                    <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDeleteBoard(deleteConfirm.id)}
          title="Delete Notes Board"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This will permanently delete all notes and connections on this board.`}
          confirmText="Delete"
          confirmVariant="destructive"
        />
      )}
    </div>
  );
}
