-- Update movements table to allow negative amounts for "remove" operations
-- Drop existing constraints
ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_amount_from_check;
ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_amount_to_check;

-- Add new constraints that allow any decimal value (positive or negative)
ALTER TABLE movements ADD CONSTRAINT movements_amount_from_check CHECK (amount_from <> 0);
ALTER TABLE movements ADD CONSTRAINT movements_amount_to_check CHECK (amount_to <> 0);

-- Add movement_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movements' AND column_name='movement_type') THEN
        ALTER TABLE movements ADD COLUMN movement_type TEXT DEFAULT 'conversion';
    END IF;
END $$;
