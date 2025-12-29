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
import { Trash2, Send, X } from 'lucide-react';
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
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-l border-border/50 dark:border-[#2a2a2a]/50 shadow-2xl">
                <SheetHeader className="pb-3 border-b border-border/50 dark:border-[#2a2a2a]/50">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <SheetTitle className="text-xs font-mono text-muted-foreground dark:text-gray-500 tracking-wider uppercase">
                                {issueIdentifier}
                            </SheetTitle>
                            <div className="mt-1 text-xl font-bold leading-tight dark:text-white">{title}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-2">
                                <StatusSelector
                                    value={status}
                                    onChange={(val) => {
                                        setStatus(val);
                                        handleUpdate('status', val);
                                    }}
                                    className="h-9" />
                                <PrioritySelector
                                    value={priority}
                                    onChange={(val) => {
                                        setPriority(val);
                                        handleUpdate('priority', val);
                                    }}
                                    className="h-9" />
                                <AssigneeSelector
                                    value={assigneeId}
                                    onChange={(val) => {
                                        setAssigneeId(val);
                                        handleUpdate('assignee_id', val);
                                    }}
                                    members={members}
                                    className="h-9" />
                            </div>

                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} title="Close">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </SheetHeader>

                <div className="mt-8 space-y-8">
                    {/* Title */}
                    <div className="group">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            className="w-full text-3xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 dark:text-white placeholder:text-muted-foreground/30 transition-all"
                            placeholder="Issue title"
                        />
                    </div>

                    {/* Properties Grid - compact */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-4 rounded-lg bg-transparent border border-border/20">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
                            <StatusSelector
                                value={status}
                                onChange={(val) => {
                                    setStatus(val);
                                    handleUpdate('status', val);
                                }}
                                className="h-9"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Priority</label>
                            <PrioritySelector
                                value={priority}
                                onChange={(val) => {
                                    setPriority(val);
                                    handleUpdate('priority', val);
                                }}
                                className="h-9"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assignee</label>
                            <AssigneeSelector
                                value={assigneeId}
                                onChange={(val) => {
                                    setAssigneeId(val);
                                    handleUpdate('assignee_id', val);
                                }}
                                members={members}
                                className="h-9"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Labels</label>
                            <LabelSelector
                                value={selectedLabels}
                                onChange={async (newLabels) => {
                                    setSelectedLabels(newLabels);
                                }}
                                labels={labels}
                                onCreateLabel={onCreateLabel}
                                className="h-9"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleDescriptionBlur}
                            placeholder="Add a detailed description..."
                            rows={6}
                            className="resize-none bg-muted/10 dark:bg-white/5 border border-border/20 rounded-lg p-3 text-base leading-relaxed dark:text-gray-200 placeholder:text-muted-foreground/30"
                        />
                    </div>

                    <Separator className="bg-border/50 dark:bg-white/5" />

                    {/* Comments Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-gray-500">Discussion</h3>
                            <Badge variant="outline" className="text-[10px] font-mono bg-transparent border-border/50 dark:border-white/10">
                                {comments.length}
                            </Badge>
                        </div>

                        <div className="space-y-6">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-4 group/comment">
                                    <Avatar className="h-9 w-9 flex-shrink-0 border border-border/50 dark:border-white/10 shadow-sm">
                                        <AvatarImage src={comment.user?.avatar_url} />
                                        <AvatarFallback className="text-xs bg-muted dark:bg-white/5 dark:text-gray-400">
                                            {comment.user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold dark:text-white">
                                                {comment.user?.display_name || 'Unknown'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60 dark:text-gray-500 font-medium">
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-sm text-foreground/80 dark:text-gray-300 leading-relaxed bg-white/5 dark:bg-white/5 p-3 rounded-lg border border-border/20">
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* New Comment Input */}
                        <div className="relative mt-4 group">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                rows={3}
                                className="resize-none w-full bg-muted/10 dark:bg-white/5 border border-border/20 rounded-lg p-3 pr-12 text-sm focus-visible:ring-primary/20 transition-all"
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
                                className="absolute right-3 bottom-3 h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow transition-all disabled:opacity-0 disabled:scale-90"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="pt-8 pb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this issue?')) {
                                    onDeleteIssue(issue.id);
                                    onOpenChange(false);
                                }
                            }}
                            className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/5 rounded-xl transition-all"
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
