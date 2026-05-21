-- =============================================
-- MyJob — Phone Number Migration
-- Run this in the Supabase SQL Editor
-- =============================================

-- Add phone_number column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Optional: add a comment for clarity
COMMENT ON COLUMN profiles.phone_number IS 'Worker contact phone number, required for workers at the app level';

-- Verification query (run separately to confirm):
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name = 'phone_number';
