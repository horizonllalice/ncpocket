-- Clear User Data Script for Expense Tracker
-- This script will delete data for the default user only
-- Safer than clearing all data if you have multiple users

-- Set the user ID to clear (default single-user application)
-- Change this if you want to clear data for a different user
DO $$
DECLARE
    target_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Delete all transaction data for the user
    DELETE FROM fixed_expense_transactions 
    WHERE category_id IN (
        SELECT id FROM fixed_expense_categories WHERE user_id = target_user_id
    );
    
    DELETE FROM variable_expenses WHERE user_id = target_user_id;
    DELETE FROM wants_transactions WHERE user_id = target_user_id;
    DELETE FROM savings_transactions WHERE user_id = target_user_id;
    DELETE FROM daily_food_transactions WHERE user_id = target_user_id;
    DELETE FROM income_records WHERE user_id = target_user_id;
    
    -- Delete fixed expense structure for the user
    DELETE FROM fixed_expense_subitems 
    WHERE category_id IN (
        SELECT id FROM fixed_expense_categories WHERE user_id = target_user_id
    );
    
    DELETE FROM fixed_expense_categories WHERE user_id = target_user_id;
    
    -- Delete budget settings for the user
    DELETE FROM budget_settings WHERE user_id = target_user_id;
    
    -- Show summary of what was deleted
    RAISE NOTICE 'Data cleared for user: %', target_user_id;
END $$;

-- Verify user data is cleared
SELECT 'budget_settings' as table_name, COUNT(*) as record_count 
FROM budget_settings 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 'income_records', COUNT(*) 
FROM income_records 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 'fixed_expense_categories', COUNT(*) 
FROM fixed_expense_categories 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 'variable_expenses', COUNT(*) 
FROM variable_expenses 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 'wants_transactions', COUNT(*) 
FROM wants_transactions 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 'savings_transactions', COUNT(*) 
FROM savings_transactions 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 'daily_food_transactions', COUNT(*) 
FROM daily_food_transactions 
WHERE user_id = '00000000-0000-0000-0000-000000000000';