-- Create npc_inventory table for NPCs to hold treasure (items and currency)
-- Similar to the inventory table for characters, but without equipment-related fields
-- NPCs can have items that can be distributed to players

CREATE TABLE IF NOT EXISTS npc_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'weapon', 'armor', 'equipment', 'consumable', 'treasure', 'currency', 'other'
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  weight NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (weight >= 0),
  value_in_copper INTEGER NOT NULL DEFAULT 0 CHECK (value_in_copper >= 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by NPC
CREATE INDEX IF NOT EXISTS idx_npc_inventory_npc_id ON npc_inventory(npc_id);

-- Enable RLS
ALTER TABLE npc_inventory ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign members can view NPC inventories from their campaigns
CREATE POLICY "Users can view npc inventory" ON npc_inventory
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM npcs
      JOIN campaign_members ON campaign_members.campaign_id = npcs.campaign_id
      WHERE npcs.id = npc_inventory.npc_id
        AND campaign_members.user_id = auth.uid()
    )
  );

-- Policy: GMs can manage NPC inventories in their campaigns
CREATE POLICY "GMs can manage npc inventory" ON npc_inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM npcs
      JOIN campaigns ON campaigns.id = npcs.campaign_id
      WHERE npcs.id = npc_inventory.npc_id
        AND campaigns.game_master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM npcs
      JOIN campaigns ON campaigns.id = npcs.campaign_id
      WHERE npcs.id = npc_inventory.npc_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

