-- Setup script to initialize default data for expense tracker
-- Run this after creating the main schema

-- Insert default user (for single-user setup)
INSERT INTO users (id, email) VALUES
('00000000-0000-0000-0000-000000000000', 'default@example.com');

-- Insert default budget settings
INSERT INTO budget_settings (user_id, needs_percentage, wants_percentage, savings_percentage, income_goal) VALUES
('00000000-0000-0000-0000-000000000000', 60, 20, 20, 30000);

-- Insert default fixed expense categories
INSERT INTO fixed_expense_categories (user_id, name, goal_amount) VALUES
('00000000-0000-0000-0000-000000000000', 'ค่าเช่าบ้าน', 8000),
('00000000-0000-0000-0000-000000000000', 'ค่าไฟฟ้า', 1500),
('00000000-0000-0000-0000-000000000000', 'ค่าน้ำ', 500),
('00000000-0000-0000-0000-000000000000', 'ค่าอาหาร', 6000);