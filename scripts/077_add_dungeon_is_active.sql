-- Add is_active column to dungeons table
-- This allows GMs to control which dungeons are visible/available to players
-- independently from their parent location

ALTER TABLE dungeons
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for faster queries filtering by active status
CREATE INDEX IF NOT EXISTS idx_dungeons_is_active ON dungeons(location_id, is_active);

-- Update existing dungeons to be active by default (if any exist)
UPDATE dungeons
SET is_active = TRUE
WHERE is_active IS NULL;

