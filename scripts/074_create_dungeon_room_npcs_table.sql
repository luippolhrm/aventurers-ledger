-- Create dungeon_room_npcs table to associate NPCs with dungeon rooms
-- Similar to shop_npcs, this allows NPCs to be placed in specific rooms
-- NPCs can be standalone (referenced via npc_id) or inline (stored directly)

CREATE TABLE IF NOT EXISTS dungeon_room_npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dungeon_room_id UUID NOT NULL REFERENCES dungeon_rooms(id) ON DELETE CASCADE,
  npc_id UUID REFERENCES npcs(id) ON DELETE SET NULL, -- Optional: reference to standalone NPC
  name TEXT, -- If npc_id is null, store NPC data inline
  title TEXT,
  resistances TEXT,
  story TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure either npc_id or name is provided
  CONSTRAINT dungeon_room_npcs_npc_or_name CHECK (npc_id IS NOT NULL OR name IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dungeon_room_npcs_room_id ON dungeon_room_npcs(dungeon_room_id);
CREATE INDEX IF NOT EXISTS idx_dungeon_room_npcs_npc_id ON dungeon_room_npcs(npc_id);

-- Enable RLS
ALTER TABLE dungeon_room_npcs ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign members can view NPCs in dungeon rooms from their campaigns
CREATE POLICY "Users can view dungeon room npcs" ON dungeon_room_npcs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM dungeon_rooms
      JOIN dungeons ON dungeons.id = dungeon_rooms.dungeon_id
      JOIN locations ON locations.id = dungeons.location_id
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE dungeon_rooms.id = dungeon_room_npcs.dungeon_room_id
        AND campaign_members.user_id = auth.uid()
    )
  );

-- Policy: GMs can create NPCs in dungeon rooms of their campaigns
CREATE POLICY "GMs can insert dungeon room npcs" ON dungeon_room_npcs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM dungeon_rooms
      JOIN dungeons ON dungeons.id = dungeon_rooms.dungeon_id
      JOIN locations ON locations.id = dungeons.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE dungeon_rooms.id = dungeon_room_npcs.dungeon_room_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Policy: GMs can update NPCs in dungeon rooms of their campaigns
CREATE POLICY "GMs can update dungeon room npcs" ON dungeon_room_npcs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM dungeon_rooms
      JOIN dungeons ON dungeons.id = dungeon_rooms.dungeon_id
      JOIN locations ON locations.id = dungeons.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE dungeon_rooms.id = dungeon_room_npcs.dungeon_room_id
        AND campaigns.game_master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM dungeon_rooms
      JOIN dungeons ON dungeons.id = dungeon_rooms.dungeon_id
      JOIN locations ON locations.id = dungeons.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE dungeon_rooms.id = dungeon_room_npcs.dungeon_room_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Policy: GMs can delete NPCs from dungeon rooms of their campaigns
CREATE POLICY "GMs can delete dungeon room npcs" ON dungeon_room_npcs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM dungeon_rooms
      JOIN dungeons ON dungeons.id = dungeon_rooms.dungeon_id
      JOIN locations ON locations.id = dungeons.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE dungeon_rooms.id = dungeon_room_npcs.dungeon_room_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

