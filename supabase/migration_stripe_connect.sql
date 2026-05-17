CREATE TABLE stripe_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stripe account"
ON stripe_accounts FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage stripe accounts"
ON stripe_accounts FOR ALL TO service_role
WITH CHECK (true);
