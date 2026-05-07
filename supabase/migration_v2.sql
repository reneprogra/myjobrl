-- =============================================
-- MyJob — Migration v2
-- Fixes for: shift expiry, chat realtime, portfolio storage
-- Run this in the Supabase SQL Editor
-- =============================================

-- =============================================
-- BUG 2: Add expires_at to shifts
-- =============================================
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours';

-- Index for expires_at queries
CREATE INDEX IF NOT EXISTS idx_shifts_expires_at ON shifts(expires_at);

-- =============================================
-- BUG 6: Ensure conversations + messages tables exist
-- (idempotent — safe to re-run if already created via chat_migration.sql)
-- =============================================

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shift_id, client_id, worker_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversations' AND policyname = 'Participants can view their conversations'
  ) THEN
    CREATE POLICY "Participants can view their conversations"
      ON conversations FOR SELECT
      TO authenticated
      USING (auth.uid() = client_id OR auth.uid() = worker_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversations' AND policyname = 'Participants can create conversations'
  ) THEN
    CREATE POLICY "Participants can create conversations"
      ON conversations FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = client_id OR auth.uid() = worker_id);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages' AND policyname = 'Participants can view messages'
  ) THEN
    CREATE POLICY "Participants can view messages"
      ON messages FOR SELECT
      TO authenticated
      USING (
        conversation_id IN (
          SELECT id FROM conversations
          WHERE client_id = auth.uid() OR worker_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages' AND policyname = 'Participants can send messages'
  ) THEN
    CREATE POLICY "Participants can send messages"
      ON messages FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = sender_id
        AND conversation_id IN (
          SELECT id FROM conversations
          WHERE client_id = auth.uid() OR worker_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages' AND policyname = 'Participants can mark messages as read'
  ) THEN
    CREATE POLICY "Participants can mark messages as read"
      ON messages FOR UPDATE
      TO authenticated
      USING (
        conversation_id IN (
          SELECT id FROM conversations
          WHERE client_id = auth.uid() OR worker_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_worker_id ON conversations(worker_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Realtime on messages (idempotent — safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END$$;

-- =============================================
-- BUG 4: Portfolio storage bucket
-- Create via Supabase Dashboard or this SQL (storage schema)
-- =============================================
-- NOTE: Run the following in the Supabase Dashboard under Storage
-- or execute via the management API. SQL Editor cannot create storage buckets.
--
-- Bucket name: portfolio
-- Public: true
-- Allowed MIME types: image/*
-- File size limit: 5 MB
--
-- Storage RLS policies to add after creating the bucket:
-- Policy 1 (SELECT — public read):
--   bucket_id = 'portfolio'
-- Policy 2 (INSERT — authenticated upload to own folder):
--   bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]

-- =============================================
-- VERIFICATION QUERIES (run separately to check)
-- =============================================
-- Check shifts has expires_at:
--   SELECT column_name FROM information_schema.columns WHERE table_name='shifts' AND column_name='expires_at';
-- Check messages realtime:
--   SELECT * FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='messages';
