-- Create dungeons table for dungeon-specific metadata
-- This table has a 1:1 optional relationship with locations
-- Only locations with location_type = 'dungeon' should have a dungeon record

CREATE TABLE IF NOT EXISTS dungeons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID UNIQUE NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  recommended_level INTEGER,
  difficulty_level TEXT, -- 'easy', 'medium', 'hard', 'deadly'
  is_cleared BOOLEAN DEFAULT FALSE,
  map_data JSONB, -- For future visual map features
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by location
CREATE INDEX IF NOT EXISTS idx_dungeons_location_id ON dungeons(location_id);

-- Enable RLS
ALTER TABLE dungeons ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign members can view dungeons from their campaigns
CREATE POLICY "Users can view dungeons" ON dungeons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM locations
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE locations.id = dungeons.location_id
        AND campaign_members.user_id = auth.uid()
    )
  );

-- Policy: GMs can create dungeons in their campaigns
CREATE POLICY "GMs can insert dungeons" ON dungeons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM locations
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE locations.id = dungeons.location_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Policy: GMs can update dungeons in their campaigns
CREATE POLICY "GMs can update dungeons" ON dungeons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM locations
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE locations.id = dungeons.location_id
        AND campaigns.game_master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM locations
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE locations.id = dungeons.location_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Policy: GMs can delete dungeons from their campaigns
CREATE POLICY "GMs can delete dungeons" ON dungeons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM locations
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE locations.id = dungeons.location_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

