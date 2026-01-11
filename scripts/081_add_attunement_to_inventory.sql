-- Add attunement field to inventory table
-- Allows tracking which items require attunement (D&D 5e rule: max 3 attuned items equipped)

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS attunement BOOLEAN DEFAULT false;

-- Add comment to document the field
COMMENT ON COLUMN inventory.attunement IS 'Whether the item requires attunement. Maximum 3 attuned items can be equipped at once.';

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_attunement ON inventory(attunement) WHERE attunement = true;
