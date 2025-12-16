-- Enable Row Level Security on locations, shops, and shop_items
-- and restrict access to campaign members and GMs.

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Campaign members can view locations associated to their campaign
CREATE POLICY "Campaign members can view locations" ON locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM campaign_members
      WHERE campaign_members.campaign_id = locations.campaign_id
        AND campaign_members.user_id = auth.uid()
    )
  );

-- GMs can create/update/delete locations for their campaigns
CREATE POLICY "GMs can manage locations" ON locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM campaigns
      WHERE campaigns.id = locations.campaign_id
        AND campaigns.game_master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM campaigns
      WHERE campaigns.id = locations.campaign_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Campaign members can view shops inside their locations
CREATE POLICY "Campaign members can view shops" ON shops
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM locations
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE locations.id = shops.location_id
        AND campaign_members.user_id = auth.uid()
    )
  );

-- GMs can manage shops in their campaigns
CREATE POLICY "GMs can manage shops" ON shops
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM locations
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE locations.id = shops.location_id
        AND campaigns.game_master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM locations
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE locations.id = shops.location_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Campaign members can view items for shops in their campaigns
CREATE POLICY "Campaign members can view shop items" ON shop_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE shops.id = shop_items.shop_id
        AND campaign_members.user_id = auth.uid()
    )
  );

-- GMs can manage shop items for their campaigns
CREATE POLICY "GMs can manage shop items" ON shop_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE shops.id = shop_items.shop_id
        AND campaigns.game_master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM shops
      JOIN locations ON locations.id = shops.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE shops.id = shop_items.shop_id
        AND campaigns.game_master_id = auth.uid()
    )
  );
