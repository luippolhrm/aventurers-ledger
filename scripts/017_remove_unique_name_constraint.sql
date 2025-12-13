-- Remove the UNIQUE constraint on character name
-- This allows different users to have characters with the same name
-- The combination of user_id and name can still be unique if needed in the future

-- Drop the unique constraint on name
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_name_key;

-- Optionally, add a composite unique constraint on (user_id, name)
-- This prevents a single user from having duplicate character names
-- while allowing different users to use the same name
ALTER TABLE characters ADD CONSTRAINT characters_user_name_unique UNIQUE (user_id, name);
