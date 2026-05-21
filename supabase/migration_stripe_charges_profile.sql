-- Store Stripe charges_enabled status directly on profiles
-- so it's always accessible without joining stripe_accounts.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT false;
