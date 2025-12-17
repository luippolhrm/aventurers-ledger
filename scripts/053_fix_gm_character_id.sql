-- ============================================================================
-- SCRIPT 053: Corregir character_id de GMs (debe ser NULL)
-- ============================================================================
-- Purpose: Corregir los GMs que tienen character_id asignado incorrectamente.
--          Según la nueva arquitectura, los GMs deben tener character_id: NULL
--          porque el GM es el usuario, no un personaje.
-- ============================================================================
-- IMPORTANTE: Hacer backup de campaign_members antes de ejecutar este script
-- ============================================================================

-- ============================================================================
-- 1. REPORTE PRE-MIGRACIÓN: Mostrar GMs que serán afectados
-- ============================================================================
SELECT 
  '=== REPORTE PRE-MIGRACIÓN: GMs con character_id asignado ===' AS reporte;

SELECT 
  cm.id AS member_id,
  cm.campaign_id,
  c.name AS campaign_name,
  cm.user_id,
  p.display_name AS user_name,
  cm.character_id,
  ch.name AS character_name,
  cm.role,
  cm.joined_at
FROM campaign_members cm
JOIN campaigns c ON c.id = cm.campaign_id
LEFT JOIN profiles p ON p.id = cm.user_id
LEFT JOIN characters ch ON ch.id = cm.character_id
WHERE cm.role = 'game_master'
  AND cm.character_id IS NOT NULL
ORDER BY c.name, p.display_name;

-- Contar cuántos GMs serán afectados
SELECT 
  COUNT(*) AS total_gms_to_fix,
  COUNT(DISTINCT cm.campaign_id) AS campaigns_affected,
  COUNT(DISTINCT cm.user_id) AS users_affected
FROM campaign_members cm
WHERE cm.role = 'game_master'
  AND cm.character_id IS NOT NULL;

-- ============================================================================
-- 2. IDENTIFICAR CONFLICTOS: GMs que tienen el mismo character_id que un Player
-- ============================================================================
-- Primero identificar casos donde hay un GM y un Player con el mismo character_id
SELECT 
  '=== CONFLICTOS DETECTADOS: GM y Player con mismo character_id ===' AS reporte;

SELECT 
  cm1.id AS gm_member_id,
  cm1.campaign_id,
  c.name AS campaign_name,
  cm1.user_id,
  p.display_name AS user_name,
  cm1.character_id,
  ch.name AS character_name,
  cm2.id AS player_member_id
FROM campaign_members cm1
JOIN campaign_members cm2 
  ON cm1.campaign_id = cm2.campaign_id
  AND cm1.user_id = cm2.user_id
  AND cm1.character_id = cm2.character_id
JOIN campaigns c ON c.id = cm1.campaign_id
LEFT JOIN profiles p ON p.id = cm1.user_id
LEFT JOIN characters ch ON ch.id = cm1.character_id
WHERE cm1.role = 'game_master'
  AND cm2.role = 'player'
  AND cm1.character_id IS NOT NULL
ORDER BY c.name, p.display_name;

-- ============================================================================
-- 3. ELIMINAR DUPLICADOS EXACTOS (si existen)
-- ============================================================================
-- Si hay registros duplicados exactos (mismo campaign_id, user_id, character_id, role),
-- eliminamos los duplicados, manteniendo solo el más antiguo (por joined_at)
SELECT 
  '=== ELIMINANDO DUPLICADOS EXACTOS (si existen) ===' AS reporte;

-- Identificar y eliminar duplicados exactos de GMs
WITH duplicates AS (
  SELECT 
    id,
    campaign_id,
    user_id,
    character_id,
    role,
    joined_at,
    ROW_NUMBER() OVER (
      PARTITION BY campaign_id, user_id, character_id, role 
      ORDER BY joined_at ASC
    ) AS rn
  FROM campaign_members
  WHERE role = 'game_master'
    AND character_id IS NOT NULL
)
DELETE FROM campaign_members
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- ============================================================================
-- 4. CORRECCIÓN: Poner character_id a NULL para todos los GMs
-- ============================================================================
-- IMPORTANTE: El constraint UNIQUE (campaign_id, user_id, character_id) permite:
-- - GM: (campaign_id, user_id, NULL)
-- - Player: (campaign_id, user_id, character_id)
-- Estos son diferentes y no hay conflicto porque NULL != character_id
--
-- Si el UPDATE falla con error de duplicado, puede ser porque PostgreSQL
-- está validando el constraint durante el UPDATE. Usamos un enfoque más seguro:
-- actualizar solo los GMs que NO tienen un Player con el mismo character_id

-- Primero: Actualizar GMs que NO tienen conflicto con Players
UPDATE campaign_members cm1
SET character_id = NULL
WHERE cm1.role = 'game_master'
  AND cm1.character_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM campaign_members cm2
    WHERE cm2.campaign_id = cm1.campaign_id
      AND cm2.user_id = cm1.user_id
      AND cm2.character_id = cm1.character_id
      AND cm2.role = 'player'
      AND cm2.id != cm1.id
  );

-- Segundo: Para GMs que SÍ tienen un Player con el mismo character_id,
-- necesitamos un enfoque diferente porque PostgreSQL puede validar el constraint
-- durante el UPDATE. Usamos DELETE + INSERT en lugar de UPDATE para evitar
-- el conflicto temporal del constraint.

-- Para cada GM que tiene un Player con el mismo character_id:
-- 1. Guardar los datos del GM
-- 2. Eliminar el registro GM
-- 3. Insertar un nuevo registro GM con character_id = NULL
DO $$
DECLARE
  gm_record RECORD;
BEGIN
  FOR gm_record IN 
    SELECT cm1.id, cm1.campaign_id, cm1.user_id, cm1.role, cm1.joined_at
    FROM campaign_members cm1
    WHERE cm1.role = 'game_master'
      AND cm1.character_id IS NOT NULL
      AND EXISTS (
        SELECT 1 
        FROM campaign_members cm2
        WHERE cm2.campaign_id = cm1.campaign_id
          AND cm2.user_id = cm1.user_id
          AND cm2.character_id = cm1.character_id
          AND cm2.role = 'player'
          AND cm2.id != cm1.id
      )
  LOOP
    -- Eliminar el registro GM con character_id
    DELETE FROM campaign_members WHERE id = gm_record.id;
    
    -- Insertar nuevo registro GM con character_id = NULL
    INSERT INTO campaign_members (campaign_id, user_id, role, character_id, joined_at)
    VALUES (gm_record.campaign_id, gm_record.user_id, gm_record.role, NULL, gm_record.joined_at)
    ON CONFLICT (campaign_id, user_id, character_id) DO NOTHING;
  END LOOP;
END $$;

-- Tercero: Actualizar cualquier GM restante que no fue procesado arriba
-- (esto debería funcionar sin problemas porque ya no hay conflictos)
UPDATE campaign_members
SET character_id = NULL
WHERE role = 'game_master'
  AND character_id IS NOT NULL;

-- ============================================================================
-- 4. VERIFICACIÓN: Confirmar que la corrección fue exitosa
-- ============================================================================
SELECT 
  '=== VERIFICACIÓN POST-MIGRACIÓN ===' AS reporte;

-- Verificar que no quedan GMs con character_id
SELECT 
  COUNT(*) AS gms_with_character_id_remaining
FROM campaign_members
WHERE role = 'game_master'
  AND character_id IS NOT NULL;
-- Debe ser 0

-- ============================================================================
-- 5. REPORTE POST-MIGRACIÓN: Estadísticas finales
-- ============================================================================
SELECT 
  '=== ESTADÍSTICAS FINALES ===' AS reporte;

-- Total de GMs (deben tener character_id: NULL)
SELECT 
  'Total GMs' AS categoria,
  COUNT(*) AS total,
  COUNT(CASE WHEN character_id IS NULL THEN 1 END) AS con_character_id_null,
  COUNT(CASE WHEN character_id IS NOT NULL THEN 1 END) AS con_character_id_asignado
FROM campaign_members
WHERE role = 'game_master';

-- Total de Players (pueden tener character_id)
SELECT 
  'Total Players' AS categoria,
  COUNT(*) AS total,
  COUNT(CASE WHEN character_id IS NULL THEN 1 END) AS sin_character_id,
  COUNT(CASE WHEN character_id IS NOT NULL THEN 1 END) AS con_character_id
FROM campaign_members
WHERE role = 'player';

-- Casos donde el mismo usuario es GM y Player en la misma campaña
SELECT 
  'Usuarios que son GM y Player en la misma campaña' AS categoria,
  COUNT(DISTINCT cm1.user_id) AS total_usuarios,
  COUNT(DISTINCT cm1.campaign_id) AS total_campanas
FROM campaign_members cm1
JOIN campaign_members cm2 
  ON cm1.user_id = cm2.user_id 
  AND cm1.campaign_id = cm2.campaign_id
WHERE cm1.role = 'game_master'
  AND cm2.role = 'player'
  AND cm1.character_id IS NULL
  AND cm2.character_id IS NOT NULL;

-- ============================================================================
-- 6. NOTA IMPORTANTE PARA GMs QUE QUERÍAN JUGAR CON SU PERSONAJE
-- ============================================================================
-- Si un GM tenía un character_id asignado y quiere jugar con ese personaje
-- en su propia campaña, debe:
-- 1. Unirse a la campaña usando el código de invitación con ese personaje activo
-- 2. Esto creará un registro Player separado con character_id asignado
-- 
-- Ejemplo de consulta para ver qué personajes tenían los GMs antes de la migración:
-- (Esta consulta solo funcionará si se ejecuta ANTES de la migración)
-- SELECT 
--   cm.user_id,
--   p.display_name AS user_name,
--   c.name AS campaign_name,
--   ch.name AS character_name,
--   ch.id AS character_id
-- FROM campaign_members cm
-- JOIN campaigns c ON c.id = cm.campaign_id
-- LEFT JOIN profiles p ON p.id = cm.user_id
-- LEFT JOIN characters ch ON ch.id = cm.character_id
-- WHERE cm.role = 'game_master'
--   AND cm.character_id IS NOT NULL;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
SELECT 
  '=== MIGRACIÓN COMPLETADA ===' AS status,
  'Todos los GMs ahora tienen character_id: NULL' AS resultado;
