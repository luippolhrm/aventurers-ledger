-- ============================================================================
-- SCRIPT 058: Normalizar roles en campaign_members
-- ============================================================================
-- Purpose: 
--   1. Asegurar que los GMs tengan character_id = NULL
--   2. Asegurar que los players tengan character_id asignado cuando sea posible
--   3. Limpiar inconsistencias en los datos
-- ============================================================================

-- ====================
-- PASO 1: Normalizar GMs (character_id debe ser NULL)
-- ====================

-- Actualizar todos los registros GM que tengan character_id asignado
UPDATE public.campaign_members
SET character_id = NULL
WHERE role = 'game_master'
  AND character_id IS NOT NULL;

-- ====================
-- PASO 2: Identificar players sin character_id
-- ====================

-- Crear una vista temporal para identificar players problemáticos
CREATE OR REPLACE VIEW players_without_character AS
SELECT 
  cm.id,
  cm.campaign_id,
  cm.user_id,
  cm.role,
  cm.character_id,
  cm.joined_at
FROM public.campaign_members cm
WHERE cm.role = 'player'
  AND cm.character_id IS NULL;

-- Mostrar estadísticas antes de la migración
SELECT 
  'Players sin character_id (antes de migración)' AS tipo,
  COUNT(*) AS cantidad
FROM players_without_character;

-- ====================
-- PASO 3: Intentar asignar character_id a players sin él
-- ====================

-- Para cada player sin character_id, intentar asignar el primer personaje del usuario
-- que no esté archivado y que no esté ya en la misma campaña con otro character_id
UPDATE public.campaign_members cm
SET character_id = (
  SELECT c.id
  FROM characters c
  WHERE c.user_id = cm.user_id
    AND c.archived = false
    AND NOT EXISTS (
      -- No asignar si este personaje ya está en la campaña
      SELECT 1 
      FROM campaign_members cm2
      WHERE cm2.campaign_id = cm.campaign_id
        AND cm2.character_id = c.id
        AND cm2.id != cm.id
    )
  ORDER BY c.created_at ASC
  LIMIT 1
)
WHERE cm.role = 'player'
  AND cm.character_id IS NULL
  AND EXISTS (
    -- Solo actualizar si el usuario tiene al menos un personaje
    SELECT 1
    FROM characters c
    WHERE c.user_id = cm.user_id
      AND c.archived = false
  );

-- ====================
-- PASO 4: Mostrar estadísticas después de la migración
-- ====================

SELECT 
  'Players sin character_id (después de migración)' AS tipo,
  COUNT(*) AS cantidad
FROM public.campaign_members
WHERE role = 'player'
  AND character_id IS NULL;

SELECT 
  'GMs con character_id (debería ser 0)' AS tipo,
  COUNT(*) AS cantidad
FROM public.campaign_members
WHERE role = 'game_master'
  AND character_id IS NOT NULL;

-- ====================
-- PASO 5: Verificar constraint único
-- ====================

-- Asegurar que el constraint único esté en su lugar
-- (campaign_id, user_id, character_id) debe ser único
-- Esto permite múltiples personajes del mismo usuario en la misma campaña

-- Verificar si el constraint existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'campaign_members_campaign_user_character_unique'
  ) THEN
    -- Si no existe, crearlo
    ALTER TABLE public.campaign_members
    ADD CONSTRAINT campaign_members_campaign_user_character_unique
    UNIQUE (campaign_id, user_id, character_id);
  END IF;
END $$;

-- ====================
-- PASO 6: Limpiar vista temporal
-- ====================

DROP VIEW IF EXISTS players_without_character;

-- ============================================================================
-- RESUMEN:
-- ============================================================================
-- Este script:
-- 1. Normaliza todos los GMs para que tengan character_id = NULL
-- 2. Intenta asignar character_id a players que no lo tienen
-- 3. Verifica que el constraint único esté en su lugar
-- 
-- NOTA: Los players que no puedan ser migrados (sin personajes disponibles)
-- quedarán con character_id = NULL y deberán ser manejados manualmente o
-- eliminados si son datos inconsistentes.
-- ============================================================================

