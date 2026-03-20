-- Add settings JSONB column to organizations table
-- Stores: custom_fields, column_config, and future org-level settings
-- Safe to run multiple times

DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Allow org members to update their org (for saving settings)
DO $$ BEGIN
  CREATE POLICY "Org members can update org"
    ON organizations FOR UPDATE
    USING (id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
