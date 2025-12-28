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

export function PrioritySelector({ value, onChange, className, variant = 'default' }) {
    const currentPriority = priorityConfig[value] || priorityConfig.none;
    const Icon = currentPriority.icon;

    if (variant === 'icon') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all", className)}>
                        <Icon className={`w-5 h-5 ${currentPriority.color}`} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-border/50 dark:border-white/10 rounded-2xl shadow-2xl p-2">
                    {Object.entries(priorityConfig).map(([key, config]) => {
                        const PriorityIcon = config.icon;
                        return (
                            <DropdownMenuItem 
                                key={key} 
                                onClick={() => onChange(key)}
                                className="rounded-xl focus:bg-primary/10 focus:text-primary dark:text-gray-300 cursor-pointer py-2.5"
                            >
                                <PriorityIcon className={`w-4 h-4 mr-2 ${config.color}`} />
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
                        <Icon className={`w-4 h-4 ${currentPriority.color}`} />
                        <span className="font-medium">{currentPriority.label}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-border/50 dark:border-white/10 rounded-2xl shadow-2xl p-2">
                {Object.entries(priorityConfig).map(([key, config]) => {
                    const PriorityIcon = config.icon;
                    return (
                        <SelectItem key={key} value={key} className="rounded-xl focus:bg-primary/10 focus:text-primary dark:text-gray-300 cursor-pointer py-2.5">
                            <div className="flex items-center gap-2">
                                <PriorityIcon className={`w-4 h-4 ${config.color}`} />
                                <span className="font-medium">{config.label}</span>
                            </div>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
