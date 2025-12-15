# Chat System Implementation

## Overview
The chat system has been redesigned to use the Shadcn Drawer component and properly integrate with your database schema from `enhanced-features-migration.sql`.

## Database Schema

The chat system uses three main tables:

### 1. `chat_rooms`
- Stores chat rooms (direct or workspace-based)
- Fields:
  - `id`: UUID
  - `type`: 'direct' or 'workspace'
  - `workspace_id`: Reference to workspace (for workspace chats)
  - `name`: Optional name (for workspace chats)
  - `created_at`, `updated_at`: Timestamps

### 2. `chat_room_members`
- Links users to chat rooms
- Fields:
  - `id`: UUID
  - `room_id`: Reference to chat_rooms
  - `user_id`: Reference to auth.users
  - `last_read_at`: Timestamp for unread tracking
  - `created_at`: Timestamp

### 3. `chat_messages`
- Stores individual messages
- Fields:
  - `id`: UUID
  - `room_id`: Reference to chat_rooms
  - `user_id`: Reference to auth.users (sender)
  - `content`: Message text
  - `mentions`: Array of user IDs mentioned
  - `edited`: Boolean
  - `created_at`, `updated_at`: Timestamps

### 4. `profiles` (existing)
- User profile information
- Fields:
  - `id`: UUID (matches auth.users.id)
  - `email`: User email
  - `display_name`: Screen name
  - `avatar_url`: Profile picture URL

## Component Features

### ChatDrawer.jsx

The component has two main views:

#### 1. **Chat List View**
- Displays all conversations user is part of
- Shows:
  - Avatar (user avatar for direct chats, group icon for workspace chats)
  - Chat name (other user's name for direct, workspace name for groups)
  - Last message preview
  - Timestamp
  - Unread count (placeholder for future implementation)
- Features:
  - Search functionality to filter conversations
  - Click to open a conversation

#### 2. **Messages View**
- Displays messages for selected conversation
- Shows:
  - Back button to return to chat list
  - Chat header with avatar and name
  - Message bubbles (different styling for sent vs received)
  - Sender avatars and names (for group chats)
  - Timestamps
- Features:
  - Real-time message updates via Supabase subscriptions
  - Auto-scroll to bottom on new messages
  - Send messages with Enter key
  - Message input with send button

## Real-time Features

The component uses Supabase Realtime to subscribe to new messages:

```javascript
const channel = supabase
    .channel(`chat_room_${selectedRoom.id}`)
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${selectedRoom.id}`,
    }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
    })
    .subscribe();
```

## User Experience

### Direct Chats (1-on-1)
- Shows other user's avatar and name
- Simple, clean interface
- No sender name on message bubbles (obvious who sent what)

### Workspace Chats (Groups)
- Shows group icon
- Displays member count
- Shows sender names on each message bubble
- Useful for team collaboration

## Future Enhancements

The current implementation provides a solid foundation. Here are potential improvements:

1. **Unread Counts**: Track `last_read_at` in `chat_room_members` to show unread message counts
2. **Typing Indicators**: Use Supabase presence to show when others are typing
3. **Message Reactions**: Add emoji reactions to messages
4. **File Sharing**: Allow sending images and files
5. **Message Editing**: Implement edit functionality using the `edited` flag
6. **Message Deletion**: Soft delete messages
7. **User Mentions**: Parse and highlight @mentions using the `mentions` array
8. **Search Messages**: Add search within conversations
9. **Pinned Messages**: Pin important messages in workspace chats
10. **Read Receipts**: Show who has read messages in group chats

## Helper Functions Available

The database includes helper functions you can use:

### `get_or_create_direct_chat(other_user_id UUID)`
```sql
-- Creates or returns existing direct chat between current user and another user
SELECT get_or_create_direct_chat('user-uuid-here');
```

This is useful for starting a new direct message from elsewhere in the app (e.g., clicking "Message" on a user profile).

## Usage Example

To start a direct chat from another component:

```javascript
// In another component (e.g., UserProfile)
const startDirectMessage = async (otherUserId) => {
    const { data, error } = await supabase
        .rpc('get_or_create_direct_chat', { other_user_id: otherUserId });
    
    if (!error) {
        // Open chat drawer and select this room
        // You'd need to expose this via context or props
    }
};
```

## Testing

To test the chat:

1. Make sure you have run the `enhanced-features-migration.sql`
2. Create a chat room manually in the database (or use the helper function):
   ```sql
   -- Create a direct chat
   SELECT get_or_create_direct_chat('another-user-id');
   
   -- Or create a workspace chat
   INSERT INTO chat_rooms (type, workspace_id, name) 
   VALUES ('workspace', 'workspace-id', 'Team Chat');
   
   -- Add members
   INSERT INTO chat_room_members (room_id, user_id)
   VALUES 
       ('room-id', 'user-1-id'),
       ('room-id', 'user-2-id');
   ```
3. Click the purple chat button in the bottom-right corner
4. Select a conversation and start messaging!

## Styling

The component uses your existing design system:
- Purple accent color (`purple-600`, `purple-500`)
- Dark mode support with proper color tokens
- Glassmorphism effects matching your app
- Responsive design (works on mobile and desktop)
- Smooth animations and transitions
