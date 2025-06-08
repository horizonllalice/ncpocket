-- Clear all budget settings data
DELETE FROM budget_settings;

-- Reset the table
TRUNCATE TABLE budget_settings RESTART IDENTITY CASCADE;