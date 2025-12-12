-- Enforce 1:1 relationship between characters and wallets
-- and create missing wallets for existing characters

-- Step 1: Add UNIQUE constraint to character_id to enforce 1:1 relationship
ALTER TABLE wallets
ADD CONSTRAINT wallets_character_id_unique UNIQUE (character_id);

-- Step 2: Create wallets for any characters that don't have one
INSERT INTO wallets (character_id, platinum, gold, electrum, silver, copper, total_wealth)
SELECT 
  c.id,
  0,
  0,
  0,
  0,
  0,
  0.00
FROM characters c
LEFT JOIN wallets w ON c.id = w.character_id
WHERE w.id IS NULL;

-- Step 3: Update the trigger to use INSERT OR IGNORE to handle edge cases
CREATE OR REPLACE FUNCTION create_wallet_for_character()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if wallet doesn't exist (in case of race conditions)
  INSERT INTO wallets (character_id, platinum, gold, electrum, silver, copper, total_wealth)
  VALUES (NEW.id, 0, 0, 0, 0, 0, 0.00)
  ON CONFLICT (character_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS create_wallet_after_character_insert ON characters;
CREATE TRIGGER create_wallet_after_character_insert
  AFTER INSERT ON characters
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_character();
