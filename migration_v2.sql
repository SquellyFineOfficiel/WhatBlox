-- WhatBlox v2 Migration
-- Run in Supabase SQL Editor

-- 1. Add tags column to games
ALTER TABLE games ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_games_tags ON games USING GIN(tags);

-- 2. Ensure profiles table has needed columns
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- 3. Vote score index for fast sorting
CREATE INDEX IF NOT EXISTS idx_votes_value ON votes(game_id, value);

-- 4. Ensure wishlist_items cascade delete when a wishlist is removed
DO $$
DECLARE
  fk_name TEXT;
  is_cascade BOOLEAN;
BEGIN
  SELECT tc.constraint_name, (rc.delete_rule = 'CASCADE')
    INTO fk_name, is_cascade
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
  WHERE tc.table_name = 'wishlist_items'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'wishlist_id'
  LIMIT 1;

  IF fk_name IS NOT NULL AND NOT is_cascade THEN
    EXECUTE format('ALTER TABLE wishlist_items DROP CONSTRAINT %I', fk_name);
    ALTER TABLE wishlist_items
      ADD CONSTRAINT wishlist_items_wishlist_id_fkey
      FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE;
  ELSIF fk_name IS NULL THEN
    ALTER TABLE wishlist_items
      ADD CONSTRAINT wishlist_items_wishlist_id_fkey
      FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Recently viewed is purely localStorage, no migration needed
