-- ============================================================================
-- SCRIPT 067: Add Subrace Field for PHB 2014
-- ============================================================================
-- Purpose: Add subrace field to support PHB 2014 racial bonuses
-- Impact: LOW - Adds 1 optional column
-- ============================================================================

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS subrace TEXT;

COMMENT ON COLUMN characters.subrace IS 'Subraza del personaje según PHB 2014 (ej: "hill_dwarf", "high_elf", "lightfoot_halfling"). Solo aplica cuando rules_system = "5e_2014".';

-- ============================================================================

