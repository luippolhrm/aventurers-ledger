-- Expand shop_items table with effect fields and equippable slot support
-- Adds support for potions, scrolls, wondrous items, and equipment slots

-- Add equippable slot column
ALTER TABLE shop_items
  ADD COLUMN IF NOT EXISTS equippable_slot TEXT;

-- Add wondrous item type
ALTER TABLE shop_items
  ADD COLUMN IF NOT EXISTS wondrous_type TEXT;

-- Add potion effect fields
ALTER TABLE shop_items
  ADD COLUMN IF NOT EXISTS effect_dice TEXT,
  ADD COLUMN IF NOT EXISTS effect_type TEXT,
  ADD COLUMN IF NOT EXISTS effect_target TEXT;

-- Add scroll/spell fields
ALTER TABLE shop_items
  ADD COLUMN IF NOT EXISTS spell_level INTEGER CHECK (spell_level >= 0 AND spell_level <= 9),
  ADD COLUMN IF NOT EXISTS spell_name TEXT,
  ADD COLUMN IF NOT EXISTS spell_school TEXT;

-- Add wondrous effect description
ALTER TABLE shop_items
  ADD COLUMN IF NOT EXISTS effect_description TEXT;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shop_items_equippable_slot ON shop_items(equippable_slot);
CREATE INDEX IF NOT EXISTS idx_shop_items_wondrous_type ON shop_items(wondrous_type);
CREATE INDEX IF NOT EXISTS idx_shop_items_spell_level ON shop_items(spell_level);

-- Add comments to document the schema
COMMENT ON COLUMN shop_items.equippable_slot IS 'Equipment slot where this item can be equipped: head, neck, shoulders, body, hands, waist, ring_left, ring_right, feet, weapon_main, weapon_off, or NULL if not equippable';
COMMENT ON COLUMN shop_items.wondrous_type IS 'Type of wondrous item: ring, amulet, necklace, cloak, boots, belt, gloves, helmet, other';
COMMENT ON COLUMN shop_items.effect_dice IS 'Effect dice notation for potions and consumables (e.g., 2d4+2 for healing)';
COMMENT ON COLUMN shop_items.effect_type IS 'Type of effect: healing, temporary_hit_points, stat_buff, damage, condition_removal, other';
COMMENT ON COLUMN shop_items.effect_target IS 'Target of the effect: self, other, area';
COMMENT ON COLUMN shop_items.spell_level IS 'Spell level for scrolls (0-9)';
COMMENT ON COLUMN shop_items.spell_name IS 'Name of the spell contained in the scroll';
COMMENT ON COLUMN shop_items.spell_school IS 'School of magic: abjuration, conjuration, divination, enchantment, evocation, illusion, necromancy, transmutation';
COMMENT ON COLUMN shop_items.effect_description IS 'Description of magical effects for wondrous items and other special items';

