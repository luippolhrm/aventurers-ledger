-- scripts/070_add_goliath_giant_lineage_field.sql
-- ============================================================================
-- SCRIPT 070: Add Goliath Giant Lineage Field for PHB 2024
-- ============================================================================
-- Purpose: Add field for selected giant lineage benefit for Goliaths
-- Impact: LOW - Adds 1 optional column
-- ============================================================================

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS goliath_giant_lineage TEXT;

COMMENT ON COLUMN characters.goliath_giant_lineage IS 'Linaje gigante seleccionado para Goliat (PHB 2024). Valores posibles: "fire", "hill", "cloud", "frost", "stone", "storm". Solo aplica cuando race = "goliath" y tiene el trait "giant_lineage".';

-- ============================================================================

