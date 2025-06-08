import { supabase } from './supabase'

// Default user ID for single-user application
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000'

// Helper function to check if Supabase is available
function isSupabaseAvailable() {
  return supabase !== null && supabase && typeof supabase.from === 'function'
}

// Budget Settings
export async function getBudgetSettings() {
  if (!isSupabaseAvailable()) {
    return {
      needs_percentage: 60,
      wants_percentage: 20,
      savings_percentage: 20,
      income_goal: 30000,
      needs_goal: 18000,
      wants_goal: 6000,
      savings_goal: 6000
    }
  }

  try {
    const { data, error } = await supabase
      .from('budget_settings')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data || {
      needs_percentage: 60,
      wants_percentage: 20,
      savings_percentage: 20,
      income_goal: 30000,
      needs_goal: 18000,
      wants_goal: 6000,
      savings_goal: 6000
    }
  } catch (error) {
    console.error('Error fetching budget settings:', error)
    return {
      needs_percentage: 60,
      wants_percentage: 20,
      savings_percentage: 20,
      income_goal: 30000,
      needs_goal: 18000,
      wants_goal: 6000,
      savings_goal: 6000
    }
  }
}

export async function updateBudgetSettings(settings) {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, skipping budget settings update')
    return null
  }

  try {
    const updateData = {
      user_id: DEFAULT_USER_ID,
      updated_at: new Date().toISOString()
    }

    // Add fields that are provided
    if (settings.needs !== undefined) updateData.needs_percentage = settings.needs
    if (settings.wants !== undefined) updateData.wants_percentage = settings.wants
    if (settings.savings !== undefined) updateData.savings_percentage = settings.savings
    if (settings.income_goal !== undefined) updateData.income_goal = settings.income_goal
    if (settings.needs_goal !== undefined) updateData.needs_goal = settings.needs_goal
    if (settings.wants_goal !== undefined) updateData.wants_goal = settings.wants_goal
    if (settings.savings_goal !== undefined) updateData.savings_goal = settings.savings_goal

    const { data, error } = await supabase
      .from('budget_settings')
      .upsert(updateData)
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating budget settings:', error)
    throw error
  }
}

// Income Records
export async function getIncomeRecords() {
  if (!isSupabaseAvailable()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('income_records')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching income records:', error)
    return []
  }
}

export async function addIncomeRecord(amount, description = '') {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, skipping income record addition')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('income_records')
      .insert({
        user_id: DEFAULT_USER_ID,
        amount,
        description
      })
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error adding income record:', error)
    throw error
  }
}

// Fixed Expense Categories
export async function getFixedExpenseCategories() {
  if (!isSupabaseAvailable()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('fixed_expense_categories')
      .select(`
        *,
        fixed_expense_subitems (*)
      `)
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching fixed expense categories:', error)
    return []
  }
}

export async function addFixedExpenseCategory(name, goalAmount = 0) {
  try {
    const { data, error } = await supabase
      .from('fixed_expense_categories')
      .insert({
        user_id: DEFAULT_USER_ID,
        name,
        goal_amount: goalAmount
      })
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error adding fixed expense category:', error)
    throw error
  }
}

export async function updateFixedExpenseCategory(id, updates) {
  try {
    const { data, error } = await supabase
      .from('fixed_expense_categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error updating fixed expense category:', error)
    throw error
  }
}

export async function deleteFixedExpenseCategory(id) {
  try {
    const { error } = await supabase
      .from('fixed_expense_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting fixed expense category:', error)
    throw error
  }
}

// Fixed Expense Sub-items
export async function addFixedExpenseSubitem(categoryId, name, goalAmount = 0) {
  try {
    const { data, error } = await supabase
      .from('fixed_expense_subitems')
      .insert({
        category_id: categoryId,
        name,
        goal_amount: goalAmount
      })
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error adding fixed expense subitem:', error)
    throw error
  }
}

export async function updateFixedExpenseSubitem(id, updates) {
  try {
    const { data, error } = await supabase
      .from('fixed_expense_subitems')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error updating fixed expense subitem:', error)
    throw error
  }
}

export async function deleteFixedExpenseSubitem(id) {
  try {
    const { error } = await supabase
      .from('fixed_expense_subitems')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting fixed expense subitem:', error)
    throw error
  }
}

// Fixed Expense Transactions
export async function getFixedExpenseTransactions(categoryId = null, subitemId = null) {
  try {
    let query = supabase
      .from('fixed_expense_transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    if (subitemId) {
      query = query.eq('subitem_id', subitemId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching fixed expense transactions:', error)
    return []
  }
}

export async function addFixedExpenseTransaction(categoryId, amount, description = '', subitemId = null) {
  try {
    const { data, error } = await supabase
      .from('fixed_expense_transactions')
      .insert({
        category_id: categoryId,
        subitem_id: subitemId,
        amount,
        description
      })
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error adding fixed expense transaction:', error)
    throw error
  }
}

// Variable Expenses
export async function getVariableExpenses() {
  if (!isSupabaseAvailable()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('variable_expenses')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching variable expenses:', error)
    return []
  }
}

export async function addVariableExpenses(expenses) {
  try {
    const expenseGroupId = crypto.randomUUID()
    const expensesToInsert = expenses.map(expense => ({
      user_id: DEFAULT_USER_ID,
      description: expense.description,
      amount: expense.amount,
      expense_group_id: expenseGroupId
    }))

    const { data, error } = await supabase
      .from('variable_expenses')
      .insert(expensesToInsert)
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding variable expenses:', error)
    throw error
  }
}

// Wants Transactions
export async function getWantsTransactions() {
  if (!isSupabaseAvailable()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('wants_transactions')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching wants transactions:', error)
    return []
  }
}

export async function addWantsTransaction(amount, description = '') {
  try {
    const { data, error } = await supabase
      .from('wants_transactions')
      .insert({
        user_id: DEFAULT_USER_ID,
        amount,
        description
      })
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error adding wants transaction:', error)
    throw error
  }
}

// Savings Transactions
export async function getSavingsTransactions() {
  if (!isSupabaseAvailable()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('savings_transactions')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching savings transactions:', error)
    return []
  }
}

export async function addSavingsTransaction(amount, description = '') {
  try {
    const { data, error } = await supabase
      .from('savings_transactions')
      .insert({
        user_id: DEFAULT_USER_ID,
        amount,
        description
      })
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error adding savings transaction:', error)
    throw error
  }
}

// Daily Food Transactions
export async function getDailyFoodTransactions() {
  if (!isSupabaseAvailable()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('daily_food_transactions')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching daily food transactions:', error)
    return []
  }
}

export async function addDailyFoodTransaction(amount, description = '') {
  try {
    const { data, error } = await supabase
      .from('daily_food_transactions')
      .insert({
        user_id: DEFAULT_USER_ID,
        amount,
        description
      })
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error adding daily food transaction:', error)
    throw error
  }
}

// Helper function to calculate totals from transactions
export function calculateTotalFromTransactions(transactions) {
  return transactions.reduce((total, transaction) => total + parseFloat(transaction.amount), 0)
}

// Helper function to calculate current amounts for fixed expenses
export async function getFixedExpenseCurrentAmounts() {
  try {
    const categories = await getFixedExpenseCategories()
    const result = {}

    for (const category of categories) {
      // Get transactions for main category
      const categoryTransactions = await getFixedExpenseTransactions(category.id)
      const categoryTotal = calculateTotalFromTransactions(
        categoryTransactions.filter(t => !t.subitem_id)
      )

      // Get transactions for sub-items
      const subitemTotals = {}
      for (const subitem of category.fixed_expense_subitems || []) {
        const subitemTransactions = await getFixedExpenseTransactions(category.id, subitem.id)
        subitemTotals[subitem.id] = calculateTotalFromTransactions(subitemTransactions)
      }

      result[category.id] = {
        current: categoryTotal,
        subitems: subitemTotals
      }
    }

    return result
  } catch (error) {
    console.error('Error calculating fixed expense current amounts:', error)
    return {}
  }
}
// Reset functions for monthly data
export async function resetIncomeRecords() {
  try {
    const { error } = await supabase
      .from('income_records')
      .delete()
      .eq('user_id', DEFAULT_USER_ID)

    if (error) throw error
  } catch (error) {
    console.error('Error resetting income records:', error)
    throw error
  }
}

export async function resetWantsTransactions() {
  try {
    const { error } = await supabase
      .from('wants_transactions')
      .delete()
      .eq('user_id', DEFAULT_USER_ID)

    if (error) throw error
  } catch (error) {
    console.error('Error resetting wants transactions:', error)
    throw error
  }
}

export async function resetSavingsTransactions() {
  try {
    const { error } = await supabase
      .from('savings_transactions')
      .delete()
      .eq('user_id', DEFAULT_USER_ID)

    if (error) throw error
  } catch (error) {
    console.error('Error resetting savings transactions:', error)
    throw error
  }
}

export async function resetDailyFoodTransactions() {
  try {
    const { error } = await supabase
      .from('daily_food_transactions')
      .delete()
      .eq('user_id', DEFAULT_USER_ID)

    if (error) throw error
  } catch (error) {
    console.error('Error resetting daily food transactions:', error)
    throw error
  }
}

export async function resetFixedExpenseTransactions() {
  try {
    // Get all categories for this user
    const categories = await getFixedExpenseCategories()
    
    for (const category of categories) {
      const { error } = await supabase
        .from('fixed_expense_transactions')
        .delete()
        .eq('category_id', category.id)

      if (error) throw error
    }
  } catch (error) {
    console.error('Error resetting fixed expense transactions:', error)
    throw error
  }
}

export async function resetVariableExpenses() {
  try {
    const { error } = await supabase
      .from('variable_expenses')
      .delete()
      .eq('user_id', DEFAULT_USER_ID)

    if (error) throw error
  } catch (error) {
    console.error('Error resetting variable expenses:', error)
    throw error
  }
}

// Reset all income-related data (income, wants, savings)
export async function resetIncomeData() {
  try {
    await Promise.all([
      resetIncomeRecords(),
      resetWantsTransactions(),
      resetSavingsTransactions()
    ])
  } catch (error) {
    console.error('Error resetting income data:', error)
    throw error
  }
}

// Reset all fixed expenses data
export async function resetFixedExpensesData() {
  try {
    await Promise.all([
      resetFixedExpenseTransactions(),
      resetDailyFoodTransactions(),
      resetVariableExpenses()
    ])
  } catch (error) {
    console.error('Error resetting fixed expenses data:', error)
    throw error
  }
}