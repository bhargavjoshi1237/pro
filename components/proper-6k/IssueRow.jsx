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
            role="button"
            tabIndex={0}
            aria-label={`Open issue ${issueIdentifier}`}
            className="group flex items-center justify-between py-3 px-4 bg-transparent hover:bg-white/5 rounded-lg border border-border/30 transition-colors cursor-pointer"
            onClick={() => onClick?.(issue)}
            onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(issue); }}
        >
            <div className="flex items-center gap-4 overflow-hidden flex-1 min-w-0">
                {/* Status strip */}
                <div className={`w-1 h-10 rounded-full ${statusInfo.color ? statusInfo.color.replace('text-', 'bg-') : 'bg-gray-400'}`} />

                {/* Status Selector */}
                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <StatusSelector
                        value={issue.status}
                        onChange={(status) => onUpdate?.(issue.id, { status })}
                        variant="icon"
                    />
                </div>

                {/* Issue ID & Title */}
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono tracking-widest text-muted-foreground/40 truncate">{issueIdentifier}</span>
                        <span className="text-sm font-semibold text-foreground/90 dark:text-gray-200 truncate">{issue.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[12px] text-muted-foreground/60 truncate">
                        {issue.project?.name && <span className="hidden sm:inline">{issue.project.name}</span>}
                        {issue.labels && issue.labels.length > 0 && (
                            <span className="hidden md:inline-flex items-center gap-2">
                                {issue.labels.slice(0,2).map(label => (
                                    <Badge key={label.id} className="text-[10px] font-bold uppercase" style={{ borderColor: `${label.color}40`, color: label.color }}>
                                        {label.name}
                                    </Badge>
                                ))}
                                {issue.labels.length > 2 && <span className="text-[10px]">+{issue.labels.length - 2}</span>}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Meta Info (priority, assignee, actions) */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
                    <PrioritySelector
                        value={issue.priority}
                        onChange={(priority) => onUpdate?.(issue.id, { priority })}
                        variant="icon"
                    />
                </div>

                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <AssigneeSelector
                        value={issue.assignee_id}
                        onChange={(assignee_id) => onUpdate?.(issue.id, { assignee_id })}
                        members={members}
                        variant="avatar"
                    />
                </div>

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
