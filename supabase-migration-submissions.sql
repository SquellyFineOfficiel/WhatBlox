-- WhatBlox Community Submissions Migration
-- Run this in Supabase SQL Editor (idempotent: skips if tables exist).
-- Adds the game_submissions table + RLS + indexes for the public submission flow.

-- 1. game_submissions table
CREATE TABLE IF NOT EXISTS public.game_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  universe_id   BIGINT NOT NULL,
  roblox_url    TEXT NOT NULL,
  title         TEXT,
  developer     TEXT,
  genre         TEXT,
  submitter_name TEXT,
  submitter_note TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  reviewer_note TEXT,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_status   ON public.game_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_universe ON public.game_submissions(universe_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created   ON public.game_submissions(created_at DESC);

-- 3. updated_at trigger (reuse handle_updated_at() if present; create if missing)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submissions_updated_at ON public.game_submissions;
CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON public.game_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Row Level Security
ALTER TABLE public.game_submissions ENABLE ROW LEVEL SECURITY;

-- Public users (anon + authenticated) may INSERT new submissions.
DROP POLICY IF EXISTS "Public insert submissions" ON public.game_submissions;
CREATE POLICY "Public insert submissions" ON public.game_submissions
  FOR INSERT WITH CHECK (true);

-- Public users may SELECT submissions (so submitters can track their own + admin queue reads).
-- Note: v1 makes the queue publicly readable. If you want to hide the queue, replace
-- USING (true) with USING (auth.role() = 'authenticated') AND add a separate anon SELECT
-- policy keyed by id (idempotent via a stable hashed URL); simplest path is public.
DROP POLICY IF EXISTS "Public read submissions" ON public.game_submissions;
CREATE POLICY "Public read submissions" ON public.game_submissions
  FOR SELECT USING (true);

-- No UPDATE/DELETE policies => only the service role (edge function) can modify rows.
-- Edge function uses the SERVICE_ROLE_KEY which bypasses RLS.
