-- Create game_followers table for users to follow games
CREATE TABLE IF NOT EXISTS game_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Create developer_notifications table for tracking sent notifications
CREATE TABLE IF NOT EXISTS developer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table to track notification sending rate limits
CREATE TABLE IF NOT EXISTS notification_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_count INT DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, window_start)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS game_followers_user_id_idx ON game_followers(user_id);
CREATE INDEX IF NOT EXISTS game_followers_game_id_idx ON game_followers(game_id);
CREATE INDEX IF NOT EXISTS game_followers_created_at_idx ON game_followers(created_at);
CREATE INDEX IF NOT EXISTS developer_notifications_game_id_idx ON developer_notifications(game_id);
CREATE INDEX IF NOT EXISTS developer_notifications_creator_id_idx ON developer_notifications(creator_id);
CREATE INDEX IF NOT EXISTS notification_rate_limits_user_id_idx ON notification_rate_limits(user_id);

-- Enable RLS
ALTER TABLE game_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_followers
CREATE POLICY game_followers_select_policy ON game_followers
  FOR SELECT
  USING (TRUE);

CREATE POLICY game_followers_insert_policy ON game_followers
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY game_followers_delete_policy ON game_followers
  FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- RLS Policies for developer_notifications (read-only for users)
CREATE POLICY developer_notifications_select_policy ON developer_notifications
  FOR SELECT
  USING (TRUE);

-- Developers can insert their own notifications
CREATE POLICY developer_notifications_insert_policy ON developer_notifications
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = creator_id);

-- Only service role can update (for tracking notification count)
-- RLS Policies for notification_rate_limits
CREATE POLICY notification_rate_limits_select_policy ON notification_rate_limits
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY notification_rate_limits_insert_policy ON notification_rate_limits
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY notification_rate_limits_update_policy ON notification_rate_limits
  FOR UPDATE
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

-- Function to get follower count for a game
CREATE OR REPLACE FUNCTION get_game_follower_count(game_uuid UUID)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM game_followers WHERE game_id = game_uuid);
END;
$$ LANGUAGE plpgsql;
