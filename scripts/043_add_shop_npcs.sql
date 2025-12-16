-- Add location_type column to track what kind of place it is
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS location_type TEXT;

-- Add shop_type column so GMs puedan clasificar negocios (posada, herrería, etc.)
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS shop_type TEXT;

-- Create table that stores optional NPCs por tienda
CREATE TABLE IF NOT EXISTS shop_npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  resistances TEXT,
  story TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para búsquedas por tienda
CREATE INDEX IF NOT EXISTS idx_shop_npcs_shop_id ON shop_npcs(shop_id);

-- Habilitar RLS
ALTER TABLE shop_npcs ENABLE ROW LEVEL SECURITY;

-- Policy: los miembros pueden ver los NPCs de las tiendas de sus campañas
CREATE POLICY "Users can view shop npcs" ON shop_npcs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE shops.id = shop_npcs.shop_id
        AND campaign_members.user_id = auth.uid()
    )
  );

-- Policy: los GMs pueden crear NPCs asociados a sus campañas
CREATE POLICY "GMs can insert shop npcs" ON shop_npcs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE shops.id = shop_npcs.shop_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Policy: los GMs pueden actualizar NPCs en sus campañas
CREATE POLICY "GMs can update shop npcs" ON shop_npcs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE shops.id = shop_npcs.shop_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Policy: los GMs pueden borrar NPCs en sus tiendas
CREATE POLICY "GMs can delete shop npcs" ON shop_npcs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE shops.id = shop_npcs.shop_id
        AND campaigns.game_master_id = auth.uid()
    )
  );
