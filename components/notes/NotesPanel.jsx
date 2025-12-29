'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PlusIcon, 
  Square3Stack3DIcon, 
  TrashIcon, 
  PencilIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import LoadingSpinner from '../LoadingSpinner';

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
      let boardsData = data || [];

      // Enrich creators from profiles table when available
      const creatorIds = Array.from(new Set(boardsData.map(b => b.created_by).filter(Boolean)));
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id,full_name,avatar_url,email')
          .in('id', creatorIds);

        const profileMap = {};
        (profiles || []).forEach(p => { profileMap[p.id] = p; });
        boardsData = boardsData.map(b => ({ ...b, creator: profileMap[b.created_by] || null }));
      }

      setBoards(boardsData);
    } catch (err) {
      console.error('Error fetching boards:', err);
      setBoards([]);
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
          async (payload) => {
            try {
              if (payload.eventType === 'INSERT') {
                // fetch creator profile and enrich
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('id,full_name,avatar_url,email')
                  .eq('id', payload.new.created_by)
                  .maybeSingle();

                const newBoard = { ...payload.new, creator: profile || null };
                setBoards(prev => [newBoard, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('id,full_name,avatar_url,email')
                  .eq('id', payload.new.created_by)
                  .maybeSingle();

                const updated = { ...payload.new, creator: profile || null };
                setBoards(prev => prev.map(b => b.id === updated.id ? updated : b));
              } else if (payload.eventType === 'DELETE') {
                setBoards(prev => prev.filter(b => b.id !== payload.old.id));
              }
            } catch (err) {
              console.error('Realtime boards handler error:', err);
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
          <div className="flex justify-center py-8">
            <LoadingSpinner  />
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 dark:bg-[#212121]/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2a2a2a]">
            <Square3Stack3DIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3 opacity-50" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
              No notes boards yet
            </p>
            <Button
              size="sm"
              onClick={handleCreateBoard}
              disabled={creating}
              className="mx-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create your first board
            </Button>
          </div>
        ) : (
          boards.map((board) => (
            <div
              key={board.id}
              className="group p-4 bg-white dark:bg-[#212121] rounded-xl border border-gray-200 dark:border-[#2a2a2a] hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer relative"
              onClick={() => onOpenBoard(board.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
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
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full px-2 py-1 text-sm bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#3a3a3a] rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {board.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="w-5 h-5 border border-gray-200 dark:border-[#3a3a3a]">
                          <AvatarImage src={board.creator?.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            {(board.creator?.full_name || board.creator?.email || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {board.creator?.full_name || 'Unknown'} • {new Date(board.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#3a3a3a]">
                      <DropdownMenuItem 
                        onClick={() => {
                          setEditingId(board.id);
                          setEditingName(board.name);
                        }}
                        className="text-sm cursor-pointer"
                      >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteConfirm(board)}
                        className="text-sm cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
