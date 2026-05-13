-- Migration: Add in_progress status and update shift flow
-- Run this manually in Supabase SQL editor

-- 1. Migrate any existing 'assigned' shifts to 'in_progress'
--    (These are shifts where a worker was accepted but not yet completed)
UPDATE shifts
SET status = 'in_progress'
WHERE status = 'assigned';

-- 2. Document valid status values on the column
COMMENT ON COLUMN shifts.status IS
  'Valid values: open | in_progress | completed | cancelled | closed | assigned (legacy)';

-- 3. Ensure expires_at index exists for the OR filter query
CREATE INDEX IF NOT EXISTS shifts_expires_at_idx ON shifts (expires_at);

-- 4. (Optional) Add a partial index for open shifts to speed up worker queries
CREATE INDEX IF NOT EXISTS shifts_open_idx ON shifts (status, shift_date)
WHERE status = 'open';
