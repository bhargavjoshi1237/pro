import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    Trash2,
    ExternalLink,
    Copy
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { statusConfig, StatusSelector } from "./StatusSelector";
import { PrioritySelector } from "./PrioritySelector";
import { AssigneeSelector } from "./AssigneeSelector";
import { formatDistanceToNow } from 'date-fns';
import {
    Circle,
    SignalLow,
    SignalMedium,
    SignalHigh,
    AlertTriangle
} from 'lucide-react';

const priorityConfig = {
    none: { icon: Circle, color: 'text-gray-400' },
    low: { icon: SignalLow, color: 'text-blue-500' },
    medium: { icon: SignalMedium, color: 'text-yellow-500' },
    high: { icon: SignalHigh, color: 'text-orange-500' },
    urgent: { icon: AlertTriangle, color: 'text-red-500' }
};

export function IssueRow({ issue, onClick, onDelete, onUpdate, members }) {
    const statusInfo = statusConfig[issue.status] || statusConfig.backlog;
    const StatusIcon = statusInfo.icon;

    const priorityInfo = priorityConfig[issue.priority] || priorityConfig.none;
    const PriorityIcon = priorityInfo.icon;

    const issueIdentifier = issue.project
        ? `${issue.project.key}-${issue.number}`
        : `ISS-${issue.number}`;

    const handleCopyLink = (e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/proper6k/issue/${issue.id}`;
        navigator.clipboard.writeText(url);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this issue?')) {
            onDelete?.(issue.id);
        }
    };

    return (
        <div
            className="group flex items-center justify-between py-4 px-6 bg-white/40 dark:bg-white/[0.02] hover:bg-white/60 dark:hover:bg-white/[0.05] border border-border/50 dark:border-white/5 rounded-2xl transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-none hover:-translate-y-0.5 active:scale-[0.99]"
            onClick={() => onClick?.(issue)}
        >
            <div className="flex items-center gap-4 overflow-hidden flex-1">
                {/* Status Selector */}
                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <StatusSelector
                        value={issue.status}
                        onChange={(status) => onUpdate?.(issue.id, { status })}
                        variant="icon"
                    />
                </div>

                {/* Issue ID & Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground/40 dark:text-gray-600 group-hover:text-muted-foreground/60 transition-colors">
                        {issueIdentifier}
                    </span>
                    <span className="text-sm font-semibold text-foreground/90 dark:text-gray-200 truncate group-hover:text-foreground transition-colors">
                        {issue.title}
                    </span>
                </div>
            </div>

            {/* Meta Info (labels, assignee, actions) */}
            <div className="flex items-center gap-6 flex-shrink-0">
                {/* Labels */}
                {issue.labels && issue.labels.length > 0 && (
                    <div className="hidden md:flex items-center gap-1.5">
                        {issue.labels.slice(0, 2).map((label) => (
                            <Badge
                                key={label.id}
                                variant="outline"
                                className="px-2 py-0 text-[10px] font-bold uppercase tracking-wider bg-white/50 dark:bg-white/5 border-border/50 dark:border-white/10 text-muted-foreground dark:text-gray-400 rounded-full"
                                style={{ borderColor: `${label.color}40`, color: label.color }}
                            >
                                {label.name}
                            </Badge>
                        ))}
                        {issue.labels.length > 2 && (
                            <span className="text-[10px] font-bold text-muted-foreground/40 px-1">
                                +{issue.labels.length - 2}
                            </span>
                        )}
                    </div>
                )}

                {/* Priority Selector */}
                <div className="hidden sm:block flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <PrioritySelector
                        value={issue.priority}
                        onChange={(priority) => onUpdate?.(issue.id, { priority })}
                        variant="icon"
                    />
                </div>

                {/* Assignee Selector */}
                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <AssigneeSelector
                        value={issue.assignee_id}
                        onChange={(assignee_id) => onUpdate?.(issue.id, { assignee_id })}
                        members={members}
                        variant="avatar"
                    />
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 text-muted-foreground/50 dark:text-gray-500 hover:text-foreground dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 transition-all"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-border/50 dark:border-white/10 rounded-2xl shadow-2xl p-2">
                        <DropdownMenuItem onClick={handleCopyLink} className="rounded-xl focus:bg-primary/10 focus:text-primary dark:text-gray-300 cursor-pointer py-2.5">
                            <Copy className="w-4 h-4 mr-2" />
                            <span className="font-medium">Copy link</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onClick?.(issue);
                        }} className="rounded-xl focus:bg-primary/10 focus:text-primary dark:text-gray-300 cursor-pointer py-2.5">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            <span className="font-medium">Open details</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-border/50 dark:bg-white/5" />
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="rounded-xl focus:bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer py-2.5"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span className="font-medium">Delete issue</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
