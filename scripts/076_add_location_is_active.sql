-- Add is_active column to locations table
-- This allows GMs to control which locations are visible/available to players
-- as the campaign progresses

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for faster queries filtering by active status
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(campaign_id, is_active);

-- Update existing locations to be active by default (if any exist)
UPDATE locations
SET is_active = TRUE
WHERE is_active IS NULL;

