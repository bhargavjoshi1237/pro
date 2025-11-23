'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useKanban } from '@/hooks/useKanban';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useEntities } from '@/hooks/useEntities';
import { Badge } from '@/components/ui/badge';
import { CardEditModal } from './CardEditModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { format } from 'date-fns';

export function KanbanCard({ card, workspaceId, isOverlay }) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: {
            type: 'Card',
            card,
        },
        disabled: isOverlay,
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const { deleteCard, updateCard } = useKanban(workspaceId);
    const { tags, entities } = useEntities(workspaceId);
    const [isHovered, setIsHovered] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-gray-50 dark:bg-[#2a2a2a] p-4 rounded-lg border-2 border-blue-500 opacity-50 h-[100px]"
            />
        );
    }

    // Resolve tags and entities
    const cardTags = card.tags?.map(ct => tags.find(t => t.id === ct.tag_id)).filter(Boolean) || [];
    const cardEntities = card.entities?.map(ce => entities.find(e => e.id === ce.entity_id)).filter(Boolean) || [];

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsEditOpen(true)}
                className="bg-white dark:bg-[#212121] p-4 rounded-lg shadow-sm border border-gray-200 dark:border-[#2a2a2a] cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative flex flex-col gap-3"
            >
                {/* Top Right: Tags & Entities */}
                <div className="flex flex-wrap gap-1 justify-end">
                    {cardTags.slice(0, 3).map(tag => (
                        <div key={tag.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} title={tag.name} />
                    ))}
                    {cardEntities.slice(0, 3).map(entity => (
                        <div key={entity.id} className="w-2 h-2 rounded-full bg-purple-400" title={entity.name} />
                    ))}
                    {(cardTags.length + cardEntities.length) > 6 && (
                        <span className="text-[10px] text-gray-400">+{cardTags.length + cardEntities.length - 6}</span>
                    )}
                </div>

                <h4 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7] break-words leading-relaxed">
                    {card.title}
                </h4>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                    {/* Bottom Left: Creator PFP */}
                    <div className="flex items-center gap-2">
                        {card.creator ? (
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white overflow-hidden shrink-0" title={card.creator.email}>
                                {card.creator.avatar_url ? (
                                    <img
                                        src={card.creator.avatar_url}
                                        alt="Creator"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerText = card.creator.email[0].toUpperCase();
                                        }}
                                    />
                                ) : (
                                    card.creator.email[0].toUpperCase()
                                )}
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#333] flex items-center justify-center text-[10px] text-gray-500 shrink-0">
                                ?
                            </div>
                        )}

                        {card.priority && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center h-5 ${card.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                card.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                    card.priority === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                {card.priority}
                            </span>
                        )}
                    </div>

                    {/* Bottom Right: Time */}
                    <div className="text-[10px] text-gray-400 flex items-center h-6">
                        {format(new Date(card.created_at), 'MMM d, h:mm a')}
                    </div>
                </div>

                {/* Actions */}
                <div className={`absolute top-2 right-2 flex gap-1 transition-opacity ${isHovered || isOverlay ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditOpen(true);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-400 hover:text-blue-500 bg-white dark:bg-[#212121] shadow-sm"
                    >
                        <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDeleteOpen(true);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-400 hover:text-red-500 bg-white dark:bg-[#212121] shadow-sm"
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <CardEditModal
                card={card}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onUpdate={updateCard}
                workspaceId={workspaceId}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={() => deleteCard(card.id)}
                title="Delete Card"
                description="Are you sure you want to delete this card? This action cannot be undone."
            />
        </>
    );
}
