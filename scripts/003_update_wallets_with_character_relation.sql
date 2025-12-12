-- Drop the old wallets table and recreate with proper foreign key relationship
DROP TABLE IF EXISTS public.wallets CASCADE;

-- Create wallets table with foreign key to characters
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL UNIQUE,
  platinum INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  electrum INTEGER NOT NULL DEFAULT 0,
  silver INTEGER NOT NULL DEFAULT 0,
  copper INTEGER NOT NULL DEFAULT 0,
  total_wealth DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_character
    FOREIGN KEY(character_id) 
    REFERENCES characters(id)
    ON DELETE CASCADE
);

-- Create index for faster lookups by character_id
CREATE INDEX IF NOT EXISTS idx_wallets_character_id ON public.wallets(character_id);

-- Create function to calculate total wealth in gold
CREATE OR REPLACE FUNCTION public.calculate_total_wealth(
  p_platinum INTEGER,
  p_gold INTEGER,
  p_electrum INTEGER,
  p_silver INTEGER,
  p_copper INTEGER
)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN (p_platinum * 10) + p_gold + (p_electrum * 0.5) + (p_silver * 0.1) + (p_copper * 0.01);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to update the updated_at timestamp and calculate total_wealth
CREATE OR REPLACE FUNCTION public.update_wallet_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.total_wealth = calculate_total_wealth(NEW.platinum, NEW.gold, NEW.electrum, NEW.silver, NEW.copper);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update metadata
DROP TRIGGER IF EXISTS update_wallets_metadata ON public.wallets;
CREATE TRIGGER update_wallets_metadata
  BEFORE INSERT OR UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_metadata();

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (customize based on your auth setup)
CREATE POLICY "Allow all operations on wallets" ON public.wallets
  FOR ALL
  USING (true)
  WITH CHECK (true);
