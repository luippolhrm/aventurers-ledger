-- ============================================================================
-- SCRIPT 040: Fix campaign_members SELECT policy (avoid RLS recursion)
-- ============================================================================
-- Problem:
--   A SELECT policy on campaign_members that queries campaign_members inside itself
--   can trigger Postgres RLS recursion and PostgREST 500 errors.
--
-- Fix:
--   Replace the policy with a non-recursive version:
--   - Members can see their own membership row
--   - GMs can see all members for campaigns they own
-- ============================================================================

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view campaign members" ON public.campaign_members;

CREATE POLICY "Users can view campaign members"
  ON public.campaign_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_members.campaign_id
      AND campaigns.game_master_id = auth.uid()
    )
  );

-- Quick sanity check
SELECT
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'campaign_members'
ORDER BY policyname;
