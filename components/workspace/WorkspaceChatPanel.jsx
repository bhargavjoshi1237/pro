'use client';

import { useState, useEffect } from 'react';
import {
    ChatBubbleLeftRightIcon,
    PlusIcon,
    ArrowLeftIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { AIChatSession } from './AIChatSession';
import { useWorkspace } from '@/hooks/useWorkspace';
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

export function WorkspaceChatPanel({ workspaceId, currentUserId }) {
    const {
        aiSessions,
        createAISession,
        deleteAISession
    } = useWorkspace(workspaceId);

    const [selectedSession, setSelectedSession] = useState(null);
    const [newChatName, setNewChatName] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleCreateChat = async () => {
        if (newChatName.trim()) {
            await createAISession(newChatName.trim());
            setNewChatName('');
            setIsDialogOpen(false);
        }
    };

    // If the selected session is deleted, go back to list
    useEffect(() => {
        if (selectedSession && !aiSessions.find(s => s.id === selectedSession.id)) {
            setSelectedSession(null);
        }
    }, [aiSessions, selectedSession]);

    if (selectedSession) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-[#2a2a2a]">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setSelectedSession(null)}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-gray-400"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] truncate flex-1">
                        {selectedSession.name}
                    </h2>
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                    <AIChatSession session={selectedSession} user={{ id: currentUserId }} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-[#2a2a2a]">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between shrink-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Workspace Chats</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-gray-400"
                            title="New Chat"
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333]">
                        <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-[#e7e7e7]">Create New Chat</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input
                                id="name"
                                placeholder="Chat Name (e.g., Project Brainstorming)"
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                                className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateChat();
                                }}
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" className="bg-transparent border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleCreateChat} className="bg-purple-600 hover:bg-purple-700 text-white">Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {aiSessions.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mb-3">
                            <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No chats yet</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDialogOpen(true)}
                            className="text-xs dark:text-gray-300 text-black"
                        >
                            Create your first chat
                        </Button>
                    </div>
                ) : (
                    aiSessions.map((session) => (
                        <div
                            key={session.id}
                            className="group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-300"
                            onClick={() => setSelectedSession(session)}
                        >
                            <div className="flex items-center gap-3 truncate flex-1">
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1 truncate">
                                    <p className="truncate font-medium text-gray-900 dark:text-[#e7e7e7]">{session.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {new Date(session.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this chat?')) {
                                        deleteAISession(session.id);
                                    }
                                }}
                                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#333] text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
