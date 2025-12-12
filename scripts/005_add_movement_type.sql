-- Add movement_type column to movements table
ALTER TABLE movements ADD COLUMN IF NOT EXISTS movement_type TEXT DEFAULT 'conversion';

-- Update existing records to have movement_type
UPDATE movements SET movement_type = 'conversion' WHERE movement_type IS NULL;

-- Add comment to describe the column
COMMENT ON COLUMN movements.movement_type IS 'Type of movement: conversion, add, remove';
