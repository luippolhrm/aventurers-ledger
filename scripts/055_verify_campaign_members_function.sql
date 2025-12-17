-- ============================================================================
-- SCRIPT 055: Verificar que la función get_campaign_members existe y funciona
-- ============================================================================
-- Este script verifica que la función get_campaign_members esté creada
-- y tenga los permisos correctos.
-- ============================================================================

-- Verificar que la función existe
SELECT 
  'Function exists check' AS check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proname = 'get_campaign_members'
    ) THEN '✅ Function exists'
    ELSE '❌ Function DOES NOT exist - Run script 054!'
  END AS status;

-- Verificar permisos de la función
SELECT 
  'Function permissions' AS check_type,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER ✅'
    ELSE 'SECURITY INVOKER ⚠️'
  END AS security_type,
  CASE 
    WHEN p.proacl IS NULL THEN '✅ Default permissions (public)'
    WHEN array_to_string(p.proacl, ', ') LIKE '%authenticated%' THEN '✅ Has authenticated permission'
    ELSE '⚠️ Permissions: ' || array_to_string(p.proacl, ', ')
  END AS permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'get_campaign_members';

-- Si la función no existe, mostrar instrucciones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_campaign_members'
  ) THEN
    RAISE NOTICE '====================================================================';
    RAISE NOTICE '⚠️  LA FUNCIÓN get_campaign_members NO EXISTE';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Por favor ejecuta el script 054_fix_campaign_members_visibility.sql';
    RAISE NOTICE 'en el SQL Editor de Supabase para crear la función.';
    RAISE NOTICE '====================================================================';
  ELSE
    RAISE NOTICE '✅ La función get_campaign_members existe correctamente';
  END IF;
END $$;
