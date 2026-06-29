-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'moderator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banned games table
CREATE TABLE IF NOT EXISTS banned_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ban_expires_at TIMESTAMP WITH TIME ZONE
);

-- Create banned users table
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ban_expires_at TIMESTAMP WITH TIME ZONE
);

-- Create admin actions log table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY rls_banned_games_select ON banned_games FOR SELECT USING (true);
CREATE POLICY rls_banned_games_insert ON banned_games FOR INSERT WITH CHECK (true);
CREATE POLICY rls_banned_users_select ON banned_users FOR SELECT USING (true);
CREATE POLICY rls_banned_users_insert ON banned_users FOR INSERT WITH CHECK (true);
CREATE POLICY rls_admin_users_select ON admin_users FOR SELECT USING (true);
CREATE POLICY rls_admin_actions_select ON admin_actions FOR SELECT USING (true);
CREATE POLICY rls_admin_actions_insert ON admin_actions FOR INSERT WITH CHECK (true);
