-- Add notification preferences to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS profiles_notifications_enabled_idx ON profiles(notifications_enabled);

-- Update existing profiles to have notifications enabled by default
UPDATE profiles SET notifications_enabled = TRUE WHERE notifications_enabled IS NULL;
