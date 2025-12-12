-- Add new fields to characters table for expanded character information
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS class TEXT,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 20),
ADD COLUMN IF NOT EXISTS alignment TEXT,
ADD COLUMN IF NOT EXISTS background TEXT,
ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0,
-- The 6 core D&D attributes
ADD COLUMN IF NOT EXISTS strength INTEGER DEFAULT 10 CHECK (strength >= 1 AND strength <= 30),
ADD COLUMN IF NOT EXISTS dexterity INTEGER DEFAULT 10 CHECK (dexterity >= 1 AND dexterity <= 30),
ADD COLUMN IF NOT EXISTS constitution INTEGER DEFAULT 10 CHECK (constitution >= 1 AND constitution <= 30),
ADD COLUMN IF NOT EXISTS intelligence INTEGER DEFAULT 10 CHECK (intelligence >= 1 AND intelligence <= 30),
ADD COLUMN IF NOT EXISTS wisdom INTEGER DEFAULT 10 CHECK (wisdom >= 1 AND wisdom <= 30),
ADD COLUMN IF NOT EXISTS charisma INTEGER DEFAULT 10 CHECK (charisma >= 1 AND charisma <= 30),
-- Combat stats
ADD COLUMN IF NOT EXISTS max_hit_points INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS current_hit_points INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS armor_class INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS speed INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS initiative_bonus INTEGER DEFAULT 0,
-- Narrative fields
ADD COLUMN IF NOT EXISTS physical_description TEXT,
ADD COLUMN IF NOT EXISTS personality_traits TEXT,
ADD COLUMN IF NOT EXISTS backstory TEXT;

-- Create index for class and level lookups
CREATE INDEX IF NOT EXISTS idx_characters_class ON characters(class);
CREATE INDEX IF NOT EXISTS idx_characters_level ON characters(level);
