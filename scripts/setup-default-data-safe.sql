-- Safe setup script to initialize default data for expense tracker
-- This script can be run multiple times safely

-- Insert default user (for single-user setup) - only if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000000') THEN
        INSERT INTO users (id, email) VALUES 
        ('00000000-0000-0000-0000-000000000000', 'default@example.com');
    END IF;
END $$;

-- Insert default budget settings - only if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM budget_settings WHERE user_id = '00000000-0000-0000-0000-000000000000') THEN
        INSERT INTO budget_settings (user_id, needs_percentage, wants_percentage, savings_percentage, income_goal) VALUES 
        ('00000000-0000-0000-0000-000000000000', 60, 20, 20, 30000);
    END IF;
END $$;

-- Insert default fixed expense categories - only if not exists
DO $$
BEGIN
    -- ค่าเช่าบ้าน
    IF NOT EXISTS (SELECT 1 FROM fixed_expense_categories WHERE user_id = '00000000-0000-0000-0000-000000000000' AND name = 'ค่าเช่าบ้าน') THEN
        INSERT INTO fixed_expense_categories (user_id, name, goal_amount) VALUES 
        ('00000000-0000-0000-0000-000000000000', 'ค่าเช่าบ้าน', 8000);
    END IF;
    
    -- ค่าไฟฟ้า
    IF NOT EXISTS (SELECT 1 FROM fixed_expense_categories WHERE user_id = '00000000-0000-0000-0000-000000000000' AND name = 'ค่าไฟฟ้า') THEN
        INSERT INTO fixed_expense_categories (user_id, name, goal_amount) VALUES 
        ('00000000-0000-0000-0000-000000000000', 'ค่าไฟฟ้า', 1500);
    END IF;
    
    -- ค่าน้ำ
    IF NOT EXISTS (SELECT 1 FROM fixed_expense_categories WHERE user_id = '00000000-0000-0000-0000-000000000000' AND name = 'ค่าน้ำ') THEN
        INSERT INTO fixed_expense_categories (user_id, name, goal_amount) VALUES 
        ('00000000-0000-0000-0000-000000000000', 'ค่าน้ำ', 500);
    END IF;
    
    -- ค่าอาหาร
    IF NOT EXISTS (SELECT 1 FROM fixed_expense_categories WHERE user_id = '00000000-0000-0000-0000-000000000000' AND name = 'ค่าอาหาร') THEN
        INSERT INTO fixed_expense_categories (user_id, name, goal_amount) VALUES 
        ('00000000-0000-0000-0000-000000000000', 'ค่าอาหาร', 6000);
    END IF;
END $$;