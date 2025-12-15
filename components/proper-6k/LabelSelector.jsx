import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Plus, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function LabelSelector({ value = [], onChange, labels, onCreateLabel, className }) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewLabel, setShowNewLabel] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#808080');

    const selectedLabels = labels?.filter(l => value.includes(l.id)) || [];
    const filteredLabels = labels?.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const toggleLabel = (labelId) => {
        if (value.includes(labelId)) {
            onChange(value.filter(id => id !== labelId));
        } else {
            onChange([...value, labelId]);
        }
    };

    const handleCreateLabel = async () => {
        if (!newLabelName.trim() || !onCreateLabel) return;

        const newLabel = await onCreateLabel({
            name: newLabelName.trim(),
            color: newLabelColor
        });

        if (newLabel) {
            onChange([...value, newLabel.id]);
        }

        setNewLabelName('');
        setNewLabelColor('#808080');
        setShowNewLabel(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("justify-start gap-2", className)}
                >
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {selectedLabels.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                            {selectedLabels.map(label => (
                                <Badge
                                    key={label.id}
                                    variant="outline"
                                    style={{ borderColor: label.color, color: label.color }}
                                    className="text-xs"
                                >
                                    {label.name}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Select labels</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <div className="p-2 border-b">
                    <Input
                        placeholder="Search labels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8"
                    />
                </div>

                <div className="max-h-[200px] overflow-y-auto p-1">
                    {filteredLabels.length === 0 && !showNewLabel && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No labels found
                        </div>
                    )}

                    {filteredLabels.map(label => (
                        <button
                            key={label.id}
                            onClick={() => toggleLabel(label.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: label.color }}
                            />
                            <span className="flex-1 text-left">{label.name}</span>
                            {value.includes(label.id) && (
                                <Check className="w-4 h-4 text-primary" />
                            )}
                        </button>
                    ))}
                </div>

                {showNewLabel ? (
                    <div className="p-2 border-t space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Label name"
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                                className="h-8 flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateLabel();
                                    if (e.key === 'Escape') setShowNewLabel(false);
                                }}
                            />
                            <input
                                type="color"
                                value={newLabelColor}
                                onChange={(e) => setNewLabelColor(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleCreateLabel}
                                disabled={!newLabelName.trim()}
                                className="flex-1"
                            >
                                Create
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setShowNewLabel(false);
                                    setNewLabelName('');
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-1 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNewLabel(true)}
                            className="w-full justify-start gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create new label
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
