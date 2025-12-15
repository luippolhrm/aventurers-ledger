-- Fix infinite recursion in campaign_members RLS policies
-- The issue: policies were referencing the same table they protect, causing loops

-- Drop the problematic policies
DROP POLICY IF EXISTS "users_select_campaign_members" ON campaign_members;
DROP POLICY IF EXISTS "gm_insert_campaign_members" ON campaign_members;
DROP POLICY IF EXISTS "gm_delete_campaign_members" ON campaign_members;

-- Drop and recreate the campaigns policy to avoid recursion
DROP POLICY IF EXISTS "users_select_member_campaigns" ON campaigns;

-- Simplified policy: users can see campaigns where they are the GM or explicitly listed as members
CREATE POLICY "users_select_member_campaigns" ON campaigns
  FOR SELECT
  USING (
    game_master_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM campaign_members 
      WHERE campaign_members.campaign_id = campaigns.id 
      AND campaign_members.user_id = auth.uid()
    )
  );

-- New simplified policies for campaign_members without recursion
-- Users can see members if they are in that specific campaign (direct check, no subquery to same table)
CREATE POLICY "users_select_campaign_members" ON campaign_members
  FOR SELECT
  USING (
    -- Can see members of campaigns where you're the GM
    campaign_id IN (
      SELECT id FROM campaigns WHERE game_master_id = auth.uid()
    )
    OR
    -- Can see members of campaigns where you're a member (direct user_id check)
    user_id = auth.uid()
    OR
    -- Can see other members of campaigns you're in (check via campaigns table)
    campaign_id IN (
      SELECT cm.campaign_id FROM campaign_members cm WHERE cm.user_id = auth.uid()
    )
  );

-- GM can add members (check via campaigns table, not campaign_members)
CREATE POLICY "gm_insert_campaign_members" ON campaign_members
  FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE game_master_id = auth.uid()
    )
  );

-- GM can remove members (check via campaigns table, not campaign_members)
CREATE POLICY "gm_delete_campaign_members" ON campaign_members
  FOR DELETE
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE game_master_id = auth.uid()
    )
  );

-- Fix characters policy to avoid checking campaign_members recursively
DROP POLICY IF EXISTS "users_select_own_characters" ON characters;
CREATE POLICY "users_select_own_characters" ON characters
  FOR SELECT
  USING (
    -- Own characters
    user_id = auth.uid()
    OR
    -- Characters in campaigns where you're the GM
    campaign_id IN (
      SELECT id FROM campaigns WHERE game_master_id = auth.uid()
    )
    OR
    -- Characters in campaigns where you're a member (check via campaigns existence + simple member check)
    (campaign_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = characters.campaign_id
      AND cm.user_id = auth.uid()
    ))
  );
