-- Add new columns for equipment slots and containers
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS equipped_slot TEXT,
ADD COLUMN IF NOT EXISTS container_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_container BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS container_capacity NUMERIC(10, 2) DEFAULT 0 CHECK (container_capacity >= 0);

-- Create index for container queries
CREATE INDEX IF NOT EXISTS idx_inventory_container_id ON inventory(container_id);

-- Create index for equipped slots
CREATE INDEX IF NOT EXISTS idx_inventory_equipped_slot ON inventory(character_id, equipped_slot) WHERE equipped_slot IS NOT NULL;

-- Add comment explaining equipment slots
COMMENT ON COLUMN inventory.equipped_slot IS 'Equipment slot: head, neck, shoulders, body, hands, waist, ring_left, ring_right, feet, weapon_main, weapon_off, or NULL if not equipped';
COMMENT ON COLUMN inventory.is_container IS 'Whether this item can contain other items (backpack, bag, pouch)';
COMMENT ON COLUMN inventory.container_capacity IS 'Maximum weight this container can hold in pounds';
