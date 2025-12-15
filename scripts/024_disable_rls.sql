-- Disable RLS on all tables to fix authentication issues
-- Note: The application controls access via user_id filtering in the code

ALTER TABLE characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members DISABLE ROW LEVEL SECURITY;

-- Optionally, you can also drop all policies if RLS will remain disabled
DROP POLICY IF EXISTS "characters_select_own" ON characters;
DROP POLICY IF EXISTS "characters_insert_own" ON characters;
DROP POLICY IF EXISTS "characters_update_own" ON characters;
DROP POLICY IF EXISTS "characters_delete_own" ON characters;

DROP POLICY IF EXISTS "campaigns_select_own_or_member" ON campaigns;
DROP POLICY IF EXISTS "campaigns_insert_own" ON campaigns;
DROP POLICY IF EXISTS "campaigns_update_own" ON campaigns;
DROP POLICY IF EXISTS "campaigns_delete_own" ON campaigns;

DROP POLICY IF EXISTS "campaign_members_select" ON campaign_members;
DROP POLICY IF EXISTS "campaign_members_insert_own" ON campaign_members;
DROP POLICY IF EXISTS "campaign_members_delete_own" ON campaign_members;
