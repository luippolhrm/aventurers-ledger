-- ============================================================================
-- SCRIPT 062: Agregar shop_id y location_id a movements para compras
-- ============================================================================
-- Este script agrega campos opcionales para rastrear dónde se realizó
-- una compra (tienda y pueblo/location)
-- ============================================================================

-- Agregar columnas opcionales para shop y location
ALTER TABLE movements 
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE SET NULL;

ALTER TABLE movements 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_movements_shop ON movements(shop_id) WHERE shop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movements_location ON movements(location_id) WHERE location_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN movements.shop_id IS 'ID de la tienda donde se realizó la compra (solo para movement_type = purchase)';
COMMENT ON COLUMN movements.location_id IS 'ID de la ubicación/pueblo donde se realizó la compra (solo para movement_type = purchase)';

