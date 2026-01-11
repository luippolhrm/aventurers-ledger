-- Migración: Agregar campos para armas versátiles
-- Fecha: 2026-01-11
-- Descripción: Agrega damage_dice_versatile y versatile_usage para soportar armas versátiles

-- 1. Agregar campo damage_dice_versatile para el daño al usar el arma con dos manos
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS damage_dice_versatile TEXT;

COMMENT ON COLUMN inventory.damage_dice_versatile IS 
  'Dado de daño cuando un arma versátil es usada con dos manos (ej: 1d8 -> 1d10). Solo aplica cuando properties incluye "versatile"';

-- 2. Agregar campo versatile_usage para indicar explícitamente cómo se usa el arma
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS versatile_usage TEXT
  CHECK (versatile_usage IN ('one-handed', 'two-handed') OR versatile_usage IS NULL);

COMMENT ON COLUMN inventory.versatile_usage IS 
  'Uso explícito del arma versátil: "one-handed" (1 mano) o "two-handed" (2 manos). Solo aplica cuando properties incluye "versatile". Si es NULL, se infiere automáticamente según si hay algo en weapon_off';

-- 3. Crear índice para versatile_usage (útil para queries que filtren por este campo)
CREATE INDEX IF NOT EXISTS idx_inventory_versatile_usage 
  ON inventory(versatile_usage) 
  WHERE versatile_usage IS NOT NULL;

-- 4. Agregar índice compuesto para búsquedas de armas versátiles
CREATE INDEX IF NOT EXISTS idx_inventory_versatile_weapons
  ON inventory(character_id, item_category)
  WHERE item_category = 'weapon' AND properties @> ARRAY['versatile'];
