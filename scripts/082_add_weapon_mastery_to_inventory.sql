-- Add weapon_mastery field to inventory table
-- D&D 2024 feature: weapons have mastery properties

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS weapon_mastery TEXT;

-- Add comment to document the field
COMMENT ON COLUMN inventory.weapon_mastery IS 'D&D 2024 Weapon Mastery property (e.g., Cleave, Graze, Nick, Push, Sap, Slow, Topple, Vex)';

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_weapon_mastery ON inventory(weapon_mastery) WHERE weapon_mastery IS NOT NULL;
