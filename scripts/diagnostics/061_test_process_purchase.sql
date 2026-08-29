-- ============================================================================
-- SCRIPT 061: Scripts de prueba para process_purchase
-- ============================================================================
-- Este script contiene casos de prueba para validar el funcionamiento
-- de la stored procedure process_purchase
-- ============================================================================

-- ============================================================================
-- CASOS DE PRUEBA
-- ============================================================================

-- NOTA: Estos son ejemplos de cómo probar la función. 
-- Ajusta los UUIDs según tus datos de prueba.

-- ============================================================================
-- Prueba 1: Compra simple con un item
-- ============================================================================
/*
DO $$
DECLARE
  v_character_id UUID := 'TU_CHARACTER_ID_AQUI';
  v_shop_id UUID := 'TU_SHOP_ID_AQUI';
  v_cart_items JSONB := jsonb_build_array(
    jsonb_build_object(
      'shop_item_id', 'TU_SHOP_ITEM_ID_AQUI',
      'quantity', 1
    )
  );
  v_description TEXT := 'Compra de prueba: 1x Item de Prueba';
  v_result JSONB;
BEGIN
  -- Llamar a la función
  SELECT process_purchase(
    v_character_id,
    v_shop_id,
    v_cart_items,
    v_description
  ) INTO v_result;
  
  -- Mostrar resultado
  RAISE NOTICE 'Resultado: %', v_result;
  
  -- Verificar éxito
  IF (v_result->>'success')::boolean THEN
    RAISE NOTICE '✅ Prueba 1: EXITOSA';
  ELSE
    RAISE NOTICE '❌ Prueba 1: FALLIDA - %', v_result->>'error';
  END IF;
END $$;
*/

-- ============================================================================
-- Prueba 2: Compra múltiple con varios items
-- ============================================================================
/*
DO $$
DECLARE
  v_character_id UUID := 'TU_CHARACTER_ID_AQUI';
  v_shop_id UUID := 'TU_SHOP_ID_AQUI';
  v_cart_items JSONB := jsonb_build_array(
    jsonb_build_object('shop_item_id', 'ITEM_1_ID', 'quantity', 2),
    jsonb_build_object('shop_item_id', 'ITEM_2_ID', 'quantity', 1),
    jsonb_build_object('shop_item_id', 'ITEM_3_ID', 'quantity', 3)
  );
  v_description TEXT := 'Compra múltiple: 2x Item1, 1x Item2, 3x Item3';
  v_result JSONB;
BEGIN
  SELECT process_purchase(
    v_character_id,
    v_shop_id,
    v_cart_items,
    v_description
  ) INTO v_result;
  
  IF (v_result->>'success')::boolean THEN
    RAISE NOTICE '✅ Prueba 2: EXITOSA';
    RAISE NOTICE 'Purchase IDs: %', v_result->'purchase_ids';
  ELSE
    RAISE NOTICE '❌ Prueba 2: FALLIDA - %', v_result->>'error';
  END IF;
END $$;
*/

-- ============================================================================
-- Prueba 3: Validar que falla con stock insuficiente
-- ============================================================================
/*
DO $$
DECLARE
  v_character_id UUID := 'TU_CHARACTER_ID_AQUI';
  v_shop_id UUID := 'TU_SHOP_ID_AQUI';
  v_cart_items JSONB := jsonb_build_array(
    jsonb_build_object(
      'shop_item_id', 'ITEM_SIN_STOCK_ID',
      'quantity', 9999  -- Cantidad mayor al stock disponible
    )
  );
  v_description TEXT := 'Prueba de stock insuficiente';
  v_result JSONB;
BEGIN
  SELECT process_purchase(
    v_character_id,
    v_shop_id,
    v_cart_items,
    v_description
  ) INTO v_result;
  
  IF NOT (v_result->>'success')::boolean THEN
    RAISE NOTICE '✅ Prueba 3: EXITOSA (falló como se esperaba)';
    RAISE NOTICE 'Error esperado: %', v_result->>'error';
  ELSE
    RAISE NOTICE '❌ Prueba 3: FALLIDA (debería haber fallado)';
  END IF;
END $$;
*/

-- ============================================================================
-- Prueba 4: Validar que falla con fondos insuficientes
-- ============================================================================
/*
DO $$
DECLARE
  v_character_id UUID := 'TU_CHARACTER_ID_AQUI';
  v_shop_id UUID := 'TU_SHOP_ID_AQUI';
  v_cart_items JSONB := jsonb_build_array(
    jsonb_build_object(
      'shop_item_id', 'ITEM_CARO_ID',
      'quantity', 1  -- Item muy caro que excede los fondos
    )
  );
  v_description TEXT := 'Prueba de fondos insuficientes';
  v_result JSONB;
BEGIN
  SELECT process_purchase(
    v_character_id,
    v_shop_id,
    v_cart_items,
    v_description
  ) INTO v_result;
  
  IF NOT (v_result->>'success')::boolean THEN
    RAISE NOTICE '✅ Prueba 4: EXITOSA (falló como se esperaba)';
    RAISE NOTICE 'Error esperado: %', v_result->>'error';
  ELSE
    RAISE NOTICE '❌ Prueba 4: FALLIDA (debería haber fallado)';
  END IF;
END $$;
*/

-- ============================================================================
-- Prueba 5: Verificar que el algoritmo de deducción funciona correctamente
-- ============================================================================
/*
-- Antes de la compra, verificar wallet
SELECT 
  platinum, gold, electrum, silver, copper,
  (platinum * 1000 + gold * 100 + electrum * 50 + silver * 10 + copper) as total_cp
FROM wallets
WHERE character_id = 'TU_CHARACTER_ID_AQUI';

-- Realizar compra
-- (usar Prueba 1 o 2)

-- Después de la compra, verificar wallet
SELECT 
  platinum, gold, electrum, silver, copper,
  (platinum * 1000 + gold * 100 + electrum * 50 + silver * 10 + copper) as total_cp
FROM wallets
WHERE character_id = 'TU_CHARACTER_ID_AQUI';

-- Verificar que el movimiento se creó
SELECT 
  id, movement_type, description, amount_from, created_at
FROM movements
WHERE character_id = 'TU_CHARACTER_ID_AQUI'
  AND movement_type = 'purchase'
ORDER BY created_at DESC
LIMIT 1;
*/

-- ============================================================================
-- VERIFICACIONES GENERALES
-- ============================================================================

-- Verificar que la función existe
SELECT 
  'Function exists check' AS check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proname = 'process_purchase'
    ) THEN '✅ Function exists'
    ELSE '❌ Function DOES NOT exist - Run script 059!'
  END AS status;

-- Verificar que la función auxiliar existe
SELECT 
  'Helper function exists check' AS check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proname = 'calculate_wallet_deduction'
    ) THEN '✅ Helper function exists'
    ELSE '❌ Helper function DOES NOT exist - Run script 060!'
  END AS status;

-- Verificar permisos
SELECT 
  'Function permissions' AS check_type,
  p.proname AS function_name,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER ✅'
    ELSE 'SECURITY INVOKER ⚠️'
  END AS security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('process_purchase', 'calculate_wallet_deduction');

