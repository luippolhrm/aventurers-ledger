-- ============================================================================
-- SCRIPT 058: Agregar tipo 'purchase' a movements y columna description
-- ============================================================================
-- Este script agrega soporte para movimientos de tipo 'purchase' que
-- representan compras realizadas en tiendas.
-- ============================================================================

-- 1. Agregar columna description si no existe
ALTER TABLE movements 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Actualizar constraint de movement_type para incluir 'purchase'
-- Primero eliminar el constraint existente si existe
DO $$ 
BEGIN
  -- Intentar eliminar el constraint si existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'movements_movement_type_check'
  ) THEN
    ALTER TABLE movements DROP CONSTRAINT movements_movement_type_check;
  END IF;
END $$;

-- 3. Agregar nuevo constraint que incluye 'purchase'
ALTER TABLE movements 
ADD CONSTRAINT movements_movement_type_check 
CHECK (movement_type IN ('add', 'remove', 'conversion', 'purchase'));

-- 4. Actualizar comentarios
COMMENT ON COLUMN movements.movement_type IS 'Type of movement: add, remove, conversion, purchase';
COMMENT ON COLUMN movements.description IS 'Optional description for the movement (e.g., purchase summary, notes)';

-- 5. Si hay registros existentes sin movement_type, establecer default
UPDATE movements 
SET movement_type = 'conversion' 
WHERE movement_type IS NULL;

