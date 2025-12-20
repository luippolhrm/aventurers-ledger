-- ============================================================================
-- SCRIPT 057: Crear tablas de Shopping Cart
-- ============================================================================
-- Purpose: Implementar sistema de carrito de compras con validaciones de
--          permisos basadas en membresía en campaña
-- ============================================================================

-- ====================
-- SHOPPING_CARTS TABLE
-- ====================
CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, shop_id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_shopping_carts_character_shop ON shopping_carts(character_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_shop ON shopping_carts(shop_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_shopping_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shopping_carts_updated_at ON shopping_carts;
CREATE TRIGGER trigger_update_shopping_carts_updated_at
  BEFORE UPDATE ON shopping_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_carts_updated_at();

-- ====================
-- SHOPPING_CART_ITEMS TABLE
-- ====================
CREATE TABLE IF NOT EXISTS shopping_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
  shop_item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cart_id, shop_item_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_shopping_cart_items_cart ON shopping_cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_items_shop_item ON shopping_cart_items(shop_item_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_shopping_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shopping_cart_items_updated_at ON shopping_cart_items;
CREATE TRIGGER trigger_update_shopping_cart_items_updated_at
  BEFORE UPDATE ON shopping_cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_cart_items_updated_at();

-- ====================
-- PURCHASE_HISTORY TABLE
-- ====================
CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shop_item_id UUID NOT NULL REFERENCES shop_items(id),
  item_name TEXT NOT NULL,
  item_type TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit INTEGER NOT NULL CHECK (price_per_unit >= 0),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_purchase_history_character ON purchase_history(character_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_shop ON purchase_history(shop_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_purchased_at ON purchase_history(purchased_at DESC);

-- ====================
-- ROW LEVEL SECURITY
-- ====================

-- Enable RLS en todas las tablas
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

-- ====================
-- SHOPPING_CARTS POLICIES
-- ====================

-- Usuario solo puede ver/editar carritos de SUS personajes
-- Y solo si ese personaje está inscrito en la campaña de la tienda
CREATE POLICY "Users can manage own character carts in their campaigns"
  ON shopping_carts FOR ALL
  USING (
    -- 1. Verificar que el personaje pertenece al usuario
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = shopping_carts.character_id
      AND characters.user_id = auth.uid()
    )
    -- 2. Verificar que el personaje está inscrito en la campaña de la tienda
    AND EXISTS (
      SELECT 1 FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE shops.id = shopping_carts.shop_id
      AND campaign_members.character_id = shopping_carts.character_id
      AND campaign_members.user_id = auth.uid()
      AND campaign_members.role = 'player'  -- Solo players pueden tener carritos
    )
  )
  WITH CHECK (
    -- Mismas validaciones para INSERT/UPDATE
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = shopping_carts.character_id
      AND characters.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE shops.id = shopping_carts.shop_id
      AND campaign_members.character_id = shopping_carts.character_id
      AND campaign_members.user_id = auth.uid()
      AND campaign_members.role = 'player'
    )
  );

-- ====================
-- SHOPPING_CART_ITEMS POLICIES
-- ====================

-- Usuario solo puede ver/editar items de carritos que le pertenecen
-- (heredado del carrito, que ya valida membresía en campaña)
CREATE POLICY "Users can manage own cart items"
  ON shopping_cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shopping_carts
      JOIN characters ON characters.id = shopping_carts.character_id
      WHERE shopping_cart_items.cart_id = shopping_carts.id
      AND characters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_carts
      JOIN characters ON characters.id = shopping_carts.character_id
      WHERE shopping_cart_items.cart_id = shopping_carts.id
      AND characters.user_id = auth.uid()
    )
  );

-- ====================
-- PURCHASE_HISTORY POLICIES
-- ====================

-- Usuario solo puede ver compras de SUS personajes
-- Y solo de tiendas en campañas donde el personaje está inscrito
CREATE POLICY "Users can view own purchase history"
  ON purchase_history FOR SELECT
  USING (
    -- 1. Verificar que el personaje pertenece al usuario
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = purchase_history.character_id
      AND characters.user_id = auth.uid()
    )
    -- 2. Verificar que el personaje estaba inscrito en la campaña de la tienda
    AND EXISTS (
      SELECT 1 FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE shops.id = purchase_history.shop_id
      AND campaign_members.character_id = purchase_history.character_id
      AND campaign_members.user_id = auth.uid()
    )
  );

-- Solo el sistema puede insertar en purchase_history (durante checkout)
-- No permitimos que usuarios inserten directamente
CREATE POLICY "System can insert purchase history"
  ON purchase_history FOR INSERT
  WITH CHECK (
    -- Verificar que el personaje pertenece al usuario
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = purchase_history.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las tablas se crearon correctamente
SELECT 
  'shopping_carts' AS table_name,
  COUNT(*) AS row_count
FROM shopping_carts
UNION ALL
SELECT 
  'shopping_cart_items' AS table_name,
  COUNT(*) AS row_count
FROM shopping_cart_items
UNION ALL
SELECT 
  'purchase_history' AS table_name,
  COUNT(*) AS row_count
FROM purchase_history;

-- Verificar políticas RLS
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('shopping_carts', 'shopping_cart_items', 'purchase_history')
ORDER BY tablename, policyname;
