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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from 'lucide-react';

export function AssigneeSelector({ value, onChange, members, className, variant = 'default' }) {
    const selectedMember = members?.find(m => m.id === value);

    if (variant === 'avatar') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all", className)}>
                        {selectedMember ? (
                            <Avatar className="h-6 w-6 border border-border/50 dark:border-white/10 shadow-sm">
                                <AvatarImage src={selectedMember.avatar_url} />
                                <AvatarFallback className="text-[9px] font-bold bg-muted/50 dark:bg-white/5 dark:text-gray-400">
                                    {selectedMember.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="h-6 w-6 rounded-full border border-dashed border-border/50 dark:border-white/10 flex items-center justify-center text-muted-foreground/50">
                                <User className="w-3 h-3" />
                            </div>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-border/50 dark:border-white/10 rounded-2xl shadow-2xl p-2">
                    <DropdownMenuItem 
                        onClick={() => onChange(null)}
                        className="rounded-xl focus:bg-primary/10 focus:text-primary dark:text-gray-300 cursor-pointer py-2.5"
                    >
                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">Unassigned</span>
                    </DropdownMenuItem>
                    {members?.map(member => (
                        <DropdownMenuItem 
                            key={member.id} 
                            onClick={() => onChange(member.id)}
                            className="rounded-xl focus:bg-primary/10 focus:text-primary dark:text-gray-300 cursor-pointer py-2.5"
                        >
                            <Avatar className="h-5 w-5 mr-2 border border-border/50 dark:border-white/10">
                                <AvatarImage src={member.avatar_url} />
                                <AvatarFallback className="text-[9px] font-bold">
                                    {member.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.display_name || 'Unknown'}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Select value={value || 'unassigned'} onValueChange={(val) => onChange(val === 'unassigned' ? null : val)}>
            <SelectTrigger className={cn("h-10 bg-white/50 dark:bg-white/5 border-border/50 dark:border-white/10 rounded-xl focus:ring-primary/20 transition-all", className)}>
                <SelectValue>
                    {selectedMember ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 border border-border/50 dark:border-white/10">
                                <AvatarImage src={selectedMember.avatar_url} />
                                <AvatarFallback className="text-[9px] font-bold bg-muted/50 dark:bg-white/5 dark:text-gray-400">
                                    {selectedMember.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{selectedMember.display_name || 'Unknown'}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground/60">
                            <User className="w-4 h-4" />
                            <span className="font-medium">Unassigned</span>
                        </div>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-border/50 dark:border-white/10 rounded-2xl shadow-2xl p-2">
                <SelectItem value="unassigned" className="rounded-xl focus:bg-primary/10 focus:text-primary dark:text-gray-500 cursor-pointer py-2.5">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">Unassigned</span>
                    </div>
                </SelectItem>
                {members?.map(member => (
                    <SelectItem key={member.id} value={member.id} className="rounded-xl focus:bg-primary/10 focus:text-primary dark:text-gray-300 cursor-pointer py-2.5">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 border border-border/50 dark:border-white/10">
                                <AvatarImage src={member.avatar_url} />
                                <AvatarFallback className="text-[9px] font-bold">
                                    {member.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.display_name || 'Unknown'}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
