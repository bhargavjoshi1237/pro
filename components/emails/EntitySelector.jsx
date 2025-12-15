'use client';

import { useState } from 'react';
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
                onChange(newEntity.name);
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
                        className="w-full justify-between mt-4"
                        disabled={disabled}
                        style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}
                    >
                        {value || placeholder}
                        <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
                    <Command style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)' }}>
                        <CommandInput
                            placeholder={`Search ${type}...`}
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2">
                                    <p className="text-sm text-muted-foreground mb-2">No {type} found.</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setShowCreateDialog(true)}
                                    >
                                        <PlusIcon className="mr-2 h-4 w-4" />
                                        Create &quot;{searchQuery || 'New'}&quot;
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
                                        className="cursor-pointer"
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
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{entity.description}</span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            {filteredEntities.length > 0 && (
                                <div className="p-1 border-t border-border">
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
                <DialogContent style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
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
                                style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="context">Context (Optional)</Label>
                            <Textarea
                                id="context"
                                value={newEntityContext}
                                onChange={(e) => setNewEntityContext(e.target.value)}
                                placeholder="Add extra context about this entity (e.g., 'Strict but fair', 'Always busy'). This will be used as background info."
                                style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}
                            />
                            <p className="text-xs text-muted-foreground">
                                Note: This context will have low relevance compared to your specific email goal.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)} style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={!newEntityName.trim() || creating}>
                            {creating ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
