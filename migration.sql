-- WhatBlox – Moderation Migration
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add status tracking to the games table
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Make sure all pre-existing rows are marked as approved
UPDATE games SET status = 'approved' WHERE status IS NULL OR status = '';

-- 3. Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_games_status     ON games (status);
CREATE INDEX IF NOT EXISTS idx_games_user_id    ON games (user_id);
CREATE INDEX IF NOT EXISTS idx_votes_game_id    ON votes (game_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id    ON votes (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security notes
-- ─────────────────────────────────────────────────────────────────────────────
-- The admin approve/reject routes use SUPABASE_SERVICE_ROLE_KEY (server-only)
-- to bypass RLS.  Ensure the following policies exist if RLS is enabled:
--
--   • SELECT  – anyone may read approved games
--   • INSERT  – authenticated users may insert their own games
--   • UPDATE  – only the service role (admin) may update status
--
-- Example (adjust to match your existing policy names):
--
-- CREATE POLICY "Public approved games"
--   ON games FOR SELECT
--   USING (status = 'approved');
--
-- CREATE POLICY "Owner can insert"
--   ON games FOR INSERT
--   WITH CHECK (true);   -- user_id validation happens in application code
--
-- If you do not use RLS, no extra policies are needed.
-- ─────────────────────────────────────────────────────────────────────────────
