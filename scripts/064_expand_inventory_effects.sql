-- Expand inventory table with effect fields and category support
-- Adds support for potions, scrolls, wondrous items, and category-based organization

-- Add item category column
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS item_category TEXT;

-- Add equippable slot column (may already exist, but ensure it's there)
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS equippable_slot TEXT;

-- Add wondrous item type
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS wondrous_type TEXT;

-- Add potion effect fields
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS effect_dice TEXT,
  ADD COLUMN IF NOT EXISTS effect_type TEXT,
  ADD COLUMN IF NOT EXISTS effect_target TEXT;

-- Add scroll/spell fields
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS spell_level INTEGER CHECK (spell_level >= 0 AND spell_level <= 9),
  ADD COLUMN IF NOT EXISTS spell_name TEXT,
  ADD COLUMN IF NOT EXISTS spell_school TEXT;

-- Add wondrous effect description
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS effect_description TEXT;

-- Add combat stats fields (for consistency with shop_items)
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS damage_dice TEXT,
  ADD COLUMN IF NOT EXISTS damage_type TEXT,
  ADD COLUMN IF NOT EXISTS armor_class INTEGER;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_item_category ON inventory(item_category);
CREATE INDEX IF NOT EXISTS idx_inventory_wondrous_type ON inventory(wondrous_type);
CREATE INDEX IF NOT EXISTS idx_inventory_spell_level ON inventory(spell_level);

-- Add comments to document the schema
COMMENT ON COLUMN inventory.item_category IS 'Category of item: weapon, armor, potion, scroll, wondrous, tool, gear, consumable, treasure, equipment, other';
COMMENT ON COLUMN inventory.wondrous_type IS 'Type of wondrous item: ring, amulet, necklace, cloak, boots, belt, gloves, helmet, other';
COMMENT ON COLUMN inventory.effect_dice IS 'Effect dice notation for potions and consumables (e.g., 2d4+2 for healing)';
COMMENT ON COLUMN inventory.effect_type IS 'Type of effect: healing, temporary_hit_points, stat_buff, damage, condition_removal, other';
COMMENT ON COLUMN inventory.effect_target IS 'Target of the effect: self, other, area';
COMMENT ON COLUMN inventory.spell_level IS 'Spell level for scrolls (0-9)';
COMMENT ON COLUMN inventory.spell_name IS 'Name of the spell contained in the scroll';
COMMENT ON COLUMN inventory.spell_school IS 'School of magic: abjuration, conjuration, divination, enchantment, evocation, illusion, necromancy, transmutation';
COMMENT ON COLUMN inventory.effect_description IS 'Description of magical effects for wondrous items and other special items';
COMMENT ON COLUMN inventory.damage_dice IS 'Damage dice notation for weapons (e.g., 1d8, 2d6+3)';
COMMENT ON COLUMN inventory.damage_type IS 'Damage type: slashing, piercing, bludgeoning, fire, cold, lightning, thunder, poison, acid, necrotic, radiant, psychic, force';
COMMENT ON COLUMN inventory.armor_class IS 'Armor class bonus for armor items';

