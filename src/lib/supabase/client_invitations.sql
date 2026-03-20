-- client_invitations table
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Coaches can read/write their own invitations
CREATE POLICY "Coaches manage own invitations" ON client_invitations
  FOR ALL TO authenticated
  USING (coach_id = auth.uid());

-- Also need to allow unauthenticated reads for the callback lookup
-- Actually the callback runs server-side with service role, so no policy needed for that
