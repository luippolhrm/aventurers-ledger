-- Remove campaign members whose user_id doesn't exist in profiles
-- This cleans up data inconsistencies that cause PGRST116 errors

DELETE FROM campaign_members
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Verify the cleanup
SELECT COUNT(*) as remaining_members FROM campaign_members;
