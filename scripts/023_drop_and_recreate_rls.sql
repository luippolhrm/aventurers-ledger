-- Drop ALL possible RLS policies that may exist
DROP POLICY IF EXISTS "characters_select_own" ON characters;
DROP POLICY IF EXISTS "characters_insert_own" ON characters;
DROP POLICY IF EXISTS "characters_update_own" ON characters;
DROP POLICY IF EXISTS "characters_delete_own" ON characters;
DROP POLICY IF EXISTS "users_select_own_characters" ON characters;
DROP POLICY IF EXISTS "users_insert_own_characters" ON characters;
DROP POLICY IF EXISTS "users_update_own_characters" ON characters;
DROP POLICY IF EXISTS "users_delete_own_characters" ON characters;

DROP POLICY IF EXISTS "campaigns_select_own_or_member" ON campaigns;
DROP POLICY IF EXISTS "campaigns_insert_own" ON campaigns;
DROP POLICY IF EXISTS "campaigns_update_own" ON campaigns;
DROP POLICY IF EXISTS "campaigns_delete_own" ON campaigns;
DROP POLICY IF EXISTS "users_select_campaigns" ON campaigns;
DROP POLICY IF EXISTS "users_insert_campaigns" ON campaigns;
DROP POLICY IF EXISTS "users_update_own_campaigns" ON campaigns;
DROP POLICY IF EXISTS "users_delete_own_campaigns" ON campaigns;
DROP POLICY IF EXISTS "users_select_member_campaigns" ON campaigns;

DROP POLICY IF EXISTS "campaign_members_select" ON campaign_members;
DROP POLICY IF EXISTS "campaign_members_insert_own" ON campaign_members;
DROP POLICY IF EXISTS "campaign_members_delete_own" ON campaign_members;
DROP POLICY IF EXISTS "users_select_campaign_members" ON campaign_members;
DROP POLICY IF EXISTS "users_insert_campaign_members" ON campaign_members;

-- Now create the clean, simple policies
CREATE POLICY "characters_select_own" ON characters
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "characters_insert_own" ON characters
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "characters_update_own" ON characters
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "characters_delete_own" ON characters
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "campaigns_select_own_or_member" ON campaigns
  FOR SELECT USING (game_master_id = auth.uid());

CREATE POLICY "campaigns_insert_own" ON campaigns
  FOR INSERT WITH CHECK (game_master_id = auth.uid());

CREATE POLICY "campaigns_update_own" ON campaigns
  FOR UPDATE USING (game_master_id = auth.uid())
  WITH CHECK (game_master_id = auth.uid());

CREATE POLICY "campaigns_delete_own" ON campaigns
  FOR DELETE USING (game_master_id = auth.uid());

CREATE POLICY "campaign_members_select" ON campaign_members
  FOR SELECT USING (true);

CREATE POLICY "campaign_members_insert_own" ON campaign_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "campaign_members_delete_own" ON campaign_members
  FOR DELETE USING (user_id = auth.uid());
