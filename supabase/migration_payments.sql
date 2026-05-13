CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID REFERENCES shifts(id),
  client_id UUID REFERENCES profiles(id),
  worker_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  worker_amount INTEGER NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
ON payments FOR SELECT TO authenticated
USING (client_id = auth.uid() OR worker_id = auth.uid());

CREATE POLICY "Service role can insert payments"
ON payments FOR INSERT TO service_role
WITH CHECK (true);
