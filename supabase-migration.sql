-- WhatBlox Games Table Migration
-- Run this in Supabase SQL Editor
-- WARNING: This drops ALL tables in public schema!

-- 1. Drop ALL tables in public schema
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;

-- 2. Create new table with WhatBlox schema
CREATE TABLE public.games (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  developer TEXT NOT NULL,
  players_now INTEGER DEFAULT 0,
  total_visits BIGINT DEFAULT 0,
  description TEXT,
  gradient_from TEXT NOT NULL,
  gradient_to TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  roblox_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON public.games
  FOR SELECT USING (true);

-- 3. Insert seed data (mapped from old schema)
INSERT INTO public.games (id, title, genre, developer, players_now, total_visits, description, gradient_from, gradient_to, icon_name, roblox_url, created_at) VALUES
  -- Dropping
  ('01220dbb-0d3c-43c5-a5f3-fd61858d5d2f',
   'Dropping',
   'Obby',
   'User 1076229423',
   1247,
   89000,
   'Still in beta, there might be some bugs.',
   '#1A1A2E', '#16213E',
   'gamepad2',
   'https://www.roblox.com/games/95137292228279/Dropping',
   '2026-06-29 09:03:43.932744+00'),

  -- SLIPSHIFT (BETA)
  ('462c1030-69af-409a-842c-cc0e58a22032',
   'SLIPSHIFT (BETA)',
   'Action',
   'User 3522931236',
   3421,
   156000,
   'Navigate a world where the environment constantly shifts beneath your feet. Dodge deadly obstacles, survive unpredictable events, and master every twist the game throws at you. Every round is different, and every second matters.

Unexpected hazards
Earn rewards and climb the leader boards
Play solo or with friends

Do you have what it takes to adapt?

Like & Favorite the game to support future updates!',
   '#0F0F23', '#1A1A3E',
   'zap',
   'https://www.roblox.com/games/125825792074380/SLIPSHIFT',
   '2026-06-30 22:49:08.322089+00'),

  -- Beyond Infinity
  ('a7e9a370-d258-4d3e-a581-a182604bb27f',
   'Beyond Infinity',
   'RPG',
   'User 1623092',
   8765,
   2340000,
   'FIGHT enemy forces and complete world events to increase the World Difficulty Level.
UPGRADE your gear to fight against powerful bosses and survive high level threats.
PROGRESS further and unlock new challenges, receive better rewards as the difficulty increases.

Daily Updates – New content, events, and fixes are released every single day.
Mobile devices and consoles are supported

Controls (PC)
WASD – Movement
Left mouse button – Attack
Right mouse button – Dash
Shift – Dash/Sprint
Ctrl – Unlock mouse cursor
Tab – Swap weapon (Only in Manual Weapon Swap mode)',
   '#1B0A2E', '#2D1B4E',
   'sword',
   'https://www.roblox.com/games/27342219/Beyond-Infinity',
   '2026-06-30 09:56:43.620861+00'),

  -- Anomaly Investigators
  ('b8f50536-d0e6-4af9-852a-9da98313213a',
   'Anomaly Investigators – Spot What Changed',
   'Horror',
   'User 157888274',
   5632,
   445000,
   'Something is wrong… but can you spot it?

Trust your memory… or reset the timeline. Play solo or with up to 5 players in this online co-op where every round is different and reality is never stable.

How To Play:
Play solo or co-op (up to 5 players)
Each round the map may or may not have anomalies
Memorize the environment during the stable timeline
Decide: is there an anomaly or is the timeline safe?
Communicate or rely on your own observations

Core Rules:
Each round may contain anomalies… or none at all
Correctly finding anomalies reduces how many anomalies are left
Correctly calling a safe timeline also reduces how many anomalies are left
Wrong answers reset anomaly progress back to stable timeline
Reduce anomalies left to 0 to win

Progression:
Earn XP for correct decisions
Higher ranks (S–F) based on performance
Gamepass doubles XP rewards

Remember: every round is new, every detail matters, and one wrong call can reset everything.',
   '#0D1B1A', '#1A2E2B',
   'radio',
   'https://www.roblox.com/games/94919747474848/Anomaly-Investigators-Spot-What-Changed',
   '2026-06-30 12:30:48.10825+00'),

  -- +1 Speed Keyboard Escape | Winter
  ('cb5b1451-4309-4e3a-a9c6-674863431f88',
   '+1 Speed Keyboard Escape | Winter',
   'Racing',
   'User 587615996',
   12340,
   1200000,
   'Welcome to +1 Speed Keyboard Escape | Winter!

Every step = +1 Speed
Run, jump, and escape across a world made of icy & snowy keyboard keys
Train your speed and unlock powerful multipliers
Race against friends and other players
Become the FASTEST on the server
Speed is everything… but one wrong move and you''re back at the start

ASMR vibes included
Smooth movement, satisfying keyboard clicks, frosty visuals, and relaxing winter sounds for a perfect mix of speed & chill',
   '#1E3A5F', '#2E5A8F',
   'car',
   'https://www.roblox.com/games/109755268562847/1-Speed-Keyboard-Escape-Winter',
   '2026-06-29 14:49:18.225817+00'),

  -- Wheat Incremental
  ('cff289dc-2e28-4d76-88ef-7bb8f040fa55',
   'Wheat Incremental',
   'Simulation',
   'User 1076229423',
   8921,
   567000,
   'Welcome to Wheat Incremental

Harvest Wheat and rare variants as you grow stronger.
Upgrade your skills and progression to earn faster and unlock more power.
Collect powerful cards with rarities ranging from Common to Legendary and Mythic.

Simple to start, endless to master.
Progress auto-saves so you can play anytime.
Compete on the leaderboards and become the ultimate farmer.

Premium players get 2.5x Wheat.
Group members get 1.5x Wheat and 1.5x Exp.
For each Friend in the Server you get a +10% Wheat Bonus.',
   '#2D4A2B', '#3D6B3A',
   'feather',
   'https://www.roblox.com/games/86738756606261/Wheat-Incremental',
   '2026-06-30 21:10:38.433148+00'),

  -- 360 degree flinging
  ('e526a9ab-eed6-4495-ab9d-0a6f048e4490',
   '360 Degree Flinging of Difficulties',
   'Simulator',
   'User 653303244',
   3210,
   78000,
   'In this game you can fling in EVERY direction!

be sure to like and favorite the game!

made by a professional and skilled scripter piotrekstel
built by a talented and smart player jullein261',
   '#2E1A1A', '#4A2A2A',
   'zap',
   'https://www.roblox.com/games/16226274386/360-degree-flinging-of-difficulties',
   '2026-07-02 09:48:38.460249+00'),

  -- Steal The Mango!
  ('ee1c02e5-7948-4be1-813e-d6568da44e34',
   'Steal The Mango!',
   'PvP',
   'User 653303244',
   15670,
   890000,
   'big update at 1000 likes

welcome to steal the mango
favorite the game for +30% cash
join group for +60% cash

play:
defend base
steal from other base
collect cash
buy mango
rebirth
get best mango in game


tags: phonk, mango, those who know, aura, mewing, sigma mango',
   '#3D2A0A', '#5D4A1A',
   'gem',
   'https://www.roblox.com/games/84309782346535/Steal-The-Mango',
   '2026-06-30 14:35:52.808931+00'),

  -- Perfect Draw
  ('ff91c29c-7000-4d25-bf95-e1257bb98fc4',
   'Perfect Draw',
   'Creative',
   'User 1623092',
   6543,
   345000,
   'Cozy drawing game where you will be trying to draw a perfect picture

Goal: draw the target image as perfectly as you can
Compete: see other players scores and compete on the leaderboard
Customize: edit your profile with cute background images and particle effects

Safe for kids: other players drawings are never displayed to keep this place safe and fun
Fun for everyone: players of all ages can enjoy the game and find both entertaining and challenging content

Share your ideas in our community forums — your voice matters',
   '#2E1A3D', '#4A2A5E',
   'star',
   'https://www.roblox.com/games/127268323610271/Perfect-Draw',
   '2026-07-06 18:24:10.418363+00');

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Create indexes
CREATE INDEX idx_games_genre ON public.games(genre);
CREATE INDEX idx_games_players_now ON public.games(players_now DESC);
CREATE INDEX idx_games_total_visits ON public.games(total_visits DESC);
CREATE INDEX idx_games_created_at ON public.games(created_at DESC);

-- 6. Maintenance configuration table
CREATE TABLE public.maintenance_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL DEFAULT 'We''re making WhatBlox even better. Be right back!',
  estimated_time TEXT NOT NULL DEFAULT 'We''ll be back shortly',
  message_app TEXT,
  message_landing TEXT,
  estimated_time_app TEXT,
  estimated_time_landing TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.maintenance_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON public.maintenance_config
  FOR SELECT USING (true);

-- Insert default config
INSERT INTO public.maintenance_config (id, enabled, message, estimated_time)
VALUES ('00000000-0000-0000-0000-000000000001', false, 'We''re making WhatBlox even better. Be right back!', 'We''ll be back shortly');

-- Create updated_at trigger
CREATE TRIGGER maintenance_config_updated_at
  BEFORE UPDATE ON public.maintenance_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Rolimons Items Table
CREATE TABLE public.rolimons_items (
  item_id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  acronym TEXT,
  rap BIGINT DEFAULT 0,
  value BIGINT DEFAULT 0,
  demand DECIMAL(3,1) DEFAULT 0,
  trend SMALLINT DEFAULT 0,
  projected BOOLEAN DEFAULT FALSE,
  hyped BOOLEAN DEFAULT FALSE,
  rare BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  item_type TEXT,
  creator_id BIGINT,
  creator_name TEXT,
  created TIMESTAMPTZ,
  updated TIMESTAMPTZ,
  description TEXT,
  tags TEXT[],
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rolimons_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON public.rolimons_items
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update (admin only via policy)
CREATE POLICY "Authenticated insert" ON public.rolimons_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update" ON public.rolimons_items
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE TRIGGER rolimons_items_updated_at
  BEFORE UPDATE ON public.rolimons_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_rolimons_items_rap ON public.rolimons_items(rap DESC);
CREATE INDEX idx_rolimons_items_value ON public.rolimons_items(value DESC);
CREATE INDEX idx_rolimons_items_demand ON public.rolimons_items(demand DESC);
CREATE INDEX idx_rolimons_items_item_type ON public.rolimons_items(item_type);
CREATE INDEX idx_rolimons_items_projected ON public.rolimons_items(projected);
CREATE INDEX idx_rolimons_items_hyped ON public.rolimons_items(hyped);
CREATE INDEX idx_rolimons_items_rare ON public.rolimons_items(rare);