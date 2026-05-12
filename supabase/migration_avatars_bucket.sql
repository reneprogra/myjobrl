-- =============================================
-- Migration: avatars storage bucket + policies
-- Run this in the Supabase SQL Editor
-- =============================================

-- Create the avatars bucket (public so URLs work without signed tokens)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB max
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access (needed for <img src="...public URL...">)
CREATE POLICY "Avatars publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Workers can upload their own avatar
CREATE POLICY "Workers can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'workers/' || auth.uid()::text || '/%'
);

-- Workers can overwrite (upsert) their own avatar
CREATE POLICY "Workers can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  name LIKE 'workers/' || auth.uid()::text || '/%'
);

-- Workers can delete their own avatar
CREATE POLICY "Workers can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  name LIKE 'workers/' || auth.uid()::text || '/%'
);
