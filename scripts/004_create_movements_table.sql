-- Create movements table to track currency conversions
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  from_currency TEXT NOT NULL CHECK (from_currency IN ('PP', 'GP', 'EP', 'SP', 'CP')),
  to_currency TEXT NOT NULL CHECK (to_currency IN ('PP', 'GP', 'EP', 'SP', 'CP')),
  amount_from DECIMAL(10, 2) NOT NULL CHECK (amount_from > 0),
  amount_to DECIMAL(10, 2) NOT NULL CHECK (amount_to > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_movements_character ON movements(character_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON movements(created_at DESC);
