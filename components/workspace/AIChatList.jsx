'use client';

import { useState } from 'react';
import {
    ChatBubbleLeftRightIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
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

export function AIChatList({
    aiSessions,
    onOpenChat,
    onCreateChat,
    onDeleteChat,
    activeTabId
}) {
    const [newChatName, setNewChatName] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleCreateChat = () => {
        if (newChatName.trim()) {
            onCreateChat(newChatName.trim());
            setNewChatName('');
            setIsDialogOpen(false);
        }
    };

    return (
        <div className="mt-6">
            <div className="px-3 mb-2 flex items-center justify-between group">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Team Chats
                </h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
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

            <div className="space-y-0.5">
                {aiSessions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                        No chats yet
                    </div>
                ) : (
                    aiSessions.map((session) => (
                        <div
                            key={session.id}
                            className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${activeTabId === session.id
                                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                                }`}
                            onClick={() => onOpenChat(session)}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <ChatBubbleLeftRightIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{session.name}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this chat?')) {
                                        onDeleteChat(session.id);
                                    }
                                }}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#333] text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
