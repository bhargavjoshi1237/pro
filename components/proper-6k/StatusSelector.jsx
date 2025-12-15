import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

export function StatusSelector({ value, onChange, className }) {
    const currentStatus = statusConfig[value] || statusConfig.backlog;
    const Icon = currentStatus.icon;

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={className}>
                <SelectValue>
                    <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${currentStatus.color}`} />
                        <span>{currentStatus.label}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => {
                    const StatusIcon = config.icon;
                    return (
                        <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                                <StatusIcon className={`w-4 h-4 ${config.color}`} />
                                <span>{config.label}</span>
                            </div>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}

export { statusConfig };
