# Goal Implementation for Income, Needs, Wants, and Savings Cards

## Overview
This implementation adds the ability to save individual goal values for income, needs, wants, and savings cards to Supabase database. Previously, only the income goal was saved, while needs, wants, and savings goals were calculated dynamically based on percentages.

## Changes Made

### 1. Database Schema Updates (`supabase/schema.sql`)
Added new columns to the `budget_settings` table:
- `needs_goal DECIMAL(10,2) DEFAULT 18000`
- `wants_goal DECIMAL(10,2) DEFAULT 6000` 
- `savings_goal DECIMAL(10,2) DEFAULT 6000`

### 2. Database Functions Updates (`lib/database.js`)

#### Updated `getBudgetSettings()` function:
- Now returns the new goal fields with default values
- Provides fallback values when Supabase is not available

#### Updated `updateBudgetSettings()` function:
- Made more flexible to accept partial updates
- Now handles the new goal fields (`needs_goal`, `wants_goal`, `savings_goal`)
- Only updates fields that are provided in the settings object

### 3. Application Logic Updates (`pages/index.js`)

#### Updated `loadInitialData()` function:
- Now loads individual goal values from database
- Falls back to calculated values if goals are not set in database
- Uses `budgetSettings.needs_goal || (calculated value)` pattern

#### Updated `handleSubmit()` function:
- Added goal saving for needs, wants, and savings cards
- When user sets a goal for any card, it's now saved to database
- Each card type (income, needs, wants, savings) has its own save logic

#### Updated `handleSavePercentages()` function:
- When percentages are changed, recalculates and saves individual goals
- Ensures goals stay in sync with percentage allocations
- Saves all goal values when percentage allocation is updated

### 4. Migration Script (`scripts/add-goal-columns.sql`)
Created a migration script for existing databases:
- Adds new columns safely with `IF NOT EXISTS`
- Updates existing records with calculated goal values
- Ensures backward compatibility

## How It Works

### Goal Setting Flow:
1. User clicks "ตั้งเป้าหมาย" (Set Goal) on any card
2. Enters the desired goal amount
3. `handleSubmit()` function saves the goal to database using `updateBudgetSettings()`
4. Local state is updated to reflect the new goal

### Goal Loading Flow:
1. On app startup, `loadInitialData()` calls `getBudgetSettings()`
2. Individual goal values are loaded from database
3. If goals don't exist, calculated values are used as fallback
4. State is updated with the loaded/calculated goals

### Percentage Change Flow:
1. User changes percentage allocation
2. `handleSavePercentages()` calculates new goals based on income and percentages
3. Both percentages and calculated goals are saved to database
4. This keeps goals in sync with percentage allocations

## Benefits

1. **Persistent Goals**: Individual goals are now saved and persist across sessions
2. **Flexibility**: Users can set custom goals that don't strictly follow percentage rules
3. **Backward Compatibility**: Existing installations will continue to work
4. **Data Integrity**: Goals are automatically recalculated when percentages change

## Database Migration

For existing installations, run the migration script:
```sql
-- Run this in your Supabase SQL editor
\i scripts/add-goal-columns.sql
```

Or manually execute the SQL commands in `scripts/add-goal-columns.sql`.

## Testing

To verify the implementation:
1. Set goals for income, needs, wants, and savings cards
2. Refresh the page - goals should persist
3. Change percentage allocations - goals should update accordingly
4. Check Supabase database to confirm values are saved

The implementation ensures that all goal values are properly saved to and loaded from the Supabase database, providing a complete solution for persistent goal management.