import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { PrioritySelector } from "./PrioritySelector";
import { StatusSelector } from "./StatusSelector";
import { AssigneeSelector } from "./AssigneeSelector";
import { LabelSelector } from "./LabelSelector";
import { Trash2, Send } from 'lucide-react';
import { supabase } from "@/lib/supabase";

export function IssueDetailPanel({
    issue,
    open,
    onOpenChange,
    onUpdateIssue,
    onDeleteIssue,
    labels,
    members,
    onCreateLabel,
    userId
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('backlog');
    const [priority, setPriority] = useState('none');
    const [assigneeId, setAssigneeId] = useState(null);
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    // Load issue data
    useEffect(() => {
        if (issue) {
            setTitle(issue.title || '');
            setDescription(issue.description || '');
            setStatus(issue.status || 'backlog');
            setPriority(issue.priority || 'none');
            setAssigneeId(issue.assignee_id);
            setSelectedLabels(issue.labels?.map(l => l.id) || []);
            loadComments();
        }
    }, [issue]);

    const loadComments = async () => {
        if (!issue || !supabase) return;

        setLoadingComments(true);
        try {
            const { data, error } = await supabase
                .from('proper6k_comments')
                .select(`
                    *,
                    user:user_id (
                        id,
                        display_name,
                        avatar_url
                    )
                `)
                .eq('issue_id', issue.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments(data || []);
        } catch (err) {
            console.error('Error loading comments:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleUpdate = async (field, value) => {
        if (!issue) return;

        try {
            await onUpdateIssue(issue.id, { [field]: value });
        } catch (error) {
            console.error('Error updating issue:', error);
        }
    };

    const handleTitleBlur = () => {
        if (title !== issue.title) {
            handleUpdate('title', title);
        }
    };

    const handleDescriptionBlur = () => {
        if (description !== issue.description) {
            handleUpdate('description', description);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !issue || !supabase) return;

        try {
            const { data, error } = await supabase
                .from('proper6k_comments')
                .insert([{
                    issue_id: issue.id,
                    user_id: userId,
                    content: newComment.trim()
                }])
                .select(`
                    *,
                    user:user_id (
                        id,
                        display_name,
                        avatar_url
                    )
                `)
                .single();

            if (error) throw error;

            setComments([...comments, data]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const issueIdentifier = issue?.project
        ? `${issue.project.key}-${issue.number}`
        : `ISS-${issue?.number}`;

    if (!issue) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-sm font-mono text-muted-foreground">
                        {issueIdentifier}
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Title */}
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            className="w-full text-2xl font-semibold bg-transparent border-none outline-none focus:ring-0 p-0"
                            placeholder="Issue title"
                        />
                    </div>

                    {/* Properties Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Status</label>
                            <StatusSelector
                                value={status}
                                onChange={(val) => {
                                    setStatus(val);
                                    handleUpdate('status', val);
                                }}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Priority</label>
                            <PrioritySelector
                                value={priority}
                                onChange={(val) => {
                                    setPriority(val);
                                    handleUpdate('priority', val);
                                }}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Assignee</label>
                            <AssigneeSelector
                                value={assigneeId}
                                onChange={(val) => {
                                    setAssigneeId(val);
                                    handleUpdate('assignee_id', val);
                                }}
                                members={members}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Labels</label>
                            <LabelSelector
                                value={selectedLabels}
                                onChange={async (newLabels) => {
                                    setSelectedLabels(newLabels);
                                    // Update labels via junction table
                                    // This is handled by the parent component
                                }}
                                labels={labels}
                                onCreateLabel={onCreateLabel}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleDescriptionBlur}
                            placeholder="Add a description..."
                            rows={6}
                            className="resize-none"
                        />
                    </div>

                    <Separator />

                    {/* Comments */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Comments</h3>

                        <div className="space-y-3">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarImage src={comment.user?.avatar_url} />
                                        <AvatarFallback className="text-xs">
                                            {comment.user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {comment.user?.display_name || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(comment.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* New Comment */}
                        <div className="flex gap-2">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                rows={2}
                                className="resize-none flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                        handleAddComment();
                                    }
                                }}
                            />
                            <Button
                                size="icon"
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Danger Zone */}
                    <div className="space-y-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this issue?')) {
                                    onDeleteIssue(issue.id);
                                    onOpenChange(false);
                                }
                            }}
                            className="w-full"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Issue
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
