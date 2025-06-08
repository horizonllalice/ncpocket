-- Clear All Data Script for Expense Tracker
-- This script will delete all data from all tables
-- Use with caution - this action cannot be undone!

-- Delete all transaction data first (child tables)
DELETE FROM fixed_expense_transactions;
DELETE FROM variable_expenses;
DELETE FROM wants_transactions;
DELETE FROM savings_transactions;
DELETE FROM daily_food_transactions;
DELETE FROM income_records;

-- Delete fixed expense structure
DELETE FROM fixed_expense_subitems;
DELETE FROM fixed_expense_categories;

-- Delete budget settings
DELETE FROM budget_settings;

-- Reset sequences (optional - to restart IDs from 1)
-- Note: Only run these if you want to reset auto-increment IDs
-- ALTER SEQUENCE fixed_expense_categories_id_seq RESTART WITH 1;
-- ALTER SEQUENCE fixed_expense_subitems_id_seq RESTART WITH 1;
-- ALTER SEQUENCE fixed_expense_transactions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE variable_expenses_id_seq RESTART WITH 1;
-- ALTER SEQUENCE wants_transactions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE savings_transactions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE daily_food_transactions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE income_records_id_seq RESTART WITH 1;
-- ALTER SEQUENCE budget_settings_id_seq RESTART WITH 1;

-- Verify all tables are empty
SELECT 'budget_settings' as table_name, COUNT(*) as record_count FROM budget_settings
UNION ALL
SELECT 'income_records', COUNT(*) FROM income_records
UNION ALL
SELECT 'fixed_expense_categories', COUNT(*) FROM fixed_expense_categories
UNION ALL
SELECT 'fixed_expense_subitems', COUNT(*) FROM fixed_expense_subitems
UNION ALL
SELECT 'fixed_expense_transactions', COUNT(*) FROM fixed_expense_transactions
UNION ALL
SELECT 'variable_expenses', COUNT(*) FROM variable_expenses
UNION ALL
SELECT 'wants_transactions', COUNT(*) FROM wants_transactions
UNION ALL
SELECT 'savings_transactions', COUNT(*) FROM savings_transactions
UNION ALL
SELECT 'daily_food_transactions', COUNT(*) FROM daily_food_transactions;