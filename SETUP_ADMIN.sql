-- ─────────────────────────────────────────────────────────────────────────────
-- WhatBlox – Complete Admin Setup (Clean Slate)
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. CLEAR ALL ADMIN DATA
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM moderation_logs;
DELETE FROM appeals;
DELETE FROM banned_users;
DELETE FROM admin_users;

-- 2. CREATE FRESH admin_users TABLE (if it doesn't exist)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator', 'reviewer')),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. INSERT YOU AS SUPER_ADMIN
-- ─────────────────────────────────────────────────────────────────────────────
-- Your Roblox ID: 1076229423
INSERT INTO admin_users (id, role, permissions, created_at, updated_at)
VALUES (
  '1076229423',
  'super_admin',
  ARRAY['review', 'ban_users', 'ban_games', 'view_analytics', 'view_logs', 'review_appeals', 'manage_admins'],
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  permissions = ARRAY['review', 'ban_users', 'ban_games', 'view_analytics', 'view_logs', 'review_appeals', 'manage_admins'],
  updated_at = NOW();

-- 4. VERIFY THE SETUP
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
-- created_at: (current timestamp)
