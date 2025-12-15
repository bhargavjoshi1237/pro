import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Circle,
    SignalLow,
    SignalMedium,
    SignalHigh,
    AlertTriangle
} from 'lucide-react';

const priorityConfig = {
    none: { label: 'None', icon: Circle, color: 'text-gray-400' },
    low: { label: 'Low', icon: SignalLow, color: 'text-blue-500' },
    medium: { label: 'Medium', icon: SignalMedium, color: 'text-yellow-500' },
    high: { label: 'High', icon: SignalHigh, color: 'text-orange-500' },
    urgent: { label: 'Urgent', icon: AlertTriangle, color: 'text-red-500' }
};

export function PrioritySelector({ value, onChange, className }) {
    const currentPriority = priorityConfig[value] || priorityConfig.none;
    const Icon = currentPriority.icon;

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={className}>
                <SelectValue>
                    <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${currentPriority.color}`} />
                        <span>{currentPriority.label}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {Object.entries(priorityConfig).map(([key, config]) => {
                    const PriorityIcon = config.icon;
                    return (
                        <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                                <PriorityIcon className={`w-4 h-4 ${config.color}`} />
                                <span>{config.label}</span>
                            </div>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
