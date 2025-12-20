# Notes Boards Feature

A collaborative, Mila Notes-inspired board system built with React Flow for the workspace.

## Overview

The Notes Boards feature allows workspace members to create visual, collaborative boards where they can add sticky notes, text cards, images, and links. All changes are synchronized in real-time across all users viewing the same board.

## Features

### Board Management
- Create multiple notes boards per workspace
- Rename boards
- Delete boards
- Real-time board list updates

### Note Types
1. **Sticky Notes** - Colorful post-it style notes
   - Editable text content
   - Color customization (Yellow, Pink, Green, Blue, Purple, Orange)
   - Drag and position anywhere on canvas

2. **Text Cards** - Structured content cards
   - Title and body text
   - Professional white card design
   - Perfect for longer content

3. **Images** - Visual elements
   - Add images via URL
   - Resizable image nodes
   - Great for mood boards and design

4. **Links** - Web references
   - Store URLs with titles
   - Clickable links that open in new tabs
   - Organize web resources

### Collaboration Features
- **Real-time Updates**: All changes sync instantly across all users
- **Active Users Display**: See who else is viewing the board
- **Live Presence**: Track active workspace members with avatars
- **Drag & Drop**: Move any note freely on the canvas
- **Connections**: Draw lines between notes to show relationships

### Canvas Features
- **Infinite Canvas**: Pan and zoom freely
- **Mini Map**: Navigate large boards easily
- **Grid Background**: Dots pattern for alignment
- **Controls**: Zoom in/out, fit to view
- **Multi-select**: Select multiple items (coming soon)

## Database Schema

### Tables

#### `notes_boards`
- `id` (UUID, PK)
- `workspace_id` (UUID, FK → workspaces)
- `name` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `created_by` (UUID, FK → auth.users)

#### `notes_items`
- `id` (UUID, PK)
- `board_id` (UUID, FK → notes_boards)
- `type` (TEXT) - 'sticky', 'text', 'image', 'link'
- `content` (JSONB) - Flexible content storage
- `position_x` (FLOAT)
- `position_y` (FLOAT)
- `width` (FLOAT)
- `height` (FLOAT)
- `z_index` (INTEGER)
- `style` (JSONB) - Colors, fonts, etc.
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `created_by` (UUID, FK → auth.users)

#### `notes_connections`
- `id` (UUID, PK)
- `board_id` (UUID, FK → notes_boards)
- `source_id` (UUID, FK → notes_items)
- `target_id` (UUID, FK → notes_items)
- `type` (TEXT) - 'default', 'step', 'smooth'
- `style` (JSONB)
- `created_at` (TIMESTAMPTZ)

### Security
- Row Level Security (RLS) enabled on all tables
- Policies restrict access to workspace members only
- Real-time subscriptions filtered by workspace_id

## Components

### `NotesPanel.jsx`
Lists all notes boards in a workspace. Provides board management UI.

**Props:**
- `workspaceId` - Current workspace ID
- `onOpenBoard` - Callback when board is selected

### `NotesBoard.jsx`
Main board component using React Flow for the canvas.

**Props:**
- `boardId` - Board to display
- `workspaceId` - Current workspace ID
- `userId` - Current user ID
- `onClose` - Callback to close board

### Node Components
- `StickyNoteNode.jsx` - Sticky note implementation
- `TextCardNode.jsx` - Text card implementation
- `ImageNode.jsx` - Image node implementation
- `LinkNode.jsx` - Link node implementation

All nodes support:
- In-place editing
- Deletion
- Connection handles (top/bottom)
- Hover toolbars

## Usage

### Access Notes
1. Click the **Notes** button in the workspace sidebar (green icon)
2. Or select from mobile bottom navigation

### Create a Board
1. Click the **+** button in the Notes panel
2. Board is created and opened automatically

### Add Items
1. Click the **+** FAB (Floating Action Button) on the board
2. Select item type: Sticky Note, Text Card, Image, or Link
3. Item appears in the center of your view

### Edit Items
- **Sticky Notes**: Click to edit text, use color picker to change color
- **Text Cards**: Click title or text area to edit
- **Images**: Click to add/edit image URL
- **Links**: Click title or URL to edit

### Connect Items
1. Click and drag from the circle handle at bottom of any item
2. Drop on another item to create a connection
3. Connections are saved automatically

### Move Items
- Click and drag any item to reposition
- Position is saved automatically

### Delete Items
- Hover over item
- Click trash icon in toolbar

## Real-time Collaboration

The Notes feature uses Supabase real-time subscriptions for live collaboration:

### Item Updates
- New items appear instantly for all viewers
- Moved items update positions in real-time
- Edited content syncs immediately
- Deleted items disappear for everyone

### Active Users
- User presence tracked via `active_sessions` table
- Shows avatars of active board viewers
- Updates every 5 seconds
- Session cleaned up on disconnect

### Connection Updates
- New connections appear immediately
- Deleted connections removed for all

## Mobile Support

The Notes feature is fully responsive:

- **Mobile Navigation**: Access from bottom navigation bar
- **Touch Gestures**: Pinch to zoom, two-finger pan
- **Full Screen Overlay**: Board uses entire screen on mobile
- **Touch-friendly**: Large touch targets for all interactions

## Performance Considerations

- Boards lazy-load items only when opened
- Real-time subscriptions are scoped to current board
- Subscriptions cleaned up on unmount
- Position updates debounced during drag

## Future Enhancements

Potential additions:
- Multi-select and bulk operations
- Copy/paste items
- Board templates
- Export to image/PDF
- Keyboard shortcuts
- Undo/redo
- Comments on items
- Item grouping
- Board permissions (view/edit)
- Search within board

## Migration

To set up the database tables, run the SQL migration file:
```
/migration/notes-boards-migration.sql
```

Execute this in your Supabase SQL Editor.

## Dependencies

- `reactflow@11.10.4` - Flow diagram library
- React 19.2.0
- Next.js 16.1.0
- Supabase (client & realtime)
- Tailwind CSS

## Browser Compatibility

Tested and working in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Items not appearing
- Check database RLS policies
- Verify workspace_id matches
- Check browser console for errors

### Real-time not working
- Verify Supabase realtime is enabled
- Check publication includes notes tables
- Ensure RLS policies allow SELECT

### Performance issues
- Limit items per board (~100 recommended)
- Clear browser cache
- Check network connection

## Credits

Inspired by Mila Notes (milanote.com)
Built with React Flow (reactflow.dev)
