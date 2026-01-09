-- Add 'dungeon' as a location_type option
-- This allows locations to be marked as dungeons, which can then have
-- associated dungeon metadata (recommended_level, difficulty_level, etc.)

-- The location_type column already exists from script 043_add_shop_npcs.sql
-- This script documents that 'dungeon' is a valid option

-- Valid location_type values:
-- - village
-- - forest
-- - camp
-- - port
-- - ruins
-- - city
-- - dungeon (new)

-- Note: When a location has location_type = 'dungeon', it can optionally
-- have an associated record in the 'dungeons' table with additional metadata

