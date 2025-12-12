-- Add column to indicate which slot this item can be equipped to
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS equippable_slot TEXT;

-- Create index for equippable slot queries
CREATE INDEX IF NOT EXISTS idx_inventory_equippable_slot ON inventory(equippable_slot);

-- Add comment explaining the field
COMMENT ON COLUMN inventory.equippable_slot IS 'Which equipment slot this item can be equipped to: head, neck, shoulders, body, hands, waist, ring, feet, weapon_main, weapon_off, or NULL if not equippable';

-- Update existing items to have equippable slots based on their type
-- This is optional and can be customized based on your needs
UPDATE inventory 
SET equippable_slot = 'weapon_main' 
WHERE item_type = 'weapon' AND equippable_slot IS NULL;

UPDATE inventory 
SET equippable_slot = 'body' 
WHERE item_type = 'armor' AND equippable_slot IS NULL;
