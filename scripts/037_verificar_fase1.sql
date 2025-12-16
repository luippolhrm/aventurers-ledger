-- ============================================================================
-- SCRIPT 037: Verificación de Fase 1
-- ============================================================================
-- Purpose: Verificar que todos los cambios de Fase 1 se aplicaron correctamente
-- Execute: Después de ejecutar scripts 035 y 036
-- ============================================================================

-- ====================
-- VERIFICACIÓN 1: RLS Activo
-- ====================
SELECT 
  '✅ VERIFICACIÓN 1: RLS ACTIVO' as test,
  tablename, 
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Activo'
    ELSE '❌ RLS Desactivado'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'characters', 'wallets', 'movements', 'transfers',
    'inventory', 'campaigns', 'campaign_members', 'locations', 
    'shops', 'shop_items'
  )
ORDER BY tablename;

-- ====================
-- VERIFICACIÓN 2: Políticas Creadas
-- ====================
SELECT 
  '✅ VERIFICACIÓN 2: POLÍTICAS' as test,
  tablename,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ====================
-- VERIFICACIÓN 3: Total de Políticas
-- ====================
SELECT 
  '✅ VERIFICACIÓN 3: TOTAL POLÍTICAS' as test,
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) >= 40 THEN '✅ Suficientes políticas'
    ELSE '⚠️ Pocas políticas, revisar'
  END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- ====================
-- VERIFICACIÓN 4: Estructura de Characters
-- ====================
SELECT 
  '✅ VERIFICACIÓN 4: COLUMNAS CHARACTERS' as test,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('carrying_capacity', 'preparation_notes', 'avatar_url') 
      THEN '🆕 NUEVA'
    WHEN column_name IN (
      'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
      'max_hit_points', 'current_hit_points', 'armor_class', 'speed', 'initiative_bonus',
      'physical_description', 'personality_traits', 'backstory'
    )
      THEN '❌ DEBERÍA ESTAR ELIMINADA'
    ELSE '✅ OK'
  END as status
FROM information_schema.columns 
WHERE table_name = 'characters' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ====================
-- VERIFICACIÓN 5: Columnas Requeridas Existen
-- ====================
SELECT 
  '✅ VERIFICACIÓN 5: COLUMNAS REQUERIDAS' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'characters' 
        AND column_name = 'carrying_capacity'
    ) THEN '✅' ELSE '❌' 
  END as carrying_capacity,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'characters' 
        AND column_name = 'preparation_notes'
    ) THEN '✅' ELSE '❌' 
  END as preparation_notes,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'characters' 
        AND column_name = 'avatar_url'
    ) THEN '✅' ELSE '❌' 
  END as avatar_url;

-- ====================
-- VERIFICACIÓN 6: Columnas Viejas NO Existen
-- ====================
SELECT 
  '✅ VERIFICACIÓN 6: COLUMNAS ELIMINADAS' as test,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'characters' 
        AND column_name IN ('strength', 'dexterity', 'constitution')
    ) THEN '✅ Atributos eliminados'
    ELSE '❌ Atributos aún existen'
  END as atributos_status,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'characters' 
        AND column_name IN ('max_hit_points', 'armor_class', 'speed')
    ) THEN '✅ Stats eliminados'
    ELSE '❌ Stats aún existen'
  END as stats_status,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'characters' 
        AND column_name IN ('physical_description', 'backstory')
    ) THEN '✅ Narrativa eliminada'
    ELSE '❌ Narrativa aún existe'
  END as narrativa_status;

-- ====================
-- VERIFICACIÓN 7: Total de Columnas en Characters
-- ====================
SELECT 
  '✅ VERIFICACIÓN 7: TOTAL COLUMNAS' as test,
  COUNT(*) as total_columns,
  CASE 
    WHEN COUNT(*) <= 16 THEN '✅ Cantidad correcta'
    WHEN COUNT(*) > 20 THEN '❌ Muchas columnas, scripts no ejecutados'
    ELSE '⚠️ Revisar columnas'
  END as status
FROM information_schema.columns 
WHERE table_name = 'characters' 
  AND table_schema = 'public';

-- ====================
-- RESUMEN FINAL
-- ====================
SELECT 
  '🎯 RESUMEN FINAL' as test,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'characters') as characters_columns,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 40
      AND (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) >= 10
      AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'characters') <= 16
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'carrying_capacity')
    THEN '✅ FASE 1 COMPLETADA EXITOSAMENTE'
    ELSE '⚠️ REVISAR - Algo falta'
  END as status_final;

-- ====================
-- INSTRUCCIONES
-- ====================
-- Si ves "✅ FASE 1 COMPLETADA EXITOSAMENTE" → TODO PERFECTO
-- Si ves "⚠️ REVISAR" → Revisa las verificaciones anteriores para ver qué falta
-- Si ves "❌" en alguna verificación → Ese paso necesita atención
-- ============================================================================
