-- Fix chat_rooms RLS policies to allow authenticated users to create rooms

-- Drop existing policies
DROP POLICY IF EXISTS "chat_rooms_insert" ON chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_select" ON chat_rooms;

-- Recreate with proper permissions
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
  );

CREATE POLICY "chat_rooms_insert" ON chat_rooms FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "chat_rooms_update" ON chat_rooms FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
  );

-- Also ensure chat_room_members policies are correct
DROP POLICY IF EXISTS "chat_room_members_insert" ON chat_room_members;

CREATE POLICY "chat_room_members_insert" ON chat_room_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- User can add themselves
      user_id = auth.uid() OR
      -- Or user is already a member of the room
      room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
    )
  );
