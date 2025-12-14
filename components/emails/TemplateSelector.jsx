'use client';

import { useState } from 'react';
import { ChevronUpDownIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
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

export function TemplateSelector({
    onSelect,
    onSave,
    templates = [],
    onDelete,
    disabled
}) {
    const [open, setOpen] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSave = () => {
        if (!templateName.trim()) return;
        onSave(templateName);
        setTemplateName('');
        setShowSaveDialog(false);
        setOpen(false);
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-background text-foreground border-input"
                        disabled={disabled}
                    >
                        Load Template...
                        <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-popover text-popover-foreground border-input">
                    <Command>
                        <CommandInput
                            placeholder="Search templates..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2">
                                    <p className="text-sm text-muted-foreground mb-2">No templates found.</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setShowSaveDialog(true)}
                                    >
                                        <PlusIcon className="mr-2 h-4 w-4" />
                                        Save Current as Template
                                    </Button>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {templates.map((template) => (
                                    <CommandItem
                                        key={template.id}
                                        value={template.name}
                                        onSelect={() => {
                                            onSelect(template);
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground flex justify-between group"
                                    >
                                        <span>{template.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(template.id);
                                            }}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <div className="p-1 border-t border-border">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-xs"
                                    onClick={() => setShowSaveDialog(true)}
                                >
                                    <PlusIcon className="mr-2 h-3 w-3" />
                                    Save Current as Template
                                </Button>
                            </div>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="bg-background border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle>Save Template</DialogTitle>
                        <DialogDescription>
                            Save the current form state as a template for future use.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Template Name</Label>
                            <Input
                                id="name"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="e.g., Monthly Report, Sick Leave"
                                className="bg-background border-input"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="border-border">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!templateName.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
