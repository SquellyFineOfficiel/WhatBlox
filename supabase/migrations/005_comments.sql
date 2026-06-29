-- Create comments table for game discussions
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE,
  UNIQUE(id)
);

-- Create comment_likes table for tracking likes on comments
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS comments_game_id_idx ON comments(game_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_id_idx ON comment_likes(user_id);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read comments on any game
CREATE POLICY comments_select_policy ON comments
  FOR SELECT
  USING (true);

-- RLS Policy: Users can only create comments as themselves
CREATE POLICY comments_insert_policy ON comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own comments
CREATE POLICY comments_update_policy ON comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own comments
CREATE POLICY comments_delete_policy ON comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can see comment likes (for UI purposes)
CREATE POLICY comment_likes_select_policy ON comment_likes
  FOR SELECT
  USING (true);

-- RLS Policy: Users can only like comments as themselves
CREATE POLICY comment_likes_insert_policy ON comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only unlike comments they liked
CREATE POLICY comment_likes_delete_policy ON comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update comment reply_count when replies are added/deleted
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments
    SET reply_count = reply_count - 1
    WHERE id = OLD.parent_id AND reply_count > 0;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update reply count
CREATE TRIGGER comment_reply_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
WHEN (NEW.parent_id IS NOT NULL OR OLD.parent_id IS NOT NULL)
EXECUTE FUNCTION update_comment_reply_count();

-- Function to update comment likes_count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments
    SET likes_count = likes_count - 1
    WHERE id = OLD.comment_id AND likes_count > 0;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update likes count
CREATE TRIGGER comment_likes_count_trigger
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();
