'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckIcon, ChevronUpDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function EntitySelector({
    value,
    onChange,
    placeholder,
    type,
    entities = [],
    onCreateEntity,
    disabled
}) {
    const [open, setOpen] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newEntityName, setNewEntityName] = useState('');
    const [newEntityContext, setNewEntityContext] = useState('');
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter entities by type
    const filteredEntities = entities.filter(e => e.type === type);

    const handleCreate = async () => {
        if (!newEntityName.trim()) return;

        setCreating(true);
        try {
            const newEntity = await onCreateEntity(newEntityName, type, newEntityContext);
            if (newEntity) {
                onChange(newEntity.name); // Or ID if you prefer, but form uses text currently
                setShowCreateDialog(false);
                setNewEntityName('');
                setNewEntityContext('');
                setOpen(false);
            }
        } catch (error) {
            console.error('Failed to create entity', error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
                        disabled={disabled}
                    >
                        {value || placeholder}
                        <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a]">
                    <Command>
                        <CommandInput
                            placeholder={`Search ${type}...`}
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2">
                                    <p className="text-sm text-gray-500 mb-2">No {type} found.</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setShowCreateDialog(true)}
                                    >
                                        <PlusIcon className="mr-2 h-4 w-4" />
                                        Create "{searchQuery || 'New'}"
                                    </Button>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {filteredEntities.map((entity) => (
                                    <CommandItem
                                        key={entity.id}
                                        value={entity.name}
                                        onSelect={(currentValue) => {
                                            onChange(currentValue === value ? "" : currentValue);
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                                    >
                                        <CheckIcon
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === entity.name ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{entity.name}</span>
                                            {entity.description && (
                                                <span className="text-xs text-gray-500 truncate max-w-[200px]">{entity.description}</span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            {filteredEntities.length > 0 && (
                                <div className="p-1 border-t border-gray-200 dark:border-[#2a2a2a]">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-xs"
                                        onClick={() => setShowCreateDialog(true)}
                                    >
                                        <PlusIcon className="mr-2 h-3 w-3" />
                                        Create New {type}
                                    </Button>
                                </div>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7]">
                    <DialogHeader>
                        <DialogTitle>Create New {type}</DialogTitle>
                        <DialogDescription>
                            Add a new {type} to your workspace for future use.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={newEntityName}
                                onChange={(e) => setNewEntityName(e.target.value)}
                                placeholder={`e.g., ${type === 'Role' ? 'Manager' : 'Boss'}`}
                                className="bg-white dark:bg-[#181818] border-gray-300 dark:border-[#2a2a2a]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="context">Context (Optional)</Label>
                            <Textarea
                                id="context"
                                value={newEntityContext}
                                onChange={(e) => setNewEntityContext(e.target.value)}
                                placeholder="Add extra context about this entity (e.g., 'Strict but fair', 'Always busy'). This will be used as background info."
                                className="bg-white dark:bg-[#181818] border-gray-300 dark:border-[#2a2a2a]"
                            />
                            <p className="text-xs text-gray-500">
                                Note: This context will have low relevance compared to your specific email goal.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-300 dark:border-[#2a2a2a]">
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={!newEntityName.trim() || creating} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {creating ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
