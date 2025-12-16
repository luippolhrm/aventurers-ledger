-- Create standalone NPCs table that can be reused across shops
CREATE TABLE IF NOT EXISTS npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  resistances TEXT,
  story TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add npc_id column to shop_npcs to reference standalone NPCs (optional)
ALTER TABLE shop_npcs
  ADD COLUMN IF NOT EXISTS npc_id UUID REFERENCES npcs(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_npcs_campaign_id ON npcs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_shop_npcs_npc_id ON shop_npcs(npc_id);

-- Enable RLS
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign members can view NPCs from their campaigns
CREATE POLICY "Users can view npcs" ON npcs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM campaign_members
      WHERE campaign_members.campaign_id = npcs.campaign_id
        AND campaign_members.user_id = auth.uid()
    )
  );

-- Policy: GMs can create NPCs in their campaigns
CREATE POLICY "GMs can insert npcs" ON npcs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM campaigns
      WHERE campaigns.id = npcs.campaign_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Policy: GMs can update NPCs in their campaigns
CREATE POLICY "GMs can update npcs" ON npcs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM campaigns
      WHERE campaigns.id = npcs.campaign_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Policy: GMs can delete NPCs from their campaigns
CREATE POLICY "GMs can delete npcs" ON npcs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM campaigns
      WHERE campaigns.id = npcs.campaign_id
        AND campaigns.game_master_id = auth.uid()
    )
  );
