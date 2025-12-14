'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from '@/components/ui/badge';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useEntities } from '@/hooks/useEntities';
import { supabase } from '@/lib/supabase';
import AttachmentManager from '@/components/workspace/AttachmentManager';

export function CardEditModal({ card, isOpen, onClose, onUpdate, workspaceId }) {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [priority, setPriority] = useState(card.priority || 'medium');
    const [selectedTags, setSelectedTags] = useState(card.tags?.map(t => t.tag_id) || []);
    const [selectedEntities, setSelectedEntities] = useState(card.entities?.map(e => e.entity_id) || []);

    const { tags, entities } = useEntities(workspaceId);

    useEffect(() => {
        setTitle(card.title);
        setDescription(card.description || '');
        setPriority(card.priority || 'medium');
        setSelectedTags(card.tags?.map(t => t.tag_id) || []);
        setSelectedEntities(card.entities?.map(e => e.entity_id) || []);
    }, [card, isOpen]);

    const handleSave = async () => {
        try {
            // Update basic fields
            await onUpdate(card.id, { title, description, priority });

            // Update tags
            // First delete existing
            await supabase.from('kanban_card_tags').delete().eq('card_id', card.id);
            // Then insert new
            if (selectedTags.length > 0) {
                await supabase.from('kanban_card_tags').insert(
                    selectedTags.map(tagId => ({ card_id: card.id, tag_id: tagId }))
                );
            }

            // Update entities
            await supabase.from('kanban_card_entities').delete().eq('card_id', card.id);
            if (selectedEntities.length > 0) {
                await supabase.from('kanban_card_entities').insert(
                    selectedEntities.map(entityId => ({ card_id: card.id, entity_id: entityId }))
                );
            }

            onClose();
        } catch (error) {
            console.error('Error saving card:', error);
        }
    };

    const toggleTag = (tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const toggleEntity = (entityId) => {
        setSelectedEntities(prev =>
            prev.includes(entityId) ? prev.filter(id => id !== entityId) : [...prev, entityId]
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-[#e7e7e7]">Edit Card</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                            <RadioGroup value={priority} onValueChange={setPriority} className="flex flex-row gap-4 pt-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="low" id="priority-low" />
                                    <Label htmlFor="priority-low">Low</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="medium" id="priority-medium" />
                                    <Label htmlFor="priority-medium">Medium</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="high" id="priority-high" />
                                    <Label htmlFor="priority-high">High</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="urgent" id="priority-urgent" />
                                    <Label htmlFor="priority-urgent">Urgent</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">
                            {selectedTags.map(tagId => {
                                const tag = tags?.find(t => t.id === tagId);
                                if (!tag) return null;
                                return (
                                    <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-white flex items-center gap-1 pl-2 pr-1 py-1">
                                        {tag.name}
                                        <button onClick={() => toggleTag(tag.id)} className="hover:bg-black/20 rounded-full p-0.5 transition-colors">
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags?.filter(t => !selectedTags.includes(t.id)).map(tag => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 dark:border-[#444] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
                                    onClick={() => toggleTag(tag.id)}
                                >
                                    <PlusIcon className="w-3 h-3" />
                                    {tag.name}
                                </button>
                            ))}
                            {(!tags || tags.length === 0) && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">No tags available</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Entities</label>
                        <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">
                            {selectedEntities.map(entityId => {
                                const entity = entities?.find(e => e.id === entityId);
                                if (!entity) return null;
                                return (
                                    <Badge key={entity.id} variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center gap-1 pl-2 pr-1 py-1">
                                        {entity.name}
                                        <button onClick={() => toggleEntity(entity.id)} className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors">
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {entities?.filter(e => !selectedEntities.includes(e.id)).map(entity => (
                                <button
                                    key={entity.id}
                                    type="button"
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 dark:border-[#444] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
                                    onClick={() => toggleEntity(entity.id)}
                                >
                                    <PlusIcon className="w-3 h-3" />
                                    {entity.name}
                                </button>
                            ))}
                            {(!entities || entities.length === 0) && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">No entities available</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <AttachmentManager
                            workspaceId={workspaceId}
                            parentId={card.id}
                            parentType="card"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" className="bg-transparent border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave} className="bg-zinc-600 hover:bg-zinc-400 dark:bg-white dark:hover:text-white dark:hover:bg-zinc-500 text-white dark:text-black">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
