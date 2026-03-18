-- Gmail OAuth token storage for sending emails via Gmail API
CREATE TABLE gmail_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expiry timestamptz NOT NULL,
  gmail_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS policies: users can read and delete their own tokens
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gmail tokens"
  ON gmail_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own gmail tokens"
  ON gmail_tokens FOR DELETE
  USING (user_id = auth.uid());

-- INSERT/UPDATE is done via service role key (server-side only)
