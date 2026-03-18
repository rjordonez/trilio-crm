-- ============================================================
-- MIGRATION: Organization management — approval flow, create org, settings
-- Run this AFTER supabase-org-migration.sql
-- ============================================================

-- Step 1: Add status column to organization_members
ALTER TABLE organization_members
  ADD COLUMN status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('pending', 'active'));

-- Step 2: Create helper function to avoid RLS recursion
CREATE OR REPLACE FUNCTION get_user_active_org_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;
$$;

-- Step 3: Drop old RLS policies on data tables
DROP POLICY IF EXISTS "Org members can view leads" ON leads;
DROP POLICY IF EXISTS "Org members can insert leads" ON leads;
DROP POLICY IF EXISTS "Org members can update leads" ON leads;
DROP POLICY IF EXISTS "Org members can delete leads" ON leads;

DROP POLICY IF EXISTS "Org members can view referrers" ON referrers;
DROP POLICY IF EXISTS "Org members can insert referrers" ON referrers;
DROP POLICY IF EXISTS "Org members can update referrers" ON referrers;
DROP POLICY IF EXISTS "Org members can delete referrers" ON referrers;

DROP POLICY IF EXISTS "Org members can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Org members can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Org members can update activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Org members can delete activity logs" ON activity_logs;

-- Step 4: Recreate data policies using helper function (no recursion)
CREATE POLICY "Org members can view leads" ON leads FOR SELECT
  USING (organization_id = get_user_active_org_id(auth.uid()));
CREATE POLICY "Org members can insert leads" ON leads FOR INSERT
  WITH CHECK (organization_id = get_user_active_org_id(auth.uid()));
CREATE POLICY "Org members can update leads" ON leads FOR UPDATE
  USING (organization_id = get_user_active_org_id(auth.uid()));
CREATE POLICY "Org members can delete leads" ON leads FOR DELETE
  USING (organization_id = get_user_active_org_id(auth.uid()));

CREATE POLICY "Org members can view referrers" ON referrers FOR SELECT
  USING (organization_id = get_user_active_org_id(auth.uid()));
CREATE POLICY "Org members can insert referrers" ON referrers FOR INSERT
  WITH CHECK (organization_id = get_user_active_org_id(auth.uid()));
CREATE POLICY "Org members can update referrers" ON referrers FOR UPDATE
  USING (organization_id = get_user_active_org_id(auth.uid()));
CREATE POLICY "Org members can delete referrers" ON referrers FOR DELETE
  USING (organization_id = get_user_active_org_id(auth.uid()));

CREATE POLICY "Org members can view activity logs" ON activity_logs FOR SELECT
  USING (organization_id = get_user_active_org_id(auth.uid()));
CREATE POLICY "Org members can insert activity logs" ON activity_logs FOR INSERT
  WITH CHECK (organization_id = get_user_active_org_id(auth.uid()));
CREATE POLICY "Org members can update activity logs" ON activity_logs FOR UPDATE
  USING (organization_id = get_user_active_org_id(auth.uid()));
CREATE POLICY "Org members can delete activity logs" ON activity_logs FOR DELETE
  USING (organization_id = get_user_active_org_id(auth.uid()));

-- Step 5: Update organization_members policies
DROP POLICY IF EXISTS "Members can view own org members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert own membership" ON organization_members;

-- Users can always see their own membership row (to check pending status)
CREATE POLICY "Users can view own membership"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

-- Active members can see all members in their org (for settings page)
CREATE POLICY "Active members can view org members"
  ON organization_members FOR SELECT
  USING (organization_id = get_user_active_org_id(auth.uid()));

-- Users can delete own membership (leave org)
CREATE POLICY "Users can leave org"
  ON organization_members FOR DELETE
  USING (user_id = auth.uid());

-- Step 6: Create user_profiles view (for member list to show names/emails)
CREATE OR REPLACE VIEW public.user_profiles AS
  SELECT id, email, raw_user_meta_data->>'full_name' as full_name
  FROM auth.users;

GRANT SELECT ON public.user_profiles TO authenticated;

-- Step 7: Drop old RPC function
DROP FUNCTION IF EXISTS join_organization_by_code;

-- Step 8: Create new RPC functions

-- Request to join an existing organization (pending approval)
CREATE OR REPLACE FUNCTION request_to_join_organization(p_user_id uuid, p_org_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org record;
BEGIN
  SELECT id, name INTO v_org FROM organizations WHERE code = p_org_code;
  IF v_org.id IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- Check user isn't already in an org
  IF EXISTS (SELECT 1 FROM organization_members WHERE user_id = p_user_id AND status = 'active') THEN
    RAISE EXCEPTION 'Already a member of an organization';
  END IF;

  -- Remove any old pending requests
  DELETE FROM organization_members WHERE user_id = p_user_id AND status = 'pending';

  INSERT INTO organization_members (organization_id, user_id, role, status)
  VALUES (v_org.id, p_user_id, 'member', 'pending');

  RETURN json_build_object('org_id', v_org.id, 'org_name', v_org.name);
END;
$$;

-- Create a new organization (caller becomes owner)
CREATE OR REPLACE FUNCTION create_organization(p_user_id uuid, p_org_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_code text;
BEGIN
  -- Check user isn't already in an org
  IF EXISTS (SELECT 1 FROM organization_members WHERE user_id = p_user_id AND status = 'active') THEN
    RAISE EXCEPTION 'Already a member of an organization';
  END IF;

  -- Remove any pending requests
  DELETE FROM organization_members WHERE user_id = p_user_id AND status = 'pending';

  -- Generate unique code
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO organizations (name, code) VALUES (p_org_name, v_code) RETURNING id INTO v_org_id;

  INSERT INTO organization_members (organization_id, user_id, role, status)
  VALUES (v_org_id, p_user_id, 'owner', 'active');

  RETURN json_build_object('id', v_org_id, 'name', p_org_name, 'code', v_code);
END;
$$;

-- Approve a pending member (admin/owner only)
CREATE OR REPLACE FUNCTION approve_member(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_caller_role text;
BEGIN
  SELECT organization_id INTO v_org_id FROM organization_members WHERE id = p_member_id AND status = 'pending';
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Pending member not found';
  END IF;

  SELECT role INTO v_caller_role FROM organization_members
    WHERE organization_id = v_org_id AND user_id = auth.uid() AND status = 'active';
  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE organization_members SET status = 'active' WHERE id = p_member_id;
END;
$$;

-- Deny a pending member (admin/owner only)
CREATE OR REPLACE FUNCTION deny_member(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_caller_role text;
BEGIN
  SELECT organization_id INTO v_org_id FROM organization_members WHERE id = p_member_id AND status = 'pending';
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Pending member not found';
  END IF;

  SELECT role INTO v_caller_role FROM organization_members
    WHERE organization_id = v_org_id AND user_id = auth.uid() AND status = 'active';
  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM organization_members WHERE id = p_member_id;
END;
$$;

-- Remove an active member (admin/owner only, cannot remove owners)
CREATE OR REPLACE FUNCTION remove_member(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_target_role text;
  v_caller_role text;
BEGIN
  SELECT organization_id, role INTO v_org_id, v_target_role
    FROM organization_members WHERE id = p_member_id AND status = 'active';
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF v_target_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove an owner';
  END IF;

  SELECT role INTO v_caller_role FROM organization_members
    WHERE organization_id = v_org_id AND user_id = auth.uid() AND status = 'active';
  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM organization_members WHERE id = p_member_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
