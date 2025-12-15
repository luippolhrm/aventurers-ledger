-- Disable RLS on wallets table
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;

-- Drop all policies on wallets
DROP POLICY IF EXISTS "Allow all operations on wallets" ON public.wallets;

-- Disable RLS on inventory table
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;

-- Drop all policies on inventory
DROP POLICY IF EXISTS "inventory_select_own" ON public.inventory;
DROP POLICY IF EXISTS "inventory_insert_own" ON public.inventory;
DROP POLICY IF EXISTS "inventory_update_own" ON public.inventory;
DROP POLICY IF EXISTS "inventory_delete_own" ON public.inventory;

-- Disable RLS on transfers table
ALTER TABLE public.transfers DISABLE ROW LEVEL SECURITY;

-- Drop all policies on transfers
DROP POLICY IF EXISTS "transfers_select_own" ON public.transfers;
DROP POLICY IF EXISTS "transfers_insert_own" ON public.transfers;
DROP POLICY IF EXISTS "transfers_update_own" ON public.transfers;
DROP POLICY IF EXISTS "transfers_delete_own" ON public.transfers;
