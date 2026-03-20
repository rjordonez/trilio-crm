-- Idempotent: safe to run multiple times
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    title text NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
    priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Make lead_id nullable if it was created as NOT NULL
ALTER TABLE tasks ALTER COLUMN lead_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_org_due ON tasks(organization_id, due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON tasks(lead_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Tasks select" ON tasks FOR SELECT
    USING (organization_id = get_user_active_org_id(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Tasks insert" ON tasks FOR INSERT
    WITH CHECK (organization_id = get_user_active_org_id(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Tasks update" ON tasks FOR UPDATE
    USING (organization_id = get_user_active_org_id(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Tasks delete" ON tasks FOR DELETE
    USING (organization_id = get_user_active_org_id(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
