'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { useKanban } from '@/hooks/useKanban';
import { PlusIcon, EllipsisHorizontalIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function KanbanColumn({ column, cards, workspaceId, isOverlay }) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
        disabled: isOverlay, // Only disable when it's an overlay
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const { createCard, deleteColumn, updateColumn } = useKanban(workspaceId);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(column.title);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);

    const handleAddCard = async () => {
        if (newCardTitle.trim()) {
            setIsAddingCard(true);
            try {
                await createCard(column.id, newCardTitle.trim());
                setNewCardTitle('');
                setIsAddingCard(false);
            } catch (error) {
                console.error('Error creating card:', error instanceof Error ? error.message : JSON.stringify(error));
                setIsAddingCard(false);
                // Error toast is already shown by createCard
            }
        }
    };

    const handleUpdateTitle = async () => {
        if (title.trim() !== column.title) {
            await updateColumn(column.id, { title: title.trim() });
        }
        setIsEditingTitle(false);
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="w-80 shrink-0 h-[500px] bg-gray-100/50 dark:bg-[#191919]/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-[#333] opacity-50"
            />
        );
    }

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className="w-80 shrink-0 flex flex-col bg-gray-100 dark:bg-[#191919] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm h-full max-h-full"
            >
                {/* Column Header */}
                <div
                    {...attributes}
                    {...listeners}
                    className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-[#2a2a2a] cursor-grab active:cursor-grabbing group"
                >
                    <div className="flex items-center gap-2 flex-1">
                        {isEditingTitle ? (
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleUpdateTitle}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                                autoFocus
                                className="h-7 text-sm"
                            />
                        ) : (
                            <h3
                                onClick={() => setIsEditingTitle(true)}
                                className="font-semibold text-gray-700 dark:text-[#e7e7e7] text-sm truncate cursor-text"
                            >
                                {column.title}
                            </h3>
                        )}
                        <span className="bg-gray-200 dark:bg-[#2a2a2a] text-gray-500 text-xs px-2 py-0.5 rounded-full">
                            {cards.length}
                        </span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setIsDeleteOpen(true)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded text-gray-400 hover:text-red-500"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px]">
                    <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                        {cards.map((card) => (
                            <KanbanCard key={card.id} card={card} workspaceId={workspaceId} />
                        ))}
                    </SortableContext>

                    {isAddingCard ? (
                        <div className="bg-white dark:bg-[#212121] p-3 rounded-lg border border-blue-500 shadow-sm">
                            <textarea
                                placeholder="What needs to be done?"
                                value={newCardTitle}
                                onChange={(e) => setNewCardTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddCard();
                                    }
                                }}
                                autoFocus
                                className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 resize-none h-16 placeholder-gray-400"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => setIsAddingCard(false)}
                                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddCard}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingCard(true)}
                            className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-lg border border-dashed border-gray-300 dark:border-[#333] transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Card
                        </button>
                    )}
                </div>
            </div>

            <ConfirmDeleteModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={() => {
                    deleteColumn(column.id);
                    setIsDeleteOpen(false);
                }}
                title="Delete Column"
                description={`Are you sure you want to delete "${column.title}"? This will also delete all ${cards.length} card(s) in this column.`}
            />
        </>
    );
}
