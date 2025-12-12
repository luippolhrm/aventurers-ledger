-- Add user_id column to characters table
alter table public.characters 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Create index for faster queries
create index if not exists idx_characters_user_id on public.characters(user_id);

-- Update RLS policies for characters
drop policy if exists "Allow all operations on characters" on public.characters;

-- New RLS policies for characters
create policy "users_select_own_characters"
  on public.characters for select
  using (auth.uid() = user_id);

create policy "users_insert_own_characters"
  on public.characters for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_characters"
  on public.characters for update
  using (auth.uid() = user_id);

create policy "users_delete_own_characters"
  on public.characters for delete
  using (auth.uid() = user_id);

-- Update wallets RLS
drop policy if exists "Allow all operations on wallets" on public.wallets;

create policy "users_access_own_wallets"
  on public.wallets for all
  using (
    exists (
      select 1 from public.characters
      where characters.id = wallets.character_id
      and characters.user_id = auth.uid()
    )
  );

-- Update inventory RLS
drop policy if exists "Allow all operations on inventory" on public.inventory;

create policy "users_access_own_inventory"
  on public.inventory for all
  using (
    exists (
      select 1 from public.characters
      where characters.id = inventory.character_id
      and characters.user_id = auth.uid()
    )
  );

-- Update transfers RLS
drop policy if exists "Allow all transfers operations" on public.transfers;

create policy "users_access_own_transfers"
  on public.transfers for all
  using (
    exists (
      select 1 from public.characters
      where (characters.id = transfers.from_character_id or characters.id = transfers.to_character_id)
      and characters.user_id = auth.uid()
    )
  );

-- Update movements RLS
alter table public.movements enable row level security;

create policy "users_access_own_movements"
  on public.movements for all
  using (
    exists (
      select 1 from public.characters
      where characters.id = movements.character_id
      and characters.user_id = auth.uid()
    )
  );
