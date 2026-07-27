-- Run in Supabase SQL Editor to drop ALL tables EXCEPT 'games'
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename != 'games'
  ) LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    RAISE NOTICE 'Dropped table: %', r.tablename;
  END LOOP;
END $$;

-- Verify remaining tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';