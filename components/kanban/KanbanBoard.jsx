'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useKanban } from '@/hooks/useKanban';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export default function KanbanBoard({ board, workspaceId, onClose }) {
    const {
        columns,
        cards,
        createColumn,
        updateColumn,
        moveCard,
        reorderColumns,
        setActiveBoard,
        loading
    } = useKanban(workspaceId);

    useEffect(() => {
        if (board) {
            setActiveBoard(board);
        }
    }, [board, setActiveBoard]);

    const [activeId, setActiveId] = useState(null);
    const [activeColumn, setActiveColumn] = useState(null);
    const [activeCard, setActiveCard] = useState(null);
    const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10, // 10px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columnIds = useMemo(() => columns.map((col) => col.id), [columns]);

    const onDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);

        if (active.data.current?.type === 'Column') {
            setActiveColumn(active.data.current.column);
            return;
        }

        if (active.data.current?.type === 'Card') {
            setActiveCard(active.data.current.card);
            return;
        }
    };

    const onDragEnd = async (event) => {
        setActiveId(null);
        setActiveColumn(null);
        setActiveCard(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveAColumn = active.data.current?.type === 'Column';

        if (isActiveAColumn) {
            // Column reordering
            const activeColumnIndex = columns.findIndex(col => col.id === activeId);
            const overColumnIndex = columns.findIndex(col => col.id === overId);

            if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
                const newColumns = arrayMove(columns, activeColumnIndex, overColumnIndex);
                const reorderedColumns = newColumns.map((col, index) => ({
                    ...col,
                    position: index
                }));
                await reorderColumns(reorderedColumns);
            }
            return;
        }

        // Card handling
        const activeCardData = active.data.current?.card;
        const overCardData = over.data.current?.card;
        const overColumnData = over.data.current?.column;

        if (activeCardData) {
            const sourceColumnId = activeCardData.column_id;
            let destColumnId;
            let newIndex;

            if (overCardData) {
                // Dropped over another card
                destColumnId = overCardData.column_id;
                const destColumnCards = cards.filter(c => c.column_id === destColumnId).sort((a, b) => a.position - b.position);
                const overIndex = destColumnCards.findIndex(c => c.id === overId);
                newIndex = overIndex;
            } else if (overColumnData) {
                // Dropped over a column (empty space)
                destColumnId = overColumnData.id;
                const destColumnCards = cards.filter(c => c.column_id === destColumnId);
                newIndex = destColumnCards.length;
            } else {
                return;
            }

            await moveCard(activeId, sourceColumnId, destColumnId, newIndex);
        }
    };

    const onDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveACard = active.data.current?.type === 'Card';
        if (!isActiveACard) return;
    };

    const handleCreateColumn = async () => {
        if (newColumnTitle.trim()) {
            await createColumn(board.id, newColumnTitle.trim());
            setNewColumnTitle('');
            setIsCreateColumnOpen(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#f8f9fa] dark:bg-[#111]">
            {/* Header */}
            <div className="h-16 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#191919] flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-[#e7e7e7]">{board.name}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {board.description || 'Manage your tasks efficiently'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-gray-50 dark:bg-[#0a0a0a]">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                >
                    <div className="flex h-full gap-6 items-start">
                        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                            {columns.map((col) => (
                                <KanbanColumn
                                    key={col.id}
                                    column={col}
                                    cards={cards.filter(c => c.column_id === col.id).sort((a, b) => a.position - b.position)}
                                    workspaceId={workspaceId}
                                />
                            ))}
                        </SortableContext>

                        {/* Add Column Button */}
                        <button
                            onClick={() => setIsCreateColumnOpen(true)}
                            className="w-80 shrink-0 h-14 flex items-center justify-center gap-2 bg-white/50 dark:bg-[#191919]/50 hover:bg-white dark:hover:bg-[#191919] rounded-xl border border-dashed border-gray-300 dark:border-[#333] text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-all backdrop-blur-sm"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Column
                        </button>
                    </div>

                    {createPortal(
                        <DragOverlay dropAnimation={dropAnimation}>
                            {activeColumn && (
                                <KanbanColumn
                                    column={activeColumn}
                                    cards={cards.filter(c => c.column_id === activeColumn.id).sort((a, b) => a.position - b.position)}
                                    workspaceId={workspaceId}
                                    isOverlay
                                />
                            )}
                            {activeCard && (
                                <KanbanCard
                                    card={activeCard}
                                    isOverlay
                                />
                            )}
                        </DragOverlay>,
                        document.body
                    )}
                </DndContext>
            </div>

            {/* Create Column Dialog */}
            <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333]">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-[#e7e7e7]">Add New Column</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input
                            placeholder="Column Title"
                            value={newColumnTitle}
                            onChange={(e) => setNewColumnTitle(e.target.value)}
                            className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateColumn();
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" className="bg-transparent border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleCreateColumn} className="bg-blue-600 hover:bg-blue-700 text-white">Add Column</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
