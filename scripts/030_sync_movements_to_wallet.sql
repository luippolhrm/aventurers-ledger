-- Script to synchronize wallet balances with movements history
-- This ensures the wallet total_wealth is always calculated from the movements table

-- First, add movement_type column if it doesn't exist
ALTER TABLE movements 
ADD COLUMN IF NOT EXISTS movement_type TEXT CHECK (movement_type IN ('add', 'remove', 'conversion'));

-- Function to recalculate wallet balance from movements
CREATE OR REPLACE FUNCTION recalculate_wallet_from_movements(p_character_id UUID)
RETURNS void AS $$
DECLARE
  v_pp DECIMAL(10, 2) := 0;
  v_gp DECIMAL(10, 2) := 0;
  v_ep DECIMAL(10, 2) := 0;
  v_sp DECIMAL(10, 2) := 0;
  v_cp DECIMAL(10, 2) := 0;
  v_total_wealth DECIMAL(10, 2);
BEGIN
  -- Start with zero and sum all movements for this character
  SELECT 
    COALESCE(SUM(CASE WHEN from_currency = 'PP' AND movement_type = 'add' THEN amount_from 
                      WHEN from_currency = 'PP' AND movement_type = 'remove' THEN -amount_from ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN from_currency = 'GP' AND movement_type = 'add' THEN amount_from 
                      WHEN from_currency = 'GP' AND movement_type = 'remove' THEN -amount_from ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN from_currency = 'EP' AND movement_type = 'add' THEN amount_from 
                      WHEN from_currency = 'EP' AND movement_type = 'remove' THEN -amount_from ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN from_currency = 'SP' AND movement_type = 'add' THEN amount_from 
                      WHEN from_currency = 'SP' AND movement_type = 'remove' THEN -amount_from ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN from_currency = 'CP' AND movement_type = 'add' THEN amount_from 
                      WHEN from_currency = 'CP' AND movement_type = 'remove' THEN -amount_from ELSE 0 END), 0)
  INTO v_pp, v_gp, v_ep, v_sp, v_cp
  FROM movements
  WHERE character_id = p_character_id;

  -- Calculate total wealth in copper pieces then convert to gold
  v_total_wealth := (v_pp * 1000 + v_gp * 100 + v_ep * 50 + v_sp * 10 + v_cp) / 100;

  -- Update wallet with calculated values
  UPDATE wallets
  SET 
    platinum = v_pp,
    gold = v_gp,
    electrum = v_ep,
    silver = v_sp,
    copper = v_cp,
    total_wealth = v_total_wealth
  WHERE character_id = p_character_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to recalculate wallet after movement is inserted
CREATE OR REPLACE FUNCTION trigger_recalculate_wallet()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_wallet_from_movements(NEW.character_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_movements_to_wallet ON movements;

-- Create trigger to recalculate wallet on every movement insert
CREATE TRIGGER trigger_sync_movements_to_wallet
AFTER INSERT ON movements
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_wallet();

-- Initial sync: recalculate all wallets based on existing movements
DO $$
DECLARE
  v_character_id UUID;
BEGIN
  -- For each character that has movements, recalculate their wallet
  FOR v_character_id IN 
    SELECT DISTINCT character_id FROM movements
  LOOP
    PERFORM recalculate_wallet_from_movements(v_character_id);
  END LOOP;
  
  -- Also reset wallets for characters with no movements
  UPDATE wallets
  SET platinum = 0, gold = 0, electrum = 0, silver = 0, copper = 0, total_wealth = 0
  WHERE character_id NOT IN (SELECT DISTINCT character_id FROM movements);
END $$;
