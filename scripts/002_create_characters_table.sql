-- Create characters table
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  race TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);

-- Add RLS policies
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can customize this based on your auth setup)
CREATE POLICY "Allow all operations on characters" ON characters
  FOR ALL
  USING (true)
  WITH CHECK (true);
