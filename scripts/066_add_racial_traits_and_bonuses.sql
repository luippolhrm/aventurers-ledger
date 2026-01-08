-- ============================================================================
-- SCRIPT 066: Add Racial Traits and Bonuses
-- ============================================================================
-- Purpose: Add D&D 2024 racial traits, backgrounds, and bonuses to characters table
-- Impact: MEDIUM - Adds 5 new optional columns
-- ============================================================================

-- Traits raciales activos (array de strings)
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS racial_traits TEXT[] DEFAULT '{}';

-- Background (D&D 2024) - para bonificaciones de atributos
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS character_background TEXT;

-- Bonificaciones de Background (D&D 2024)
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS background_ability_bonuses JSONB DEFAULT '{}';

-- Sistema de reglas (default: 2024, pero mantener compatibilidad 2014)
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS rules_system TEXT DEFAULT '5e_2024' 
  CHECK (rules_system IN ('5e_2014', '5e_2024'));

-- Bonificadores de compra/tienda (para referencia futura)
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS shop_bonuses JSONB DEFAULT '{}';

-- Add comments to document the new columns
COMMENT ON COLUMN characters.racial_traits IS 'Array de IDs de traits raciales activos (ej: ["powerful_build", "darkvision"]).';
COMMENT ON COLUMN characters.character_background IS 'Background del personaje según D&D 2024 (ej: "soldado", "noble", "criminal").';
COMMENT ON COLUMN characters.background_ability_bonuses IS 'Bonificaciones de atributos del Background en formato JSONB (ej: {"strength": 1, "constitution": 1}).';
COMMENT ON COLUMN characters.rules_system IS 'Sistema de reglas: 5e_2014 o 5e_2024. Default: 5e_2024.';
COMMENT ON COLUMN characters.shop_bonuses IS 'Bonificadores de compra/tienda en formato JSONB (ej: {"discount_percent": 5, "negotiation_bonus": 2}). Solo referencia, no se aplica aún.';

-- ============================================================================
-- NOTES
-- ============================================================================
-- All new columns are optional (NULL allowed) for backward compatibility
-- Existing characters will have:
--   - racial_traits: '{}' (empty array)
--   - character_background: NULL
--   - background_ability_bonuses: '{}' (empty JSONB)
--   - rules_system: '5e_2024' (default)
--   - shop_bonuses: '{}' (empty JSONB)
-- ============================================================================

