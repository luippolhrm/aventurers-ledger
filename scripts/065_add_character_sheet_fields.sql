-- ============================================================================
-- SCRIPT 065: Add Character Sheet Fields
-- ============================================================================
-- Purpose: Add D&D 5e character sheet fields to characters table
-- Impact: MEDIUM - Adds 9 new optional columns
-- ============================================================================

-- Add ability scores (1-30 range, optional)
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS strength INTEGER CHECK (strength >= 1 AND strength <= 30),
ADD COLUMN IF NOT EXISTS dexterity INTEGER CHECK (dexterity >= 1 AND dexterity <= 30),
ADD COLUMN IF NOT EXISTS constitution INTEGER CHECK (constitution >= 1 AND constitution <= 30),
ADD COLUMN IF NOT EXISTS intelligence INTEGER CHECK (intelligence >= 1 AND intelligence <= 30),
ADD COLUMN IF NOT EXISTS wisdom INTEGER CHECK (wisdom >= 1 AND wisdom <= 30),
ADD COLUMN IF NOT EXISTS charisma INTEGER CHECK (charisma >= 1 AND charisma <= 30);

-- Add size (small, medium, large) with default 'medium'
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS size TEXT DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large'));

-- Add background and alignment (optional text fields)
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS background TEXT,
ADD COLUMN IF NOT EXISTS alignment TEXT;

-- Add experience points (optional, default 0)
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0;

-- Verify that carrying_capacity already exists (from script 036)
-- If not, it will be added with default 150
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'characters' AND column_name = 'carrying_capacity'
  ) THEN
    ALTER TABLE characters
    ADD COLUMN carrying_capacity INTEGER DEFAULT 150;
  END IF;
END $$;

-- Add comments to document the new columns
COMMENT ON COLUMN characters.strength IS 'Strength ability score (1-30). Used to calculate carrying capacity.';
COMMENT ON COLUMN characters.dexterity IS 'Dexterity ability score (1-30).';
COMMENT ON COLUMN characters.constitution IS 'Constitution ability score (1-30).';
COMMENT ON COLUMN characters.intelligence IS 'Intelligence ability score (1-30).';
COMMENT ON COLUMN characters.wisdom IS 'Wisdom ability score (1-30).';
COMMENT ON COLUMN characters.charisma IS 'Charisma ability score (1-30).';
COMMENT ON COLUMN characters.size IS 'Character size: small, medium, or large. Affects carrying capacity calculation.';
COMMENT ON COLUMN characters.background IS 'Character background (e.g., Soldier, Noble, Criminal).';
COMMENT ON COLUMN characters.alignment IS 'Character alignment (e.g., Lawful Good, Chaotic Neutral).';
COMMENT ON COLUMN characters.experience_points IS 'Total experience points earned by the character.';

-- ============================================================================
-- NOTES
-- ============================================================================
-- All new columns are optional (NULL allowed) for backward compatibility
-- Existing characters will have NULL values for new fields
-- carrying_capacity is calculated as: strength × 15 lbs (adjusted by size)
--   - Small: ÷ 2
--   - Medium: × 1
--   - Large: × 2
-- ============================================================================

