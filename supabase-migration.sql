-- Leads table
CREATE TABLE leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Referrers table
CREATE TABLE referrers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organizations table
CREATE TABLE organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Organization members table
CREATE TABLE organization_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations policies: members can view their own org
CREATE POLICY "Members can view own org"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Allow anyone to read organizations for code validation during signup
CREATE POLICY "Anyone can validate org codes"
  ON organizations FOR SELECT
  USING (true);

-- Organization members policies
CREATE POLICY "Members can view own org members"
  ON organization_members FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own membership"
  ON organization_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Leads policies: org-based access
CREATE POLICY "Org members can view leads"
  ON leads FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert leads"
  ON leads FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update leads"
  ON leads FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete leads"
  ON leads FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Referrers policies: org-based access
CREATE POLICY "Org members can view referrers"
  ON referrers FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert referrers"
  ON referrers FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update referrers"
  ON referrers FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete referrers"
  ON referrers FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER referrers_updated_at
  BEFORE UPDATE ON referrers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Activity logs table
CREATE TABLE activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('call', 'email', 'tour', 'note', 'stage_change', 'meeting')),
  title text NOT NULL,
  description text,
  by text,
  tour_note jsonb,
  date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity logs policies: org-based access
CREATE POLICY "Org members can view activity logs"
  ON activity_logs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update activity logs"
  ON activity_logs FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete activity logs"
  ON activity_logs FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX leads_organization_id_idx ON leads(organization_id);
CREATE INDEX leads_lead_id_idx ON activity_logs(lead_id);
CREATE INDEX referrers_organization_id_idx ON referrers(organization_id);
CREATE INDEX activity_logs_organization_id_idx ON activity_logs(organization_id);
CREATE INDEX activity_logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX organization_members_user_id_idx ON organization_members(user_id);
CREATE INDEX organization_members_org_id_idx ON organization_members(organization_id);

-- ============================================================
-- MIGRATION: Run this section to migrate existing data
-- ============================================================
-- Step 1: Add organization_id columns (if upgrading from user-based schema)
-- ALTER TABLE leads ADD COLUMN organization_id uuid REFERENCES organizations(id);
-- ALTER TABLE referrers ADD COLUMN organization_id uuid REFERENCES organizations(id);
-- ALTER TABLE activity_logs ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Step 2: Create a default org
-- INSERT INTO organizations (name, code) VALUES ('Default', 'DEFAULT2026');

-- Step 3: Add all existing users to the default org
-- INSERT INTO organization_members (organization_id, user_id, role)
-- SELECT (SELECT id FROM organizations WHERE code = 'DEFAULT2026'), id, 'owner'
-- FROM auth.users
-- ON CONFLICT DO NOTHING;

-- Step 4: Backfill organization_id on existing rows
-- UPDATE leads SET organization_id = (SELECT id FROM organizations WHERE code = 'DEFAULT2026') WHERE organization_id IS NULL;
-- UPDATE referrers SET organization_id = (SELECT id FROM organizations WHERE code = 'DEFAULT2026') WHERE organization_id IS NULL;
-- UPDATE activity_logs SET organization_id = (SELECT id FROM organizations WHERE code = 'DEFAULT2026') WHERE organization_id IS NULL;

-- Step 5: Make organization_id NOT NULL
-- ALTER TABLE leads ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE referrers ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE activity_logs ALTER COLUMN organization_id SET NOT NULL;

-- Step 6: Drop old user-based RLS policies
-- DROP POLICY IF EXISTS "Users can view own leads" ON leads;
-- DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
-- DROP POLICY IF EXISTS "Users can update own leads" ON leads;
-- DROP POLICY IF EXISTS "Users can delete own leads" ON leads;
-- DROP POLICY IF EXISTS "Users can view own referrers" ON referrers;
-- DROP POLICY IF EXISTS "Users can insert own referrers" ON referrers;
-- DROP POLICY IF EXISTS "Users can update own referrers" ON referrers;
-- DROP POLICY IF EXISTS "Users can delete own referrers" ON referrers;
-- DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
-- DROP POLICY IF EXISTS "Users can insert own activity logs" ON activity_logs;
-- DROP POLICY IF EXISTS "Users can update own activity logs" ON activity_logs;
-- DROP POLICY IF EXISTS "Users can delete own activity logs" ON activity_logs;
