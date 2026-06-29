-- ─────────────────────────────────────────────────────────────────────────────
-- WhatBlox – Complete Admin Setup with RLS Disabled for Setup
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. TEMPORARILY DISABLE RLS FOR SETUP
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- 2. CLEAR ALL ADMIN DATA
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM moderation_logs;
DELETE FROM appeals;
DELETE FROM banned_users;
DELETE FROM admin_users;

-- 3. CREATE FRESH admin_users TABLE (if it doesn't exist)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator', 'reviewer')),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. INSERT YOU AS SUPER_ADMIN
-- ─────────────────────────────────────────────────────────────────────────────
-- Your Roblox ID: 1076229423
INSERT INTO admin_users (id, role, permissions, created_at, updated_at)
VALUES (
  '1076229423',
  'super_admin',
  ARRAY['review', 'ban_users', 'ban_games', 'view_analytics', 'view_logs', 'review_appeals', 'manage_admins'],
  NOW(),
  NOW()
);

-- 5. RE-ENABLE RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 6. DROP OLD POLICIES (if they exist)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_users_view" ON admin_users;
DROP POLICY IF EXISTS "admin_users_view_all" ON admin_users;
DROP POLICY IF EXISTS "admin_users_update" ON admin_users;
DROP POLICY IF EXISTS "admin_users_delete" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert" ON admin_users;

-- 7. CREATE NEW RLS POLICIES THAT WORK WITH CLIENT-SIDE ROLE FETCHING
-- ─────────────────────────────────────────────────────────────────────────────
-- Allow anyone authenticated to view admin roles (client will enforce UI permissions)
CREATE POLICY "admin_users_view_all" ON admin_users
  FOR SELECT
  USING (true);

-- Only super admins can update
CREATE POLICY "admin_users_update" ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role = 'super_admin'
    )
  );

-- Only super admins can delete
CREATE POLICY "admin_users_delete" ON admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role = 'super_admin'
    )
  );

-- Only super admins can insert
CREATE POLICY "admin_users_insert" ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role = 'super_admin'
    )
  );

-- 8. VERIFY THE SETUP
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 
  id,
  role,
  permissions,
  created_at
FROM admin_users
WHERE id = '1076229423';

-- Expected output:
-- id: 1076229423
-- role: super_admin
-- permissions: [review, ban_users, ban_games, view_analytics, view_logs, review_appeals, manage_admins]
