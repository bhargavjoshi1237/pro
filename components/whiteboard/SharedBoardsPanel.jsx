'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PlusIcon, PresentationChartBarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '../LoadingSpinner';

export function SharedBoardsPanel({ workspaceId, onOpenBoard }) {
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchBoards = async () => {
        try {
            const { data, error } = await supabase
                .from('whiteboards')
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
    };

    useEffect(() => {
        if (workspaceId) {
            fetchBoards();
        }
    }, [workspaceId]);

    const handleCreateBoard = async () => {
        setCreating(true);
        try {
            const name = `Board ${boards.length + 1}`;
            const { data, error } = await supabase
                .from('whiteboards')
                .insert({
                    workspace_id: workspaceId,
                    name: name
                })
                .select()
                .single();

            if (error) throw error;
            setBoards([data, ...boards]);
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
                .from('whiteboards')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setBoards(boards.filter(b => b.id !== id));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting board:', err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#191919]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Shared Boards</h2>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCreateBoard}
                    disabled={creating}
                    className="h-8 w-8 p-0"
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
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <PresentationChartBarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No boards yet</p>
                        <Button onClick={handleCreateBoard} variant="link" className="mt-2">Create one</Button>
                    </div>
                ) : (
                    boards.map(board => (
                        <div
                            key={board.id}
                            className="group flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer bg-gray-50 dark:bg-[#212121]"
                            onClick={() => onOpenBoard(board.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-[#2a2a2a] rounded-md border border-gray-200 dark:border-[#333]">
                                    <PresentationChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">{board.name || 'Untitled Board'}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(board.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(board);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {deleteConfirm && (
                <ConfirmDialog
                    isOpen={true}
                    title="Delete Board"
                    message={`Are you sure you want to delete "${deleteConfirm.name}"? This cannot be undone.`}
                    onConfirm={() => handleDeleteBoard(deleteConfirm.id)}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}
        </div>
    );
}
