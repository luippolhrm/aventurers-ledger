-- Create transfers table for player-to-player transactions
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  to_character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  currency VARCHAR(2) NOT NULL CHECK (currency IN ('PP', 'GP', 'EP', 'SP', 'CP')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent self-transfers
  CONSTRAINT no_self_transfer CHECK (from_character_id != to_character_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transfers_from_character ON transfers(from_character_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_character ON transfers(to_character_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at DESC);

-- Add RLS policies
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can be restricted based on auth later)
CREATE POLICY "Allow all transfers operations" ON transfers
  FOR ALL
  USING (true)
  WITH CHECK (true);
