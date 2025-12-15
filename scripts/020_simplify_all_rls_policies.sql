-- Simplify ALL RLS policies to completely eliminate recursion
-- Strategy: Make policies simple and direct, avoid complex JOINs between RLS-protected tables

-- ===========================================
-- 1. CAMPAIGNS TABLE - Keep it super simple
-- ===========================================
DROP POLICY IF EXISTS "users_select_member_campaigns" ON campaigns;

-- Users can see campaigns where they are the GM (direct check, no joins)
CREATE POLICY "users_select_own_gm_campaigns" ON campaigns
  FOR SELECT
  USING (game_master_id = auth.uid());

-- ===========================================
-- 2. CAMPAIGN_MEMBERS TABLE - Simple checks only
-- ===========================================
DROP POLICY IF EXISTS "users_select_campaign_members" ON campaign_members;
DROP POLICY IF EXISTS "gm_insert_campaign_members" ON campaign_members;
DROP POLICY IF EXISTS "gm_delete_campaign_members" ON campaign_members;

-- Users can see their own membership records
CREATE POLICY "users_select_own_memberships" ON campaign_members
  FOR SELECT
  USING (user_id = auth.uid());

-- GMs can insert members (but we'll verify in application code for now)
CREATE POLICY "users_insert_campaign_members" ON campaign_members
  FOR INSERT
  WITH CHECK (true); -- We'll handle authorization in application code

-- Users can delete their own memberships (leave campaign)
CREATE POLICY "users_delete_own_memberships" ON campaign_members
  FOR DELETE
  USING (user_id = auth.uid());

-- ===========================================
-- 3. CHARACTERS TABLE - Simplify to avoid recursion
-- ===========================================
DROP POLICY IF EXISTS "users_select_own_characters" ON characters;

-- Users can only see their own characters (no campaign checks in RLS)
-- We'll handle campaign visibility in application code
CREATE POLICY "users_select_own_characters_simple" ON characters
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_characters" ON characters;
CREATE POLICY "users_insert_own_characters_simple" ON characters
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_characters" ON characters;
CREATE POLICY "users_update_own_characters_simple" ON characters
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_delete_own_characters" ON characters;
CREATE POLICY "users_delete_own_characters_simple" ON characters
  FOR DELETE
  USING (user_id = auth.uid());

-- Note: We've simplified RLS policies to avoid recursion.
-- Campaign-based access control (GM seeing player characters) will be
-- handled at the application level with explicit queries.
