-- ============================================================================
-- SCRIPT 035: Enable RLS (Row Level Security) on ALL tables
-- ============================================================================
-- Purpose: Re-enable RLS with proper policies after being disabled in previous scripts
-- Impact: CRITICAL - Security fix for all tables
-- ============================================================================

-- ====================
-- PROFILES TABLE
-- ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ====================
-- CHARACTERS TABLE
-- ====================
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Users can view their own characters
CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own characters
CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own characters
CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own characters
CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (user_id = auth.uid());

-- ====================
-- WALLETS TABLE
-- ====================
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can view wallets of their own characters
CREATE POLICY "Users can view own character wallets"
  ON wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = wallets.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Users can update wallets of their own characters
CREATE POLICY "Users can update own character wallets"
  ON wallets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = wallets.character_id
      AND characters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = wallets.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Users can insert wallets for their own characters
CREATE POLICY "Users can insert own character wallets"
  ON wallets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = wallets.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ====================
-- MOVEMENTS TABLE
-- ====================
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Users can view movements of their own characters
CREATE POLICY "Users can view own character movements"
  ON movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = movements.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Users can insert movements for their own characters
CREATE POLICY "Users can insert own character movements"
  ON movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = movements.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ====================
-- TRANSFERS TABLE
-- ====================
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Users can view transfers where they are sender OR receiver
CREATE POLICY "Users can view own transfers"
  ON transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE (characters.id = transfers.from_character_id
        OR characters.id = transfers.to_character_id)
      AND characters.user_id = auth.uid()
    )
  );

-- Users can insert transfers FROM their own characters
CREATE POLICY "Users can insert transfers from own characters"
  ON transfers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = transfers.from_character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ====================
-- INVENTORY TABLE
-- ====================
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Users can view inventory of their own characters
CREATE POLICY "Users can view own character inventory"
  ON inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = inventory.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Users can insert inventory items for their own characters
CREATE POLICY "Users can insert own character inventory"
  ON inventory FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = inventory.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Users can update inventory items of their own characters
CREATE POLICY "Users can update own character inventory"
  ON inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = inventory.character_id
      AND characters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = inventory.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Users can delete inventory items of their own characters
CREATE POLICY "Users can delete own character inventory"
  ON inventory FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = inventory.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- ====================
-- CAMPAIGNS TABLE
-- ====================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone can view campaigns they are a member of
CREATE POLICY "Users can view campaigns they are members of"
  ON campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_members
      WHERE campaign_members.campaign_id = campaigns.id
      AND campaign_members.user_id = auth.uid()
    )
  );

-- Game Masters can update their campaigns
CREATE POLICY "Game Masters can update their campaigns"
  ON campaigns FOR UPDATE
  USING (game_master_id = auth.uid())
  WITH CHECK (game_master_id = auth.uid());

-- Users can create campaigns (they become GM automatically)
CREATE POLICY "Users can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (game_master_id = auth.uid());

-- Game Masters can delete their campaigns
CREATE POLICY "Game Masters can delete their campaigns"
  ON campaigns FOR DELETE
  USING (game_master_id = auth.uid());

-- ====================
-- CAMPAIGN_MEMBERS TABLE
-- ====================
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of campaigns they belong to
CREATE POLICY "Users can view campaign members"
  ON campaign_members FOR SELECT
  USING (
    -- IMPORTANT: keep this policy NON-RELATIONAL to avoid RLS recursion loops.
    -- campaign_members is queried by /campaigns policies; if we also query campaigns here,
    -- Postgres can detect infinite recursion.
    user_id = auth.uid()
  );

-- Users can join campaigns (insert themselves)
CREATE POLICY "Users can join campaigns"
  ON campaign_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can leave campaigns (delete themselves)
CREATE POLICY "Users can leave campaigns"
  ON campaign_members FOR DELETE
  USING (user_id = auth.uid());

-- Game Masters can remove members from their campaigns
CREATE POLICY "GMs can remove members from their campaigns"
  ON campaign_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_members.campaign_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- ====================
-- LOCATIONS TABLE
-- ====================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Users can view locations in campaigns they are members of
CREATE POLICY "Users can view locations in their campaigns"
  ON locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_members
      WHERE campaign_members.campaign_id = locations.campaign_id
      AND campaign_members.user_id = auth.uid()
    )
  );

-- Game Masters can create locations in their campaigns
CREATE POLICY "GMs can create locations in their campaigns"
  ON locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = locations.campaign_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- Game Masters can update locations in their campaigns
CREATE POLICY "GMs can update locations in their campaigns"
  ON locations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = locations.campaign_id
      AND campaigns.game_master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = locations.campaign_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- Game Masters can delete locations in their campaigns
CREATE POLICY "GMs can delete locations in their campaigns"
  ON locations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = locations.campaign_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- ====================
-- SHOPS TABLE
-- ====================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Users can view shops in locations of campaigns they are members of
CREATE POLICY "Users can view shops in their campaigns"
  ON shops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE locations.id = shops.location_id
      AND campaign_members.user_id = auth.uid()
    )
  );

-- Game Masters can create shops in their campaign locations
CREATE POLICY "GMs can create shops in their campaigns"
  ON shops FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE locations.id = shops.location_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- Game Masters can update shops in their campaign locations
CREATE POLICY "GMs can update shops in their campaigns"
  ON shops FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE locations.id = shops.location_id
      AND campaigns.game_master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE locations.id = shops.location_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- Game Masters can delete shops in their campaign locations
CREATE POLICY "GMs can delete shops in their campaigns"
  ON shops FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE locations.id = shops.location_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- ====================
-- SHOP_ITEMS TABLE
-- ====================
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Users can view shop items in campaigns they are members of
CREATE POLICY "Users can view shop items in their campaigns"
  ON shop_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE shops.id = shop_items.shop_id
      AND campaign_members.user_id = auth.uid()
    )
  );

-- Game Masters can create shop items in their campaigns
CREATE POLICY "GMs can create shop items in their campaigns"
  ON shop_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE shops.id = shop_items.shop_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- Game Masters can update shop items in their campaigns
CREATE POLICY "GMs can update shop items in their campaigns"
  ON shop_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE shops.id = shop_items.shop_id
      AND campaigns.game_master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE shops.id = shop_items.shop_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- Game Masters can delete shop items in their campaigns
CREATE POLICY "GMs can delete shop items in their campaigns"
  ON shop_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE shops.id = shop_items.shop_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- Next steps:
-- 1. Test all queries to ensure RLS policies work correctly
-- 2. Monitor performance impact of RLS checks
-- 3. Consider adding indexes for frequently joined tables in RLS policies
-- ============================================================================
