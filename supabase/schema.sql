-- Create tables for expense tracker

-- Users table (optional, for multi-user support)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget settings table
CREATE TABLE IF NOT EXISTS budget_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  needs_percentage INTEGER DEFAULT 60,
  wants_percentage INTEGER DEFAULT 20,
  savings_percentage INTEGER DEFAULT 20,
  income_goal DECIMAL(10,2) DEFAULT 30000,
  needs_goal DECIMAL(10,2) DEFAULT 18000,
  wants_goal DECIMAL(10,2) DEFAULT 6000,
  savings_goal DECIMAL(10,2) DEFAULT 6000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Income records table
CREATE TABLE IF NOT EXISTS income_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixed expenses categories table
CREATE TABLE IF NOT EXISTS fixed_expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixed expenses sub-items table
CREATE TABLE IF NOT EXISTS fixed_expense_subitems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES fixed_expense_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixed expense transactions table
CREATE TABLE IF NOT EXISTS fixed_expense_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES fixed_expense_categories(id) ON DELETE CASCADE,
  subitem_id UUID REFERENCES fixed_expense_subitems(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Variable expenses table
CREATE TABLE IF NOT EXISTS variable_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wants transactions table
CREATE TABLE IF NOT EXISTS wants_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Savings transactions table
CREATE TABLE IF NOT EXISTS savings_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily food transactions table
CREATE TABLE IF NOT EXISTS daily_food_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budget_settings_user_id ON budget_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_income_records_user_id ON income_records(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expense_categories_user_id ON fixed_expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expense_subitems_category_id ON fixed_expense_subitems(category_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expense_transactions_category_id ON fixed_expense_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expense_transactions_subitem_id ON fixed_expense_transactions(subitem_id);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_user_id ON variable_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_wants_transactions_user_id ON wants_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user_id ON savings_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_food_transactions_user_id ON daily_food_transactions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expense_subitems ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expense_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wants_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_food_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (for single user, allow all operations)
-- You can modify these policies based on your authentication requirements

CREATE POLICY "Allow all operations for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for budget_settings" ON budget_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations for income_records" ON income_records FOR ALL USING (true);
CREATE POLICY "Allow all operations for fixed_expense_categories" ON fixed_expense_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations for fixed_expense_subitems" ON fixed_expense_subitems FOR ALL USING (true);
CREATE POLICY "Allow all operations for fixed_expense_transactions" ON fixed_expense_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations for variable_expenses" ON variable_expenses FOR ALL USING (true);
CREATE POLICY "Allow all operations for wants_transactions" ON wants_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations for savings_transactions" ON savings_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations for daily_food_transactions" ON daily_food_transactions FOR ALL USING (true);