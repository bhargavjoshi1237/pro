'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-browser';
import { useState } from 'react';

/**
 * StartChatButton - Initiates a direct message with a user
 * 
 * Usage:
 * <StartChatButton userId="user-uuid" userName="John Doe" />
 */
export default function StartChatButton({
    userId,
    userName,
    variant = 'outline',
    size = 'sm',
    className = '',
    onChatCreated
}) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleStartChat = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            // Use the database helper function to create or get direct chat
            const { data: roomId, error } = await supabase
                .rpc('get_or_create_direct_chat', { other_user_id: userId });

            if (error) throw error;

            // Optionally notify parent component
            if (onChatCreated) {
                onChatCreated(roomId);
            }

            // You could also emit an event here that the ChatDrawer listens to
            // to automatically open the chat
            window.dispatchEvent(new CustomEvent('openChat', { detail: { roomId } }));

        } catch (error) {
            console.error('Error starting chat:', error);
            alert('Failed to start chat. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleStartChat}
            disabled={loading}
            className={className}
        >
            <MessageCircle className="w-4 h-4 mr-2" />
            {loading ? 'Opening...' : `Message ${userName || 'User'}`}
        </Button>
    );
}
