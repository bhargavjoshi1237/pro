# Chat Integration Examples

## How to Start a Direct Message from Anywhere

The chat system provides multiple ways to initiate conversations from anywhere in your app.

### 1. Using the StartChatButton Component

The simplest method is to use the `StartChatButton` component:

```jsx
import StartChatButton from '@/components/chat/StartChatButton';

function UserProfile({ userId, userName }) {
    return (
        <div>
            <h2>{userName}</h2>
            <StartChatButton 
                userId={userId} 
                userName={userName}
                variant="outline"
                size="sm"
            />
        </div>
    );
}
```

### 2. Using Custom Events

You can programmatically open a chat by dispatching a custom event:

```javascript
// Open a chat by room ID
window.dispatchEvent(new CustomEvent('openChat', { 
    detail: { roomId: 'room-uuid-here' } 
}));
```

### 3. Using the API Route

Create a chat room via the API and then open it:

```javascript
async function startDirectMessage(otherUserId) {
    try {
        const response = await fetch('/api/chat-rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otherUserId }),
        });

        const { room, roomId } = await response.json();
        
        // Open the chat
        window.dispatchEvent(new CustomEvent('openChat', { 
            detail: { roomId: roomId || room.id } 
        }));
    } catch (error) {
        console.error('Error starting chat:', error);
    }
}
```

### 4. Using the Supabase Helper Function Directly

From any component with access to Supabase:

```javascript
import { createClient } from '@/lib/supabase-browser';

async function openDirectChat(otherUserId) {
    const supabase = createClient();
    
    const { data: roomId, error } = await supabase
        .rpc('get_or_create_direct_chat', { other_user_id: otherUserId });
    
    if (!error) {
        window.dispatchEvent(new CustomEvent('openChat', { 
            detail: { roomId } 
        }));
    }
}
```

## Example: Adding Chat to Workspace Members Component

Here's how you might add a "Message" button to each member in a workspace:

```jsx
'use client';

import { Users, Crown, Shield, Eye, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import StartChatButton from '@/components/chat/StartChatButton';

export default function WorkspaceMembers({ members, currentUserId }) {
    return (
        <div className="space-y-2">
            {members.map((member) => (
                <div 
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a]"
                >
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback>
                                {member.display_name?.charAt(0) || member.email?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                    {member.display_name || member.email}
                                </span>
                                {member.role === 'owner' && (
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                )}
                                {member.role === 'editor' && (
                                    <Shield className="w-3 h-3 text-blue-500" />
                                )}
                                {member.role === 'viewer' && (
                                    <Eye className="w-3 h-3 text-gray-400" />
                                )}
                            </div>
                            <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                    </div>
                    
                    {member.id !== currentUserId && (
                        <StartChatButton
                            userId={member.id}
                            userName={member.display_name}
                            variant="ghost"
                            size="sm"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
```

## Example: Creating Workspace Team Chats

You can also create workspace-wide team chats:

```javascript
async function createWorkspaceChat(workspaceId, chatName) {
    try {
        const response = await fetch('/api/chat-rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                workspaceId, 
                name: chatName || 'Team Chat' 
            }),
        });

        const { room } = await response.json();
        
        // Optionally add other members
        const supabase = createClient();
        const memberIds = ['user-1-id', 'user-2-id', 'user-3-id'];
        
        for (const memberId of memberIds) {
            await supabase
                .from('chat_room_members')
                .insert({
                    room_id: room.id,
                    user_id: memberId,
                });
        }
        
        // Open the chat
        window.dispatchEvent(new CustomEvent('openChat', { 
            detail: { roomId: room.id } 
        }));
    } catch (error) {
        console.error('Error creating workspace chat:', error);
    }
}
```

## Example: Chat Icon in User Menu

Add a quick chat shortcut to the user menu:

```jsx
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function UserMenuItem({ userId, userName, onClose }) {
    const handleClick = () => {
        window.dispatchEvent(new CustomEvent('openChat', { 
            detail: { userId } 
        }));
        onClose?.();
    };

    return (
        <button 
            onClick={handleClick}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
        >
            <MessageCircle className="w-4 h-4" />
            <span>Send Message</span>
        </button>
    );
}
```

## Testing Tips

1. **Test Direct Chats**: Click the "Message" button on any user profile
2. **Test Workspace Chats**: Create a workspace chat with multiple members
3. **Test Real-time**: Open the same chat on two different browsers/accounts
4. **Test Search**: Search for conversations in the chat list
5. **Test Mobile**: The drawer should work smoothly on mobile devices

Remember: The chat drawer is always accessible via the purple floating button in the bottom-right corner!
