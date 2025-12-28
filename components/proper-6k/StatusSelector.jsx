import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Circle,
    CheckCircle2,
    SignalMedium,
    Eye,
    XCircle,
    Archive
} from 'lucide-react';

const statusConfig = {
    backlog: { label: 'Backlog', icon: Archive, color: 'text-gray-400' },
    todo: { label: 'Todo', icon: Circle, color: 'text-gray-500' },
    in_progress: { label: 'In Progress', icon: SignalMedium, color: 'text-yellow-500' },
    in_review: { label: 'In Review', icon: Eye, color: 'text-purple-500' },
    done: { label: 'Done', icon: CheckCircle2, color: 'text-green-500' },
    canceled: { label: 'Canceled', icon: XCircle, color: 'text-gray-400' }
};

export function StatusSelector({ value, onChange, className, variant = 'default' }) {
    const currentStatus = statusConfig[value] || statusConfig.backlog;
    const Icon = currentStatus.icon;

    if (variant === 'icon') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all", className)}>
                        <Icon className={`w-5 h-5 ${currentStatus.color}`} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-border/50 dark:border-white/10 rounded-2xl shadow-2xl p-2">
                    {Object.entries(statusConfig).map(([key, config]) => {
                        const StatusIcon = config.icon;
                        return (
                            <DropdownMenuItem 
                                key={key} 
                                onClick={() => onChange(key)}
                                className="rounded-xl focus:bg-primary/10 focus:text-primary dark:text-gray-300 cursor-pointer py-2.5"
                            >
                                <StatusIcon className={`w-4 h-4 mr-2 ${config.color}`} />
                                <span className="font-medium">{config.label}</span>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={cn("h-10 bg-white/50 dark:bg-white/5 border-border/50 dark:border-white/10 rounded-xl focus:ring-primary/20 transition-all", className)}>
                <SelectValue>
                    <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${currentStatus.color}`} />
                        <span className="font-medium">{currentStatus.label}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-border/50 dark:border-white/10 rounded-2xl shadow-2xl p-2">
                {Object.entries(statusConfig).map(([key, config]) => {
                    const StatusIcon = config.icon;
                    return (
                        <SelectItem key={key} value={key} className="rounded-xl focus:bg-primary/10 focus:text-primary dark:text-gray-300 cursor-pointer py-2.5">
                            <div className="flex items-center gap-2">
                                <StatusIcon className={`w-4 h-4 ${config.color}`} />
                                <span className="font-medium">{config.label}</span>
                            </div>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}

export { statusConfig };
