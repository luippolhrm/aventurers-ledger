-- scripts/069_add_human_fields.sql
-- ============================================================================
-- SCRIPT 069: Add Human-Specific Fields for PHB 2024
-- ============================================================================
-- Purpose: Add fields for human traits (skill proficiency and origin feat)
-- Impact: LOW - Adds 2 optional columns
-- ============================================================================

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS human_skill_proficiency TEXT,
ADD COLUMN IF NOT EXISTS selected_origin_feat TEXT;

COMMENT ON COLUMN characters.human_skill_proficiency IS 'Habilidad seleccionada para el trait "Diestro" de Humanos (PHB 2024). Solo aplica cuando race = "human" y tiene el trait "human_skilled".';
COMMENT ON COLUMN characters.selected_origin_feat IS 'Dote de origen seleccionada para el trait "Versátil" de Humanos (PHB 2024). Solo aplica cuando race = "human" y tiene el trait "human_versatile". Las dotes de origen se implementarán en el futuro.';

-- ============================================================================

