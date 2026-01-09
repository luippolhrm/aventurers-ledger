-- Create dungeon_rooms table for individual rooms within a dungeon
-- Each room represents a distinct area (entrance, combat room, treasure room, etc.)
-- Rooms can be ordered and positioned for future visual map features

CREATE TABLE IF NOT EXISTS dungeon_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT, -- 'entrance', 'combat', 'treasure', 'boss', 'puzzle', 'trap'
  order_index INTEGER DEFAULT 0, -- For ordering rooms
  position_x INTEGER, -- For future visual map features
  position_y INTEGER, -- For future visual map features
  connections JSONB, -- Array of room IDs that this room connects to (for future map features)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dungeon_rooms_dungeon_id ON dungeon_rooms(dungeon_id);
CREATE INDEX IF NOT EXISTS idx_dungeon_rooms_order_index ON dungeon_rooms(dungeon_id, order_index);

-- Enable RLS
ALTER TABLE dungeon_rooms ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign members can view dungeon rooms from their campaigns
CREATE POLICY "Users can view dungeon rooms" ON dungeon_rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM dungeons
      JOIN locations ON locations.id = dungeons.location_id
      JOIN campaign_members ON campaign_members.campaign_id = locations.campaign_id
      WHERE dungeons.id = dungeon_rooms.dungeon_id
        AND campaign_members.user_id = auth.uid()
    )
  );

-- Policy: GMs can create dungeon rooms in their campaigns
CREATE POLICY "GMs can insert dungeon rooms" ON dungeon_rooms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM dungeons
      JOIN locations ON locations.id = dungeons.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE dungeons.id = dungeon_rooms.dungeon_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Policy: GMs can update dungeon rooms in their campaigns
CREATE POLICY "GMs can update dungeon rooms" ON dungeon_rooms
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM dungeons
      JOIN locations ON locations.id = dungeons.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE dungeons.id = dungeon_rooms.dungeon_id
        AND campaigns.game_master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM dungeons
      JOIN locations ON locations.id = dungeons.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE dungeons.id = dungeon_rooms.dungeon_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Policy: GMs can delete dungeon rooms from their campaigns
CREATE POLICY "GMs can delete dungeon rooms" ON dungeon_rooms
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM dungeons
      JOIN locations ON locations.id = dungeons.location_id
      JOIN campaigns ON campaigns.id = locations.campaign_id
      WHERE dungeons.id = dungeon_rooms.dungeon_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

