-- Create admin actions log table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'ban_game', 'unban_game', 'ban_user', 'unban_user', 'moderate_content'
  target_type TEXT NOT NULL, -- 'game', 'user', 'comment', 'review'
  target_id UUID,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banned games table
CREATE TABLE IF NOT EXISTS banned_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ban_expires_at TIMESTAMP WITH TIME ZONE
);

-- Create banned users table
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ban_expires_at TIMESTAMP WITH TIME ZONE
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'moderator', -- 'moderator', 'admin', 'super_admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS admin_actions_admin_id_idx ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS admin_actions_action_type_idx ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS admin_actions_created_at_idx ON admin_actions(created_at);
CREATE INDEX IF NOT EXISTS banned_games_created_at_idx ON banned_games(created_at);
CREATE INDEX IF NOT EXISTS banned_users_created_at_idx ON banned_users(created_at);

-- Enable RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can view admin actions (check via admin_users table)
CREATE POLICY admin_actions_select_policy ON admin_actions
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- RLS: Only admins can insert admin actions
CREATE POLICY admin_actions_insert_policy ON admin_actions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- RLS: Anyone can view if they're banned (for their own record)
CREATE POLICY banned_games_select_policy ON banned_games
  FOR SELECT
  USING (true);

CREATE POLICY banned_users_select_policy ON banned_users
  FOR SELECT
  USING (true);

-- RLS: Admin users info (public for verification)
CREATE POLICY admin_users_select_policy ON admin_users
  FOR SELECT
  USING (true);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM admin_users WHERE user_id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-unban expired bans
CREATE OR REPLACE FUNCTION cleanup_expired_bans()
RETURNS void AS $$
BEGIN
  DELETE FROM banned_games WHERE ban_expires_at IS NOT NULL AND ban_expires_at <= NOW();
  DELETE FROM banned_users WHERE ban_expires_at IS NOT NULL AND ban_expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;
