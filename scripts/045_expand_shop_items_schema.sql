-- Expand shop_items table with extended fields for full D&D item support
-- Adds support for images, rarity, stats, properties, and translations

-- Add extended fields to shop_items
ALTER TABLE shop_items
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact')),
  ADD COLUMN IF NOT EXISTS item_category TEXT,
  ADD COLUMN IF NOT EXISTS damage_dice TEXT,
  ADD COLUMN IF NOT EXISTS damage_type TEXT,
  ADD COLUMN IF NOT EXISTS armor_class INTEGER,
  ADD COLUMN IF NOT EXISTS properties JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS requirements TEXT,
  ADD COLUMN IF NOT EXISTS attunement BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_name_en TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('manual', 'openai', 'dnd5eapi', 'open5e'));

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON shop_items(rarity);
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(item_category);
CREATE INDEX IF NOT EXISTS idx_shop_items_source ON shop_items(source);

-- Add comment to document the schema
COMMENT ON COLUMN shop_items.image_url IS 'URL to the item image';
COMMENT ON COLUMN shop_items.rarity IS 'Item rarity: common, uncommon, rare, very_rare, legendary, artifact';
COMMENT ON COLUMN shop_items.item_category IS 'Category: weapon, armor, potion, scroll, wondrous, etc.';
COMMENT ON COLUMN shop_items.damage_dice IS 'Damage dice notation (e.g., 1d8, 2d6+3)';
COMMENT ON COLUMN shop_items.damage_type IS 'Damage type: slashing, piercing, bludgeoning, fire, cold, etc.';
COMMENT ON COLUMN shop_items.armor_class IS 'Armor class bonus for armor items';
COMMENT ON COLUMN shop_items.properties IS 'JSON array of item properties (versatile, finesse, heavy, etc.)';
COMMENT ON COLUMN shop_items.requirements IS 'Requirements to use the item';
COMMENT ON COLUMN shop_items.attunement IS 'Whether the item requires attunement';
COMMENT ON COLUMN shop_items.original_name_en IS 'Original name in English (for translated items)';
COMMENT ON COLUMN shop_items.source IS 'Source of the item: manual, openai, dnd5eapi, open5e';
