import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { PrioritySelector } from "./PrioritySelector";
import { StatusSelector } from "./StatusSelector";
import { LabelSelector } from "./LabelSelector";
import { AssigneeSelector } from "./AssigneeSelector";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function IssueCreateDialog({
    open,
    onOpenChange,
    onCreateIssue,
    projects,
    labels,
    members,
    defaultProject
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('backlog');
    const [priority, setPriority] = useState('none');
    const [assigneeId, setAssigneeId] = useState(null);
    const [projectId, setProjectId] = useState(defaultProject || null);
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            await onCreateIssue({
                title: title.trim(),
                description: description.trim() || null,
                status,
                priority,
                assignee_id: assigneeId,
                project_id: projectId
            }, selectedLabels);

            // Reset form
            setTitle('');
            setDescription('');
            setStatus('backlog');
            setPriority('none');
            setAssigneeId(null);
            setSelectedLabels([]);
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating issue:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-2xl border-border/50 dark:border-white/10 shadow-2xl rounded-[2rem] p-0 overflow-hidden">
                <DialogHeader className="px-8 pt-8 pb-4 border-b border-border/50 dark:border-white/5">
                    <DialogTitle className="text-2xl font-bold tracking-tight dark:text-white">Create new issue</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Title */}
                    <div className="space-y-3">
                        <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-gray-500 px-1">Title</Label>
                        <Input
                            id="title"
                            placeholder="What needs to be done?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            required
                            className="h-14 text-xl font-medium bg-muted/30 dark:bg-white/5 border-border/50 dark:border-white/10 rounded-2xl px-6 focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-gray-500 px-1">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Add more details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="resize-none bg-muted/30 dark:bg-white/5 border-border/50 dark:border-white/10 rounded-2xl p-6 text-base focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                        />
                    </div>

                    {/* Properties Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 bg-muted/20 dark:bg-white/5 p-6 rounded-3xl border border-border/30 dark:border-white/5">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-gray-500">Status</Label>
                            <StatusSelector value={status} onChange={setStatus} className="h-10 bg-background/50 dark:bg-black/20 border-border/50 dark:border-white/10 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-gray-500">Priority</Label>
                            <PrioritySelector value={priority} onChange={setPriority} className="h-10 bg-background/50 dark:bg-black/20 border-border/50 dark:border-white/10 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-gray-500">Assignee</Label>
                            <AssigneeSelector
                                value={assigneeId}
                                onChange={setAssigneeId}
                                members={members}
                                className="h-10 bg-background/50 dark:bg-black/20 border-border/50 dark:border-white/10 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-gray-500">Project</Label>
                            <Select value={projectId || 'none'} onValueChange={(val) => setProjectId(val === 'none' ? null : val)}>
                                <SelectTrigger className="h-10 bg-background/50 dark:bg-black/20 border-border/50 dark:border-white/10 rounded-xl">
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-[#0a0a0a] dark:border-white/10 rounded-xl">
                                    <SelectItem value="none" className="dark:focus:bg-white/5">No project</SelectItem>
                                    {projects.map(project => (
                                        <SelectItem key={project.id} value={project.id} className="dark:focus:bg-white/5">
                                            <div className="flex items-center gap-2">
                                                {project.icon && <span>{project.icon}</span>}
                                                <span>{project.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-gray-500 px-1">Labels</Label>
                        <LabelSelector
                            value={selectedLabels}
                            onChange={setSelectedLabels}
                            labels={labels}
                            className="h-12 bg-muted/30 dark:bg-white/5 border-border/50 dark:border-white/10 rounded-2xl"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-border/50 dark:border-white/5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 dark:text-gray-600">
                            <kbd className="px-1.5 py-0.5 border rounded-md bg-muted/50 dark:bg-white/5 dark:border-white/10 mr-1">⌘</kbd>
                            <kbd className="px-1.5 py-0.5 border rounded-md bg-muted/50 dark:bg-white/5 dark:border-white/10 mr-2">Enter</kbd>
                            to submit
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                                className="h-12 px-6 rounded-2xl font-semibold text-muted-foreground hover:text-foreground transition-all"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={!title.trim() || loading} 
                                className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                {loading ? 'Creating...' : 'Create issue'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
