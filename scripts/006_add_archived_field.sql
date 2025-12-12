-- Add archived field to characters table
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_characters_archived ON characters(archived);
