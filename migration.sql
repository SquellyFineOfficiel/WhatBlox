-- WhatBlox – Admin Panel & Moderation Migration
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add status tracking and reviewer message to the games table
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'review',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_message TEXT,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 2. Make sure all pre-existing rows are marked as approved
UPDATE games SET status = 'approved' WHERE status = 'approved' OR (status IS NULL OR status = '');

-- 3. Add unique constraint on roblox_url to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_roblox_url'
  ) THEN
    ALTER TABLE games ADD CONSTRAINT unique_roblox_url UNIQUE(roblox_url);
  END IF;
END $$;

-- 4. Create admin_users table for role-based access (TEXT IDs for Roblox profile IDs)
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator', 'reviewer')),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create banned_users table
CREATE TABLE IF NOT EXISTS banned_users (
  id TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  banned_by TEXT REFERENCES admin_users(id),
  banned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- 6. Create moderation_logs table for audit trail
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL CHECK (action IN ('game_approved', 'game_rejected', 'game_banned', 'user_banned', 'user_unbanned', 'appeal_reviewed')),
  target_type TEXT NOT NULL CHECK (target_type IN ('game', 'user')),
  target_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create appeals table
CREATE TABLE IF NOT EXISTS appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('game', 'user')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response TEXT,
  reviewed_by TEXT REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_status     ON games (status);
CREATE INDEX IF NOT EXISTS idx_games_user_id    ON games (user_id);
CREATE INDEX IF NOT EXISTS idx_games_roblox_url ON games (roblox_url);
CREATE INDEX IF NOT EXISTS idx_games_banned_at  ON games (banned_at);
CREATE INDEX IF NOT EXISTS idx_votes_game_id    ON votes (game_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id    ON votes (user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_active ON banned_users (is_active);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin ON moderation_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals (status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS) Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only super admins and the user themselves can view admin profiles
CREATE POLICY "admin_users_view" ON admin_users
  FOR SELECT
  USING (
    auth.uid()::text = id 
    OR EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role = 'super_admin'
    )
  );

-- Only super admins can update or delete admin users
CREATE POLICY "admin_users_update" ON admin_users
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role = 'super_admin'));

CREATE POLICY "admin_users_delete" ON admin_users
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role = 'super_admin'));

-- Only super admins can insert new admin users
CREATE POLICY "admin_users_insert" ON admin_users
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role = 'super_admin'));

-- Enable RLS on banned_users table
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- Admins can view banned users, banned users can view their own ban
CREATE POLICY "banned_users_view" ON banned_users
  FOR SELECT
  USING (
    auth.uid()::text = id 
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text)
  );

-- Only moderators and super_admins can update banned status
CREATE POLICY "banned_users_update" ON banned_users
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid()::text AND role IN ('moderator', 'super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid()::text AND role IN ('moderator', 'super_admin')
  ));

-- Only moderators and super_admins can ban users
CREATE POLICY "banned_users_insert" ON banned_users
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid()::text AND role IN ('moderator', 'super_admin')
  ));

-- Enable RLS on moderation_logs table
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation logs
CREATE POLICY "moderation_logs_view" ON moderation_logs
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text));

-- Only admins can create moderation logs
CREATE POLICY "moderation_logs_insert" ON moderation_logs
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text));

-- Admins can only delete their own logs (or super_admin can delete any)
CREATE POLICY "moderation_logs_delete" ON moderation_logs
  FOR DELETE
  USING (
    admin_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role = 'super_admin')
  );

-- Enable RLS on appeals table
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;

-- Users can view their own appeals, admins can view all
CREATE POLICY "appeals_view" ON appeals
  FOR SELECT
  USING (
    auth.uid()::text = user_id 
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text)
  );

-- Users can create their own appeals
CREATE POLICY "appeals_insert" ON appeals
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Only admins can update appeals
CREATE POLICY "appeals_update" ON appeals
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text));

-- ─────────────────────────────────────────────────────────────────────────────
-- How to Add Yourself as Super Admin
-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Find your Roblox User ID
-- 
--   1. Go to your profile on whatblox.com
--   2. Check the URL or browser console (your user_id from any submitted game)
--   3. Your ID will be a number like: 123456789
--
-- Step 2: Run this SQL (replace YOUR_ROBLOX_ID with your actual ID)
--
-- INSERT INTO admin_users (id, role, permissions)
-- VALUES (
--   'YOUR_ROBLOX_ID',
--   'super_admin',
--   ARRAY['review', 'ban_users', 'ban_games', 'view_analytics', 'view_logs', 'review_appeals', 'manage_admins']
-- );
--
-- Step 3: Refresh your browser and navigate to /admin/manage-admins
--
-- ─────────────────────────────────────────────────────────────────────────────
