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
import { statusConfig } from "./StatusSelector";
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

export function IssueRow({ issue, onClick, onDelete }) {
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
            className="group flex items-center justify-between py-2.5 px-3 bg-card hover:bg-accent/50 border border-border/40 dark:border-gray-600 hover:border-border dark:hover:border-gray-400 rounded-md transition-all cursor-pointer"
            onClick={() => onClick?.(issue)}
        >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                    <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                </div>

                {/* Issue ID */}
                <span className="text-xs font-mono text-muted-foreground dark:text-gray-400 min-w-[60px]">
                    {issueIdentifier}
                </span>

                {/* Priority Icon */}
                {issue.priority !== 'none' && (
                    <div className="flex-shrink-0">
                        <PriorityIcon className={`w-4 h-4 ${priorityInfo.color}`} />
                    </div>
                )}

                {/* Title */}
                <span className="text-sm font-medium text-foreground dark:text-white truncate pr-4 flex-1">
                    {issue.title}
                </span>
            </div>

            {/* Meta Info (labels, assignee, actions) */}
            <div className="flex items-center gap-3 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {/* Labels */}
                {issue.labels && issue.labels.length > 0 && (
                    <div className="flex gap-1">
                        {issue.labels.slice(0, 2).map((label) => (
                            <Badge
                                key={label.id}
                                variant="outline"
                                className="text-[10px] h-5 px-1.5 font-normal border-border dark:border-gray-500 bg-transparent dark:text-gray-300"
                                style={{ borderColor: label.color, color: label.color }}
                            >
                                {label.name}
                            </Badge>
                        ))}
                        {issue.labels.length > 2 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-5 px-1.5 font-normal border-border dark:border-gray-500 bg-transparent dark:text-gray-300"
                            >
                                +{issue.labels.length - 2}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Assignee */}
                {issue.assignee && (
                    <Avatar className="h-5 w-5">
                        <AvatarImage src={issue.assignee.avatar_url} />
                        <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                            {issue.assignee.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                )}

                {/* Actions Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleCopyLink}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onClick?.(issue);
                        }}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-red-600 dark:text-red-400"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete issue
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
