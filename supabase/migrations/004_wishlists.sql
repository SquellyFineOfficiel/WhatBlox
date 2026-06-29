-- WhatBlox Wishlist and Favorites System Migration
-- This migration adds wishlists for users to save and organize their favorite games

-- Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create wishlist_items table (junction table for games in wishlists)
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wishlist_id, game_id)
);

-- Create a default "Favorites" wishlist for new users (we'll do this in the app)
-- or create indexes for performance
CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON public.wishlists (user_id);
CREATE INDEX IF NOT EXISTS wishlists_is_public_idx ON public.wishlists (is_public);
CREATE INDEX IF NOT EXISTS wishlist_items_wishlist_id_idx ON public.wishlist_items (wishlist_id);
CREATE INDEX IF NOT EXISTS wishlist_items_game_id_idx ON public.wishlist_items (game_id);
CREATE INDEX IF NOT EXISTS wishlist_items_added_at_idx ON public.wishlist_items (added_at DESC);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Wishlists RLS Policies
-- Users can view public wishlists
CREATE POLICY "wishlists_view_public" ON public.wishlists
  FOR SELECT
  USING (is_public = true);

-- Users can view their own wishlists
CREATE POLICY "wishlists_view_own" ON public.wishlists
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can create wishlists
CREATE POLICY "wishlists_insert" ON public.wishlists
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own wishlists
CREATE POLICY "wishlists_update" ON public.wishlists
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own wishlists
CREATE POLICY "wishlists_delete" ON public.wishlists
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Wishlist items RLS Policies
-- Users can view items in public wishlists
CREATE POLICY "wishlist_items_view_public" ON public.wishlist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE id = wishlist_id AND is_public = true
    )
  );

-- Users can view items in their own wishlists
CREATE POLICY "wishlist_items_view_own" ON public.wishlist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE id = wishlist_id AND user_id = auth.uid()::text
    )
  );

-- Users can add items to their own wishlists
CREATE POLICY "wishlist_items_insert" ON public.wishlist_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE id = wishlist_id AND user_id = auth.uid()::text
    )
  );

-- Users can delete items from their own wishlists
CREATE POLICY "wishlist_items_delete" ON public.wishlist_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE id = wishlist_id AND user_id = auth.uid()::text
    )
  );
