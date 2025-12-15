'use client';

import { formatDistanceToNow } from 'date-fns';
import { ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export function HistoryPanel({ history = [], onLoad, loading }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                <ClockIcon className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No history yet.</p>
                <p className="text-xs opacity-70">Generated emails will appear here.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="space-y-4 p-1">
                {history.map((item) => (
                    <div
                        key={item.id}
                        className="bg-card border border-border rounded-lg p-3 hover:border-purple-500 transition-colors cursor-pointer group"
                        onClick={() => onLoad(item)}
                        style={{ backgroundColor: 'rgb(23, 23, 23)', borderColor: 'rgb(64, 64, 64)' }}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-sm text-card-foreground truncate pr-2">
                                {item.input_data.goal || 'Untitled Email'}
                            </h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {item.input_data.context}
                        </p>
                        <div className="flex gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                {item.input_data.tone}
                            </span>
                            {item.input_data.recipient_role && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                    {item.input_data.recipient_role}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
