-- Clean Darvin Norris wallet (character_id: feddebcb-4de3-42be-862b-27e446626813)
-- Reset all currency values to 0 and total_wealth to 0.00

UPDATE public.wallets
SET 
  platinum = 0,
  gold = 0,
  electrum = 0,
  silver = 0,
  copper = 0,
  total_wealth = '0.00'
WHERE character_id = 'feddebcb-4de3-42be-862b-27e446626813';

-- Verify the update
SELECT * FROM public.wallets 
WHERE character_id = 'feddebcb-4de3-42be-862b-27e446626813';
