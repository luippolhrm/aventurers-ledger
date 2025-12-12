-- Create a function to automatically create a wallet when a character is created
CREATE OR REPLACE FUNCTION create_wallet_for_character()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new wallet for the newly created character with zero balance
  INSERT INTO wallets (character_id, platinum, gold, electrum, silver, copper, total_wealth)
  VALUES (NEW.id, 0, 0, 0, 0, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires after a character is inserted
DROP TRIGGER IF EXISTS trigger_create_wallet ON characters;
CREATE TRIGGER trigger_create_wallet
AFTER INSERT ON characters
FOR EACH ROW
EXECUTE FUNCTION create_wallet_for_character();
