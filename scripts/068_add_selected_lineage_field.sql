-- scripts/068_add_selected_lineage_field.sql
-- ============================================================================
-- SCRIPT 068: Add Selected Lineage Field for PHB 2024
-- ============================================================================
-- Purpose: Add selected_lineage field to support elven lineages in PHB 2024
-- Impact: LOW - Adds 1 optional column
-- ============================================================================

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS selected_lineage TEXT;

COMMENT ON COLUMN characters.selected_lineage IS 'Linaje seleccionado para especies con linajes (ej: "high_elf", "drow", "wood_elf" para Elfos). Solo aplica cuando la especie tiene linajes disponibles según PHB 2024.';

-- ============================================================================

