-- Store completed shifts count on profiles for fast level badge computation
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS completed_shifts_count INT NOT NULL DEFAULT 0;
