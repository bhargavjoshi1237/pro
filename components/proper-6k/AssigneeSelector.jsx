import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from 'lucide-react';

export function AssigneeSelector({ value, onChange, members, className }) {
    const selectedMember = members?.find(m => m.id === value);

    return (
        <Select value={value || 'unassigned'} onValueChange={(val) => onChange(val === 'unassigned' ? null : val)}>
            <SelectTrigger className={className}>
                <SelectValue>
                    {selectedMember ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={selectedMember.avatar_url} />
                                <AvatarFallback className="text-[9px]">
                                    {selectedMember.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span>{selectedMember.display_name || 'Unknown'}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>Unassigned</span>
                        </div>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="unassigned">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>Unassigned</span>
                    </div>
                </SelectItem>
                {members?.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={member.avatar_url} />
                                <AvatarFallback className="text-[9px]">
                                    {member.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span>{member.display_name || 'Unknown'}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
