-- ============================================================================
-- SCRIPT 054: Fix campaign_members visibility - Allow GMs and members to see all members
-- ============================================================================
-- Problem:
--   Current RLS policies only allow users to see their own membership rows.
--   This causes:
--   - Invited users don't appear in member lists when other users view the campaign
--   - When a user views members, they only see their own character
--   - GMs cannot see all members of their campaigns
--   - Attempting to fix with RLS policy causes infinite recursion (42P17)
--
-- Solution:
--   Use SECURITY DEFINER function to bypass RLS and safely get campaign members.
--   Keep simple RLS policy for direct queries (own membership only).
--   Use RPC function for getting all members of a campaign.
-- ============================================================================

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view campaign members" ON public.campaign_members;
DROP POLICY IF EXISTS "campaign_members_select_own" ON public.campaign_members;
DROP POLICY IF EXISTS "users_select_campaign_members" ON public.campaign_members;
DROP POLICY IF EXISTS "campaign_members_select" ON public.campaign_members;

-- Create simple SELECT policy - users can only see their own membership
-- This avoids recursion and is safe
CREATE POLICY "campaign_members_select_own"
  ON public.campaign_members FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- SECURITY DEFINER FUNCTION: Get campaign members
-- ============================================================================
-- This function bypasses RLS to safely retrieve all members of a campaign
-- It verifies that the current user is either:
--   1. The GM of the campaign, OR
--   2. A member of the campaign
-- Then returns all members without RLS restrictions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_campaign_members(campaign_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  character_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ
) AS $$
DECLARE
  current_user_id UUID;
  is_gm BOOLEAN;
  is_member BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  
  -- Verify user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if user is GM of the campaign
  -- Use explicit table alias to avoid ambiguity
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_uuid
    AND c.game_master_id = current_user_id
  ) INTO is_gm;
  
  -- Check if user is a member of the campaign
  -- Note: This query bypasses RLS because the function has SECURITY DEFINER
  -- Use explicit table alias to avoid ambiguity
  SELECT EXISTS (
    SELECT 1 FROM public.campaign_members cm_check
    WHERE cm_check.campaign_id = campaign_uuid
    AND cm_check.user_id = current_user_id
  ) INTO is_member;
  
  -- Only return members if user is GM or member
  IF NOT (is_gm OR is_member) THEN
    RAISE EXCEPTION 'User is not authorized to view members of this campaign';
  END IF;
  
  -- Return all members (bypassing RLS due to SECURITY DEFINER)
  -- Use explicit table alias to avoid ambiguity with RETURN TABLE columns
  RETURN QUERY
  SELECT 
    cm.id AS id,
    cm.user_id AS user_id,
    cm.character_id AS character_id,
    cm.role AS role,
    cm.joined_at AS joined_at
  FROM public.campaign_members cm
  WHERE cm.campaign_id = campaign_uuid
  ORDER BY 
    CASE WHEN cm.role = 'game_master' THEN 0 ELSE 1 END,
    cm.joined_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users only
-- This allows any authenticated user to call the function
-- (the function itself will verify authorization - user must be GM or member)
GRANT EXECUTE ON FUNCTION public.get_campaign_members(UUID) TO authenticated;

-- Ensure INSERT and DELETE policies exist (keep existing ones if they work)
-- If they don't exist, create minimal ones
DO $$
BEGIN
  -- Check if INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaign_members'
      AND policyname IN (
        'campaign_members_insert_own',
        'users_insert_campaign_members',
        'campaign_members_insert',
        'Users can join campaigns'
      )
  ) THEN
    CREATE POLICY "campaign_members_insert_own"
      ON public.campaign_members FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Check if DELETE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaign_members'
      AND policyname IN (
        'campaign_members_delete_own',
        'users_delete_own_memberships',
        'campaign_members_delete_own',
        'Users can leave campaigns'
      )
  ) THEN
    CREATE POLICY "campaign_members_delete_own"
      ON public.campaign_members FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check all policies on campaign_members
SELECT 
  'campaign_members policies' AS section,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'campaign_members'
ORDER BY policyname;

-- Verify function exists and has correct permissions
SELECT 
  'Function verification' AS section,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security_type,
  array_to_string(p.proacl, ', ') AS permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_campaign_members';

-- ============================================================================
-- TESTING
-- ============================================================================
-- Test the RPC function (run as a GM or member of a campaign):
-- 
-- SELECT * FROM get_campaign_members('your-campaign-id-here');
--
-- This should return all members of the campaign if you are GM or member.
-- If you are not authorized, it will raise an exception.
-- ============================================================================
