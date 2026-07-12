-- ============================================================================
-- SCRIPT 059: Stored Procedure para procesar compras de forma atómica
-- ============================================================================
-- Esta función procesa una compra completa en una transacción atómica:
-- 1. Valida stock
-- 2. Actualiza stock
-- 3. Agrega items al inventario
-- 4. Calcula deducción inteligente del wallet
-- 5. Actualiza wallet
-- 6. Crea registros en purchase_history
-- 7. Crea movimiento 'purchase' en movements
-- 8. Limpia carrito
-- ============================================================================

CREATE OR REPLACE FUNCTION process_purchase(
  p_character_id UUID,
  p_shop_id UUID,
  p_cart_items JSONB,  -- Array: [{"shop_item_id": "...", "quantity": 1}, ...]
  p_purchase_description TEXT
) RETURNS JSONB AS $$
DECLARE
  -- Variables para el wallet
  v_wallet RECORD;
  v_total_cost INTEGER := 0;
  v_total_in_copper INTEGER;
  v_new_wallet RECORD;
  
  -- Variables para items
  v_item JSONB;
  v_shop_item RECORD;
  v_item_total INTEGER;
  v_item_quantity INTEGER;
  v_cart_id UUID;
  v_purchase_id UUID;
  
  -- Variables para resultados
  v_purchase_ids UUID[] := ARRAY[]::UUID[];
  v_movement_id UUID;
  
  -- Variables para shop y location
  v_shop_name TEXT;
  v_location_name TEXT;
  v_location_id UUID;
  v_enhanced_description TEXT;
  
  -- Variables de control
  v_error_message TEXT;
BEGIN
  -- ========================================================================
  -- SECCIÓN 1: VALIDACIONES INICIALES
  -- ========================================================================
  
  -- Validar que el carrito existe
  SELECT id INTO v_cart_id
  FROM shopping_carts
  WHERE character_id = p_character_id AND shop_id = p_shop_id;
  
  IF v_cart_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart not found'
    );
  END IF;
  
  -- Validar que el wallet existe
  SELECT * INTO v_wallet
  FROM wallets
  WHERE character_id = p_character_id;
  
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Wallet not found'
    );
  END IF;
  
  -- ========================================================================
  -- SECCIÓN 2: VALIDAR STOCK Y CALCULAR TOTAL
  -- ========================================================================
  
  -- Iterar sobre cada item del carrito para validar stock y calcular total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    -- Obtener información del shop_item
    SELECT * INTO v_shop_item
    FROM shop_items
    WHERE id = (v_item->>'shop_item_id')::UUID;
    
    IF v_shop_item IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Shop item not found: ' || (v_item->>'shop_item_id')
      );
    END IF;
    
    -- Validar stock disponible
    IF v_shop_item.quantity_available < (v_item->>'quantity')::INTEGER THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient stock for ' || v_shop_item.item_name || 
                 '. Available: ' || v_shop_item.quantity_available || 
                 ', Requested: ' || (v_item->>'quantity')
      );
    END IF;
    
    -- Calcular total del item y acumular
    v_item_total := v_shop_item.price_in_copper * (v_item->>'quantity')::INTEGER;
    v_total_cost := v_total_cost + v_item_total;
  END LOOP;
  
  -- ========================================================================
  -- SECCIÓN 3: VALIDAR FONDOS
  -- ========================================================================
  
  -- Calcular total disponible en copper
  v_total_in_copper := 
    v_wallet.copper +
    (v_wallet.silver * 10)::INTEGER +
    (v_wallet.electrum * 50)::INTEGER +
    (v_wallet.gold * 100)::INTEGER +
    (v_wallet.platinum * 1000)::INTEGER;
  
  IF v_total_in_copper < v_total_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient funds. Required: ' || v_total_cost || 
               ' CP, Available: ' || v_total_in_copper || ' CP'
    );
  END IF;
  
  -- ========================================================================
  -- SECCIÓN 4: PROCESAR ITEMS (Actualizar stock, inventario, purchase_history)
  -- ========================================================================
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    -- Obtener shop_item
    SELECT * INTO v_shop_item
    FROM shop_items
    WHERE id = (v_item->>'shop_item_id')::UUID;
    
    v_item_total := v_shop_item.price_in_copper * (v_item->>'quantity')::INTEGER;
    
    -- 4a. Actualizar stock
    UPDATE shop_items
    SET quantity_available = quantity_available - (v_item->>'quantity')::INTEGER
    WHERE id = v_shop_item.id
      AND quantity_available >= (v_item->>'quantity')::INTEGER;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Failed to update stock for item: %', v_shop_item.item_name;
    END IF;
    
    -- 4b. Agregar a inventario
    INSERT INTO inventory (
      character_id,
      item_name,
      item_type,
      quantity,
      weight,
      value_in_copper,
      description
    ) VALUES (
      p_character_id,
      v_shop_item.item_name,
      v_shop_item.item_type,
      (v_item->>'quantity')::INTEGER,
      v_shop_item.weight * (v_item->>'quantity')::INTEGER,
      v_item_total,
      v_shop_item.description
    );
    
    -- 4c. Crear registro en purchase_history
    INSERT INTO purchase_history (
      character_id,
      shop_id,
      shop_item_id,
      item_name,
      item_type,
      quantity,
      price_per_unit,
      total_price
    ) VALUES (
      p_character_id,
      p_shop_id,
      v_shop_item.id,
      v_shop_item.item_name,
      v_shop_item.item_type,
      (v_item->>'quantity')::INTEGER,
      v_shop_item.price_in_copper,
      v_item_total
    ) RETURNING id INTO v_purchase_id;
    
    -- Agregar ID a la lista
    v_purchase_ids := array_append(v_purchase_ids, v_purchase_id);
  END LOOP;
  
  -- ========================================================================
  -- SECCIÓN 5: CALCULAR DEDUCCIÓN INTELIGENTE Y ACTUALIZAR WALLET
  -- ========================================================================
  
  -- Usar función auxiliar para calcular deducción
  SELECT * INTO v_new_wallet
  FROM calculate_wallet_deduction(
    v_total_cost,
    v_wallet.platinum,
    v_wallet.gold,
    v_wallet.electrum,
    v_wallet.silver,
    v_wallet.copper
  );
  
  -- Calcular nuevo total_wealth
  v_total_in_copper := 
    v_new_wallet.new_copper::INTEGER +
    (v_new_wallet.new_silver * 10)::INTEGER +
    (v_new_wallet.new_electrum * 50)::INTEGER +
    (v_new_wallet.new_gold * 100)::INTEGER +
    (v_new_wallet.new_platinum * 1000)::INTEGER;
  
  -- Actualizar wallet
  UPDATE wallets
  SET 
    platinum = v_new_wallet.new_platinum,
    gold = v_new_wallet.new_gold,
    electrum = v_new_wallet.new_electrum,
    silver = v_new_wallet.new_silver,
    copper = v_new_wallet.new_copper,
    total_wealth = (v_total_in_copper::NUMERIC / 100)
  WHERE character_id = p_character_id;
  
  -- ========================================================================
  -- SECCIÓN 6: OBTENER INFORMACIÓN DE SHOP Y LOCATION
  -- ========================================================================
  
  -- Obtener nombre de la tienda y location
  SELECT 
    s.name,
    s.location_id,
    l.name
  INTO 
    v_shop_name,
    v_location_id,
    v_location_name
  FROM shops s
  JOIN locations l ON l.id = s.location_id
  WHERE s.id = p_shop_id;
  
  -- Si no se encontró, usar valores por defecto
  IF v_shop_name IS NULL THEN
    v_shop_name := 'Tienda desconocida';
    v_location_name := 'Ubicación desconocida';
  END IF;
  
  -- ========================================================================
  -- SECCIÓN 7: CREAR MOVIMIENTO 'PURCHASE' EN MOVEMENTS
  -- ========================================================================
  
  -- Construir descripción mejorada con tienda y pueblo
  v_enhanced_description := p_purchase_description || ' (' || v_shop_name || ', ' || v_location_name || ')';
  
  INSERT INTO movements (
    character_id,
    from_currency,
    to_currency,
    amount_from,
    amount_to,
    movement_type,
    description,
    shop_id,
    location_id
  ) VALUES (
    p_character_id,
    'CP',
    'CP',
    v_total_cost,
    v_total_cost,
    'purchase',
    v_enhanced_description,
    p_shop_id,
    v_location_id
  ) RETURNING id INTO v_movement_id;
  
  -- ========================================================================
  -- SECCIÓN 8: LIMPIAR CARRITO
  -- ========================================================================
  
  DELETE FROM shopping_cart_items
  WHERE cart_id = v_cart_id;
  
  -- ========================================================================
  -- RETORNAR RESULTADO EXITOSO
  -- ========================================================================
  
  RETURN jsonb_build_object(
    'success', true,
    'purchase_ids', v_purchase_ids,
    'movement_id', v_movement_id,
    'total_cost', v_total_cost
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, PostgreSQL hace rollback automático de la transacción
    GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction failed: ' || v_error_message
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario de la función
COMMENT ON FUNCTION process_purchase IS 
'Procesa una compra completa de forma atómica. Valida stock y fondos, actualiza inventario, deduce dinero del wallet con algoritmo inteligente, y crea registros históricos. Todo en una transacción.';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION process_purchase TO authenticated;

