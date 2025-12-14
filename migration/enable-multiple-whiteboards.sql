-- Enable multiple whiteboards per workspace
-- Drop the unique constraint on workspace_id
ALTER TABLE whiteboards DROP CONSTRAINT IF EXISTS whiteboards_workspace_id_key;

-- Add name and created_by columns
ALTER TABLE whiteboards ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Untitled Board';
ALTER TABLE whiteboards ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing whiteboards to have a default name
UPDATE whiteboards SET name = 'Main Board' WHERE name IS NULL OR name = 'Untitled Board';

-- Add RLS policy for deleting (if not exists)
CREATE POLICY "whiteboards_delete"
  ON whiteboards FOR DELETE
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );
