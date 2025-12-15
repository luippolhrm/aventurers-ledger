-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  game_master_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campaign_members table
CREATE TABLE IF NOT EXISTS campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('game_master', 'player')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- Add campaign_id to characters table
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_campaign_members_user ON campaign_members(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign ON campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_characters_campaign ON characters(campaign_id);

-- Enable RLS on campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for campaigns table
-- Anyone can see campaigns they're a member of
CREATE POLICY "users_select_member_campaigns" ON campaigns
  FOR SELECT
  USING (
    id IN (
      SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
  );

-- Only GM can update their campaigns
CREATE POLICY "gm_update_own_campaigns" ON campaigns
  FOR UPDATE
  USING (game_master_id = auth.uid());

-- Only GM can delete their campaigns
CREATE POLICY "gm_delete_own_campaigns" ON campaigns
  FOR DELETE
  USING (game_master_id = auth.uid());

-- Anyone can create a campaign (becomes GM)
CREATE POLICY "users_create_campaigns" ON campaigns
  FOR INSERT
  WITH CHECK (game_master_id = auth.uid());

-- Enable RLS on campaign_members
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;

-- Policies for campaign_members
-- Users can see members of campaigns they're in
CREATE POLICY "users_select_campaign_members" ON campaign_members
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
  );

-- Only GM can add members to their campaigns
CREATE POLICY "gm_insert_campaign_members" ON campaign_members
  FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE game_master_id = auth.uid()
    )
  );

-- Only GM can remove members from their campaigns
CREATE POLICY "gm_delete_campaign_members" ON campaign_members
  FOR DELETE
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE game_master_id = auth.uid()
    )
  );

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character code
    code := upper(substr(md5(random()::text), 1, 8));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM campaigns WHERE invite_code = code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invite code
CREATE OR REPLACE FUNCTION set_campaign_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_invite_code ON campaigns;
CREATE TRIGGER trigger_set_invite_code
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_campaign_invite_code();

-- Trigger to auto-add GM as member
CREATE OR REPLACE FUNCTION add_gm_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO campaign_members (campaign_id, user_id, role)
  VALUES (NEW.id, NEW.game_master_id, 'game_master');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_add_gm_as_member ON campaigns;
CREATE TRIGGER trigger_add_gm_as_member
  AFTER INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION add_gm_as_member();

-- Update characters RLS to include campaign context
DROP POLICY IF EXISTS users_select_own_characters ON characters;
CREATE POLICY "users_select_own_characters" ON characters
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    -- Can see characters in campaigns they're a member of
    campaign_id IN (
      SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
  );
