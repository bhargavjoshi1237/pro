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
                    className={cn("h-10 justify-start gap-2 bg-white/50 dark:bg-white/5 border-border/50 dark:border-white/10 rounded-xl focus:ring-primary/20 transition-all", className)}
                >
                    <Tag className="w-4 h-4 text-muted-foreground/60" />
                    {selectedLabels.length > 0 ? (
                        <div className="flex gap-1.5 flex-wrap">
                            {selectedLabels.map(label => (
                                <Badge
                                    key={label.id}
                                    variant="outline"
                                    style={{ borderColor: `${label.color}40`, color: label.color }}
                                    className="text-[10px] font-bold uppercase tracking-wider bg-white/50 dark:bg-white/5 rounded-full px-2 py-0"
                                >
                                    {label.name}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <span className="font-medium text-muted-foreground/60">Select labels</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-border/50 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden" align="start">
                <div className="p-3 border-b border-border/50 dark:border-white/5">
                    <Input
                        placeholder="Search labels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 bg-muted/30 dark:bg-white/5 border-border/50 dark:border-white/10 rounded-xl px-3 text-sm focus-visible:ring-primary/20 transition-all"
                    />
                </div>

                <div className="max-h-[240px] overflow-y-auto p-2 space-y-1">
                    {filteredLabels.length === 0 && !showNewLabel && (
                        <div className="p-8 text-center text-sm text-muted-foreground/60">
                            No labels found
                        </div>
                    )}

                    {filteredLabels.map(label => (
                        <button
                            key={label.id}
                            onClick={() => toggleLabel(label.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-all dark:text-gray-300 group"
                        >
                            <div 
                                className="w-3 h-3 rounded-full border border-white/20 shadow-sm" 
                                style={{ backgroundColor: label.color }} 
                            />
                            <span className="flex-1 text-left font-medium">{label.name}</span>
                            {value.includes(label.id) && (
                                <Check className="w-4 h-4 text-primary" />
                            )}
                        </button>
                    ))}
                </div>

                {showNewLabel ? (
                    <div className="p-4 space-y-4 border-t border-border/50 dark:border-white/5 bg-muted/20 dark:bg-white/[0.02]">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Label name"
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                                className="h-9 bg-background dark:bg-black/20 border-border/50 dark:border-white/10 rounded-xl flex-1"
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
                                className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-none p-0 overflow-hidden"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleCreateLabel}
                                disabled={!newLabelName.trim()}
                                className="flex-1 bg-primary text-white rounded-xl font-bold"
                            >
                                Create
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setShowNewLabel(false);
                                    setNewLabelName('');
                                }}
                                className="rounded-xl font-bold text-muted-foreground"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-1 border-t border-border/50 dark:border-white/5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNewLabel(true)}
                            className="w-full justify-start gap-2 py-5 px-4 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
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
