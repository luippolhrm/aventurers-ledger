-- Create inventory table for managing character items
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL, -- weapon, armor, equipment, consumable, treasure, other
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  weight NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (weight >= 0), -- weight in pounds
  value_in_copper INTEGER NOT NULL DEFAULT 0 CHECK (value_in_copper >= 0),
  description TEXT,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by character
CREATE INDEX IF NOT EXISTS idx_inventory_character_id ON inventory(character_id);

-- Create index for equipped items
CREATE INDEX IF NOT EXISTS idx_inventory_equipped ON inventory(character_id, equipped);

-- Enable Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can customize this later)
CREATE POLICY "Allow all operations on inventory" ON inventory
  FOR ALL
  USING (true)
  WITH CHECK (true);
