-- ============================================================================
-- SCRIPT 054: Agregar campo gender a characters
-- ============================================================================
-- Purpose: Agregar campo gender para permitir selección de avatar por defecto
--          basado en el género del personaje (masculino, femenino, otro, o NULL)
-- ============================================================================

-- Agregar columna gender a characters
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

-- Comentario
COMMENT ON COLUMN characters.gender IS 
'Gender of the character for default avatar selection. Values: male, female, other, or NULL for neutral/default.';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 
  '=== VERIFICACIÓN: Campo gender agregado ===' AS reporte;

-- Verificar que la columna existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'characters'
  AND column_name = 'gender';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
SELECT 
  '=== MIGRACIÓN COMPLETADA ===' AS status,
  'Campo gender agregado a la tabla characters' AS resultado;
