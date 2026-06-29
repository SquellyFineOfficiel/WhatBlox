-- WhatBlox Reviews and Ratings System Migration
-- This migration adds user reviews and star ratings for games

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  unhelpful_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'deleted', 'reported')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Create review_helpful table to track helpful/unhelpful votes
CREATE TABLE IF NOT EXISTS public.review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS reviews_game_id_idx ON public.reviews (game_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON public.reviews (rating);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS review_helpful_review_id_idx ON public.review_helpful (review_id);
CREATE INDEX IF NOT EXISTS review_helpful_user_id_idx ON public.review_helpful (user_id);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful ENABLE ROW LEVEL SECURITY;

-- Reviews RLS Policies
-- Anyone can view published reviews
CREATE POLICY "reviews_view_published" ON public.reviews
  FOR SELECT
  USING (status = 'published');

-- Users can view their own deleted/reported reviews
CREATE POLICY "reviews_view_own" ON public.reviews
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Only admins can view all reviews regardless of status
CREATE POLICY "reviews_view_admin" ON public.reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Users can insert their own reviews
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own reviews
CREATE POLICY "reviews_update" ON public.reviews
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own reviews
CREATE POLICY "reviews_delete" ON public.reviews
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Review helpful RLS Policies
-- Anyone can view review helpful votes
CREATE POLICY "review_helpful_view" ON public.review_helpful
  FOR SELECT
  USING (TRUE);

-- Users can insert their own helpful votes
CREATE POLICY "review_helpful_insert" ON public.review_helpful
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own helpful votes
CREATE POLICY "review_helpful_update" ON public.review_helpful
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own helpful votes
CREATE POLICY "review_helpful_delete" ON public.review_helpful
  FOR DELETE
  USING (auth.uid()::text = user_id);
