-- Add weapon properties and range fields to inventory table
-- D&D 2024: weapons can have properties (versatile, finesse, two-handed, etc.) and range for ranged/thrown weapons

-- Add properties array (JSONB to store array of property strings)
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS properties JSONB DEFAULT '[]'::jsonb;

-- Add versatile weapon fields
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS damage_dice_versatile TEXT,
  ADD COLUMN IF NOT EXISTS versatile_usage TEXT CHECK (versatile_usage IN ('one-handed', 'two-handed'));

-- Add weapon range fields (only for ranged/thrown weapons)
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS weapon_range_normal INTEGER,
  ADD COLUMN IF NOT EXISTS weapon_range_long INTEGER;

-- Add comments to document the fields
COMMENT ON COLUMN inventory.properties IS 'Array of weapon properties: versatile, finesse, two-handed, light, heavy, reach, ranged, thrown, ammunition, loading';
COMMENT ON COLUMN inventory.damage_dice_versatile IS 'Damage dice when using versatile weapon with two hands (e.g., 1d10)';
COMMENT ON COLUMN inventory.versatile_usage IS 'Explicit usage mode for versatile weapons: one-handed or two-handed';
COMMENT ON COLUMN inventory.weapon_range_normal IS 'Normal range in feet for ranged/thrown weapons';
COMMENT ON COLUMN inventory.weapon_range_long IS 'Long range in feet for ranged weapons only';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_properties ON inventory USING GIN (properties);
CREATE INDEX IF NOT EXISTS idx_inventory_weapon_range ON inventory(weapon_range_normal, weapon_range_long) WHERE weapon_range_normal IS NOT NULL;
