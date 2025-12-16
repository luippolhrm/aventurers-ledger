-- ============================================================================
-- SCRIPT 036: Simplify characters table - Remove combat/narrative fields
-- ============================================================================
-- Purpose: Align characters table with "Adventurer's Book" concept
-- Focus: Economic and logistical information, NOT combat mechanics
-- Impact: HIGH - Removes 14 columns and adds 3 new ones
-- ============================================================================

-- WARNING: This will delete data in the removed columns!
-- Make a backup before running this script in production

-- ====================
-- STEP 1: Add new columns (aligned with concept)
-- ====================

-- Carrying capacity for weight system (default based on medium strength)
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS carrying_capacity INTEGER DEFAULT 150;

-- Notes for preparation ("Need to buy potions", "Sell old sword")
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS preparation_notes TEXT;

-- Avatar URL for visual identification
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ====================
-- STEP 2: Remove combat attribute columns (NOT aligned with concept)
-- ====================

-- Core Attributes (STR, DEX, CON, INT, WIS, CHA)
-- These belong in a traditional character sheet, not here
ALTER TABLE characters
DROP COLUMN IF EXISTS strength,
DROP COLUMN IF EXISTS dexterity,
DROP COLUMN IF EXISTS constitution,
DROP COLUMN IF EXISTS intelligence,
DROP COLUMN IF EXISTS wisdom,
DROP COLUMN IF EXISTS charisma;

-- Combat Stats (HP, AC, Speed, Initiative)
-- These are combat mechanics, not preparation/economic
ALTER TABLE characters
DROP COLUMN IF EXISTS max_hit_points,
DROP COLUMN IF EXISTS current_hit_points,
DROP COLUMN IF EXISTS armor_class,
DROP COLUMN IF EXISTS speed,
DROP COLUMN IF EXISTS initiative_bonus;

-- ====================
-- STEP 3: Remove narrative columns (NOT core to concept)
-- ====================

-- Long-form narrative text fields
-- Users can use external tools for storytelling
ALTER TABLE characters
DROP COLUMN IF EXISTS physical_description,
DROP COLUMN IF EXISTS personality_traits,
DROP COLUMN IF EXISTS backstory;

-- ====================
-- FINAL SCHEMA: characters table
-- ====================
-- Remaining columns:
--   • id (UUID)
--   • user_id (UUID FK)
--   • name (TEXT)
--   • race (TEXT)
--   • class (TEXT)
--   • level (INTEGER)
--   • alignment (TEXT)
--   • background (TEXT) - kept as it's brief identity info
--   • experience_points (INTEGER) - kept for level tracking
--   • carrying_capacity (INTEGER) - NEW: for weight system
--   • preparation_notes (TEXT) - NEW: for planning
--   • avatar_url (TEXT) - NEW: for visual identification
--   • archived (BOOLEAN)
--   • created_at (TIMESTAMPTZ)
--   • updated_at (TIMESTAMPTZ)
-- ====================

-- Add comment to table documenting the change
COMMENT ON TABLE characters IS 
'Character table for Player''s Companion - Adventurer''s Book.
Focus: Economic and logistical information for adventure preparation.
NOT a full character sheet - use D&D Beyond for combat mechanics.
Last simplified: Script 036 (Dec 2024)';

-- Add comments to new columns
COMMENT ON COLUMN characters.carrying_capacity IS 
'Maximum weight (in lbs) the character can carry. Used for inventory weight validation.';

COMMENT ON COLUMN characters.preparation_notes IS 
'Free-form notes for adventure preparation. Example: "Buy 3 healing potions before next session"';

COMMENT ON COLUMN characters.avatar_url IS 
'URL to character avatar image for visual identification.';

-- ============================================================================
-- IMPACT ANALYSIS
-- ============================================================================
-- Files that will need updates:
-- 1. components/characters-unified.tsx - Remove Attributes, Stats, Narrative tabs
-- 2. components/character-profile.tsx - Remove same tabs (if still in use)
-- 3. TypeScript interfaces - Update Character type definition
--
-- Database impact:
-- - 14 columns removed (saves storage and simplifies queries)
-- - 3 columns added (aligned with product concept)
-- - All existing character data preserved in remaining columns
-- - Combat/narrative data will be LOST (make backup if needed)
-- ============================================================================

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
