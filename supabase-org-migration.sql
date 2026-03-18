-- ============================================================
-- MIGRATION: Add organization-based multi-tenancy
-- Run this on an existing database that already has leads, referrers, activity_logs
-- ============================================================

-- Step 1: Create organizations table
CREATE TABLE organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Step 2: Create organization_members table
CREATE TABLE organization_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Step 3: Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Step 4: Policies for organizations
CREATE POLICY "Anyone can validate org codes"
  ON organizations FOR SELECT
  USING (true);

-- Step 5: Policies for organization_members
CREATE POLICY "Members can view own org members"
  ON organization_members FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own membership"
  ON organization_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Step 6: Add organization_id to existing tables
ALTER TABLE leads ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE referrers ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE activity_logs ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Step 7: Create a default org and backfill
INSERT INTO organizations (name, code) VALUES ('Trilio', 'TRILIO2026');

-- Add all existing users to the default org as owners
INSERT INTO organization_members (organization_id, user_id, role)
SELECT (SELECT id FROM organizations WHERE code = 'TRILIO2026'), id, 'owner'
FROM auth.users
ON CONFLICT DO NOTHING;

-- Backfill organization_id on all existing rows
UPDATE leads SET organization_id = (SELECT id FROM organizations WHERE code = 'TRILIO2026') WHERE organization_id IS NULL;
UPDATE referrers SET organization_id = (SELECT id FROM organizations WHERE code = 'TRILIO2026') WHERE organization_id IS NULL;
UPDATE activity_logs SET organization_id = (SELECT id FROM organizations WHERE code = 'TRILIO2026') WHERE organization_id IS NULL;

-- Step 8: Make organization_id NOT NULL
ALTER TABLE leads ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE referrers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE activity_logs ALTER COLUMN organization_id SET NOT NULL;

-- Step 9: Drop old user-based RLS policies
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;
DROP POLICY IF EXISTS "Users can view own referrers" ON referrers;
DROP POLICY IF EXISTS "Users can insert own referrers" ON referrers;
DROP POLICY IF EXISTS "Users can update own referrers" ON referrers;
DROP POLICY IF EXISTS "Users can delete own referrers" ON referrers;
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can update own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can delete own activity logs" ON activity_logs;

-- Step 10: Create new org-based RLS policies
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

-- Step 11: Add indexes
CREATE INDEX leads_organization_id_idx ON leads(organization_id);
CREATE INDEX referrers_organization_id_idx ON referrers(organization_id);
CREATE INDEX activity_logs_organization_id_idx ON activity_logs(organization_id);
CREATE INDEX organization_members_user_id_idx ON organization_members(user_id);
CREATE INDEX organization_members_org_id_idx ON organization_members(organization_id);
