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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create new issue</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="Issue title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Add a description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    {/* Properties Row 1 */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Status */}
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <StatusSelector value={status} onChange={setStatus} />
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <PrioritySelector value={priority} onChange={setPriority} />
                        </div>
                    </div>

                    {/* Properties Row 2 */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Assignee */}
                        <div className="space-y-2">
                            <Label>Assignee</Label>
                            <AssigneeSelector
                                value={assigneeId}
                                onChange={setAssigneeId}
                                members={members}
                            />
                        </div>

                        {/* Project */}
                        <div className="space-y-2">
                            <Label>Project</Label>
                            <Select value={projectId || 'none'} onValueChange={(val) => setProjectId(val === 'none' ? null : val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No project</SelectItem>
                                    {projects.map(project => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.icon && <span className="mr-2">{project.icon}</span>}
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="space-y-2">
                        <Label>Labels</Label>
                        <LabelSelector
                            value={selectedLabels}
                            onChange={setSelectedLabels}
                            labels={labels}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-xs text-muted-foreground">
                            Press <kbd className="px-1.5 py-0.5 text-xs border rounded bg-muted">⌘</kbd> + <kbd className="px-1.5 py-0.5 text-xs border rounded bg-muted">Enter</kbd> to submit
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!title.trim() || loading}>
                                {loading ? 'Creating...' : 'Create issue'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
