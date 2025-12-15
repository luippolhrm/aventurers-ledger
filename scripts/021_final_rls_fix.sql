-- Script 021: Final RLS Fix - Eliminar completamente recursión
-- Este script elimina TODAS las políticas existentes y crea versiones simples sin recursión

-- ============================================
-- PASO 1: Eliminar TODAS las políticas existentes
-- ============================================

-- Eliminar políticas de characters
DROP POLICY IF EXISTS "users_select_own_characters" ON characters;
DROP POLICY IF EXISTS "users_insert_own_characters" ON characters;
DROP POLICY IF EXISTS "users_update_own_characters" ON characters;
DROP POLICY IF EXISTS "users_delete_own_characters" ON characters;

-- Eliminar políticas de campaigns
DROP POLICY IF EXISTS "users_select_own_campaigns" ON campaigns;
DROP POLICY IF EXISTS "users_select_member_campaigns" ON campaigns;
DROP POLICY IF EXISTS "users_insert_campaigns" ON campaigns;
DROP POLICY IF EXISTS "users_update_own_campaigns" ON campaigns;
DROP POLICY IF EXISTS "users_delete_own_campaigns" ON campaigns;

-- Eliminar políticas de campaign_members
DROP POLICY IF EXISTS "users_select_campaign_members" ON campaign_members;
DROP POLICY IF EXISTS "gm_insert_campaign_members" ON campaign_members;
DROP POLICY IF EXISTS "gm_update_campaign_members" ON campaign_members;
DROP POLICY IF EXISTS "gm_delete_campaign_members" ON campaign_members;

-- Eliminar políticas de wallets
DROP POLICY IF EXISTS "users_select_own_wallets" ON wallets;
DROP POLICY IF EXISTS "users_insert_own_wallets" ON wallets;
DROP POLICY IF EXISTS "users_update_own_wallets" ON wallets;
DROP POLICY IF EXISTS "users_delete_own_wallets" ON wallets;

-- Eliminar políticas de inventory
DROP POLICY IF EXISTS "users_select_own_inventory" ON inventory;
DROP POLICY IF EXISTS "users_insert_own_inventory" ON inventory;
DROP POLICY IF EXISTS "users_update_own_inventory" ON inventory;
DROP POLICY IF EXISTS "users_delete_own_inventory" ON inventory;

-- Eliminar políticas de transfers
DROP POLICY IF EXISTS "users_select_own_transfers" ON transfers;
DROP POLICY IF EXISTS "users_insert_own_transfers" ON transfers;

-- Eliminar políticas de movements
DROP POLICY IF EXISTS "users_select_own_movements" ON movements;
DROP POLICY IF EXISTS "users_insert_own_movements" ON movements;

-- Eliminar políticas de profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- ============================================
-- PASO 2: Crear políticas SIMPLES sin recursión
-- ============================================

-- PROFILES: Solo acceso a tu propio perfil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- CHARACTERS: Solo acceso a tus propios personajes
CREATE POLICY "characters_select_own" ON characters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "characters_insert_own" ON characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "characters_update_own" ON characters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "characters_delete_own" ON characters
  FOR DELETE USING (auth.uid() = user_id);

-- WALLETS: Solo acceso a wallets de tus personajes
CREATE POLICY "wallets_select_own" ON wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = wallets.character_id 
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "wallets_insert_own" ON wallets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = wallets.character_id 
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "wallets_update_own" ON wallets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = wallets.character_id 
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "wallets_delete_own" ON wallets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = wallets.character_id 
      AND characters.user_id = auth.uid()
    )
  );

-- INVENTORY: Solo acceso a inventario de tus personajes
CREATE POLICY "inventory_select_own" ON inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = inventory.character_id 
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "inventory_insert_own" ON inventory
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = inventory.character_id 
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "inventory_update_own" ON inventory
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = inventory.character_id 
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "inventory_delete_own" ON inventory
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = inventory.character_id 
      AND characters.user_id = auth.uid()
    )
  );

-- TRANSFERS: Solo acceso a transferencias de tus personajes
CREATE POLICY "transfers_select_own" ON transfers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM characters 
      WHERE (characters.id = transfers.from_character_id OR characters.id = transfers.to_character_id)
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "transfers_insert_own" ON transfers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = transfers.from_character_id 
      AND characters.user_id = auth.uid()
    )
  );

-- MOVEMENTS: Solo acceso a movimientos de tus wallets
CREATE POLICY "movements_select_own" ON movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets
      JOIN characters ON characters.id = wallets.character_id
      WHERE wallets.id = movements.wallet_id 
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "movements_insert_own" ON movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wallets
      JOIN characters ON characters.id = wallets.character_id
      WHERE wallets.id = movements.wallet_id 
      AND characters.user_id = auth.uid()
    )
  );

-- CAMPAIGNS: Versión MUY SIMPLE - solo el creador puede ver/editar
-- NO hacemos JOINs a campaign_members para evitar recursión
CREATE POLICY "campaigns_select_gm" ON campaigns
  FOR SELECT USING (auth.uid() = game_master_id);

CREATE POLICY "campaigns_insert_own" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = game_master_id);

CREATE POLICY "campaigns_update_gm" ON campaigns
  FOR UPDATE USING (auth.uid() = game_master_id);

CREATE POLICY "campaigns_delete_gm" ON campaigns
  FOR DELETE USING (auth.uid() = game_master_id);

-- CAMPAIGN_MEMBERS: Versión MUY SIMPLE - solo verificar user_id directo
-- NO hacemos JOINs a campaigns para evitar recursión
CREATE POLICY "campaign_members_select_own" ON campaign_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "campaign_members_insert_own" ON campaign_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaign_members_delete_own" ON campaign_members
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PASO 3: Verificar que RLS esté habilitado
-- ============================================

-- Asegurar que RLS esté habilitado en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
