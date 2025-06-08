-- Migration script to add goal columns to existing budget_settings table
-- Run this script if you have an existing database

-- Add the new goal columns to budget_settings table
ALTER TABLE budget_settings 
ADD COLUMN IF NOT EXISTS needs_goal DECIMAL(10,2) DEFAULT 18000,
ADD COLUMN IF NOT EXISTS wants_goal DECIMAL(10,2) DEFAULT 6000,
ADD COLUMN IF NOT EXISTS savings_goal DECIMAL(10,2) DEFAULT 6000;

-- Update existing records to set goals based on current income_goal and percentages
UPDATE budget_settings 
SET 
  needs_goal = COALESCE(income_goal * (needs_percentage / 100.0), 18000),
  wants_goal = COALESCE(income_goal * (wants_percentage / 100.0), 6000),
  savings_goal = COALESCE(income_goal * (savings_percentage / 100.0), 6000)
WHERE needs_goal IS NULL OR wants_goal IS NULL OR savings_goal IS NULL;