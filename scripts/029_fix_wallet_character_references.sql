-- Script to fix broken wallet-character relationships
-- This script handles orphaned wallets and creates missing wallets for existing characters

-- 1. Delete wallets that reference non-existent characters (orphaned wallets)
DELETE FROM public.wallets
WHERE character_id IS NOT NULL 
  AND character_id NOT IN (SELECT id FROM public.characters);

-- 2. Create wallets for characters that don't have one
INSERT INTO public.wallets (character_id, platinum, gold, electrum, silver, copper)
SELECT 
  c.id,
  0 AS platinum,
  0 AS gold,
  0 AS electrum,
  0 AS silver,
  0 AS copper
FROM public.characters c
WHERE c.id NOT IN (SELECT character_id FROM public.wallets WHERE character_id IS NOT NULL)
ON CONFLICT (character_id) DO NOTHING;

-- 3. Verify the relationships are now correct
SELECT 
  c.id as character_id,
  c.name as character_name,
  w.id as wallet_id,
  w.total_wealth
FROM public.characters c
LEFT JOIN public.wallets w ON c.id = w.character_id
ORDER BY c.created_at DESC;
