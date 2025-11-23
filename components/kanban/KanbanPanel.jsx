'use client';

import { useState, useEffect } from 'react';
import {
    PlusIcon,
    TrashIcon,
    ViewColumnsIcon,
    CalendarIcon,
    ClockIcon,
    PencilIcon,
    EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/supabase';

export function KanbanPanel({ workspaceId, onOpenBoard }) {
    const {
        boards,
        createBoard,
        updateBoard,
        deleteBoard,
        loading
    } = useKanban(workspaceId);

    const [newBoardName, setNewBoardName] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [renameBoardId, setRenameBoardId] = useState(null);
    const [renameBoardName, setRenameBoardName] = useState('');
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [members, setMembers] = useState({});

    useEffect(() => {
        const fetchMembers = async () => {
            const { data } = await supabase
                .from('workspace_members')
                .select('user_id, profiles(email, display_name, avatar_url)')
                .eq('workspace_id', workspaceId);

            if (data) {
                const membersMap = {};
                data.forEach(m => {
                    membersMap[m.user_id] = m.profiles;
                });
                setMembers(membersMap);
            }
        };
        fetchMembers();
    }, [workspaceId]);

    const handleCreateBoard = async () => {
        if (newBoardName.trim()) {
            await createBoard(newBoardName.trim());
            setNewBoardName('');
            setIsDialogOpen(false);
        }
    };

    const handleRenameBoard = async () => {
        if (renameBoardId && renameBoardName.trim()) {
            await updateBoard(renameBoardId, { name: renameBoardName.trim() });
            setRenameBoardId(null);
            setRenameBoardName('');
            setIsRenameDialogOpen(false);
        }
    };

    const openRenameDialog = (board) => {
        setRenameBoardId(board.id);
        setRenameBoardName(board.name);
        setIsRenameDialogOpen(true);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-[#2a2a2a]">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between shrink-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Project Boards</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-gray-400"
                            title="New Board"
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333]">
                        <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-[#e7e7e7]">Create New Board</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input
                                id="name"
                                placeholder="Board Name (e.g., Q4 Roadmap)"
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateBoard();
                                }}
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" className="bg-transparent border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleCreateBoard} className="bg-blue-600 hover:bg-blue-700 text-white">Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : boards.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mb-3">
                            <ViewColumnsIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No boards yet</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDialogOpen(true)}
                            className="text-xs text-gray-700 dark:text-gray-300 border-gray-300 dark:border-[#333]"
                        >
                            Create your first board
                        </Button>
                    </div>
                ) : (
                    boards.map((board) => {
                        const creator = members[board.created_by];
                        return (
                            <div
                                key={board.id}
                                className="group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-[#2a2a2a] border border-transparent hover:border-gray-200 dark:hover:border-[#333]"
                                onClick={() => onOpenBoard(board)}
                            >
                                <div className="flex items-start gap-3 truncate flex-1">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                        <ViewColumnsIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 truncate">
                                        <p className="truncate font-medium text-gray-900 dark:text-[#e7e7e7]">{board.name}</p>
                                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                Created by {creator?.display_name || creator?.email || 'Unknown'}
                                            </span>
                                            <span className="flex items-center gap-1 opacity-80">
                                                Cards: {board.card_count || 0} • Columns: {board.column_count || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#333] opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <EllipsisHorizontalIcon className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333]">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(board); }}>
                                            <PencilIcon className="w-4 h-4 mr-2" />
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this board?')) {
                                                    deleteBoard(board.id);
                                                }
                                            }}
                                        >
                                            <TrashIcon className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Rename Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333]">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-[#e7e7e7]">Rename Board</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input
                            value={renameBoardName}
                            onChange={(e) => setRenameBoardName(e.target.value)}
                            className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameBoard();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" className="bg-transparent border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleRenameBoard} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
