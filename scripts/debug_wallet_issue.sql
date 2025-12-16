-- Debug script to verify wallet data for Darvin Norris
-- Run this in Supabase SQL Editor to see the actual data

-- 1. Find the character
SELECT id, name, race, user_id
FROM characters
WHERE name = 'Darvin Norris';

-- 2. Check the wallet data for this character
SELECT 
  w.*,
  c.name as character_name
FROM wallets w
JOIN characters c ON w.character_id = c.id
WHERE c.name = 'Darvin Norris';

-- 3. Manually calculate what total_wealth SHOULD be
SELECT 
  c.name as character_name,
  w.platinum,
  w.gold,
  w.electrum,
  w.silver,
  w.copper,
  w.total_wealth as current_total_wealth,
  (w.platinum * 10) + w.gold + (w.electrum * 0.5) + (w.silver * 0.1) + (w.copper * 0.01) as calculated_total_wealth
FROM wallets w
JOIN characters c ON w.character_id = c.id
WHERE c.name = 'Darvin Norris';

-- 4. Test the exact query that the dashboard uses
SELECT 
  c.id, 
  c.name, 
  c.race,
  json_agg(json_build_object('total_wealth', w.total_wealth)) as wallets
FROM characters c
LEFT JOIN wallets w ON w.character_id = c.id
WHERE c.name = 'Darvin Norris'
GROUP BY c.id, c.name, c.race;
