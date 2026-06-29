-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'comment', 'reply', 'review', 'like', 'game_update'
  related_game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  related_review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id)
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_comments BOOLEAN DEFAULT TRUE,
  notify_replies BOOLEAN DEFAULT TRUE,
  notify_reviews BOOLEAN DEFAULT TRUE,
  notify_likes BOOLEAN DEFAULT TRUE,
  notify_game_updates BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_game_id_idx ON notifications(related_game_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies: Only update user's own notifications
CREATE POLICY notifications_update_policy ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Only system can insert notifications (via trigger or API with service role)
-- For this, we'll allow via API only, not directly from client

-- RLS Policies: Users can manage their notification preferences
CREATE POLICY notification_prefs_select_policy ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY notification_prefs_insert_policy ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notification_prefs_update_policy ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to create default notification preferences when user signs up
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification preferences on signup
CREATE TRIGGER create_notification_preferences_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_notification_preferences();
