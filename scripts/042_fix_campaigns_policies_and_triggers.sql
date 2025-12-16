-- ============================================================================
-- SCRIPT 042: Fix campaigns + campaign_members policies and remove recursion
-- ============================================================================
-- Symptoms:
--   - PostgREST 500 + code 42P17: infinite recursion detected in policy for relation "campaign_members"
--   - Creating campaign fails because trigger add_gm_as_member inserts into campaign_members under RLS
--
-- Strategy:
--   - Drop ALL policies on public.campaigns and public.campaign_members
--   - Recreate minimal, non-recursive policies
--   - Drop trigger/function that auto-inserts campaign_members on campaign insert
--
-- Notes:
--   - This keeps campaign_members policies non-relational (no joins to campaigns)
--   - GM management of members can be added later via SECURITY DEFINER RPC
-- ============================================================================

-- Ensure RLS enabled
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

-- --------------------
-- Drop ALL policies (campaigns)
-- --------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaigns'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.campaigns', pol.policyname);
  END LOOP;
END $$;

-- --------------------
-- Drop ALL policies (campaign_members)
-- --------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaign_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.campaign_members', pol.policyname);
  END LOOP;
END $$;

-- --------------------
-- Recreate policies: campaign_members (NON-RELATIONAL)
-- --------------------
CREATE POLICY "campaign_members_select_own"
  ON public.campaign_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "campaign_members_insert_own"
  ON public.campaign_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "campaign_members_delete_own"
  ON public.campaign_members FOR DELETE
  USING (user_id = auth.uid());

-- --------------------
-- Recreate policies: campaigns
-- --------------------
-- View campaigns you own OR where you have a membership row.
CREATE POLICY "campaigns_select_own_or_member"
  ON public.campaigns FOR SELECT
  USING (
    game_master_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaign_members
      WHERE campaign_members.campaign_id = campaigns.id
        AND campaign_members.user_id = auth.uid()
    )
  );

CREATE POLICY "campaigns_insert_own"
  ON public.campaigns FOR INSERT
  WITH CHECK (game_master_id = auth.uid());

CREATE POLICY "campaigns_update_own"
  ON public.campaigns FOR UPDATE
  USING (game_master_id = auth.uid())
  WITH CHECK (game_master_id = auth.uid());

CREATE POLICY "campaigns_delete_own"
  ON public.campaigns FOR DELETE
  USING (game_master_id = auth.uid());

-- --------------------
-- Remove auto-add GM trigger (it breaks under RLS and duplicates app logic)
-- --------------------
DROP TRIGGER IF EXISTS trigger_add_gm_as_member ON public.campaigns;
DROP FUNCTION IF EXISTS public.add_gm_as_member();

-- --------------------
-- Sanity checks
-- --------------------
SELECT 'campaign_members policies' AS section, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'campaign_members'
ORDER BY policyname;

SELECT 'campaigns policies' AS section, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'campaigns'
ORDER BY policyname;

SELECT 'campaigns triggers' AS section, trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'campaigns'
ORDER BY trigger_name;
