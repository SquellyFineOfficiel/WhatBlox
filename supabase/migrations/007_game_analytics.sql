-- Create game analytics table
CREATE TABLE IF NOT EXISTS game_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_wishlist_adds INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_plays_today INTEGER DEFAULT 0,
  total_plays_week INTEGER DEFAULT 0,
  total_plays_month INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily analytics table for trend tracking
CREATE TABLE IF NOT EXISTS game_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  wishlist_adds INTEGER DEFAULT 0,
  comments_added INTEGER DEFAULT 0,
  reviews_added INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, date)
);

-- Create page views tracking
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS game_analytics_game_id_idx ON game_analytics(game_id);
CREATE INDEX IF NOT EXISTS game_analytics_daily_game_id_idx ON game_analytics_daily(game_id);
CREATE INDEX IF NOT EXISTS game_analytics_daily_date_idx ON game_analytics_daily(date);
CREATE INDEX IF NOT EXISTS page_views_game_id_idx ON page_views(game_id);
CREATE INDEX IF NOT EXISTS page_views_viewed_at_idx ON page_views(viewed_at);

-- Enable RLS
ALTER TABLE game_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- RLS: Allow all (checks done in API)
CREATE POLICY game_analytics_select_policy ON game_analytics FOR SELECT USING (true);
CREATE POLICY game_analytics_daily_select_policy ON game_analytics_daily FOR SELECT USING (true);
CREATE POLICY page_views_select_policy ON page_views FOR SELECT USING (true);
CREATE POLICY game_analytics_insert_policy ON game_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY game_analytics_daily_insert_policy ON game_analytics_daily FOR INSERT WITH CHECK (true);
CREATE POLICY game_analytics_daily_update_policy ON game_analytics_daily FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY page_views_insert_policy ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY game_analytics_update_policy ON game_analytics FOR UPDATE USING (true) WITH CHECK (true);

-- Function to initialize game analytics when game is created
CREATE OR REPLACE FUNCTION create_game_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO game_analytics (game_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create analytics on game creation
CREATE TRIGGER create_game_analytics_trigger
AFTER INSERT ON games
FOR EACH ROW
EXECUTE FUNCTION create_game_analytics();

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics(p_game_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO game_analytics_daily (game_id, date, views, clicks)
  SELECT p_game_id, p_date, COUNT(*), 0
  FROM page_views
  WHERE game_id = p_game_id
    AND DATE(viewed_at) = p_date
  ON CONFLICT (game_id, date) DO UPDATE
  SET views = (
    SELECT COUNT(*)
    FROM page_views
    WHERE game_id = p_game_id
      AND DATE(viewed_at) = p_date
  );
END;
$$ LANGUAGE plpgsql;
