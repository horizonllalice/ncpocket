import Head from "next/head";
import { useState, useEffect } from "react";
import styles from "@/styles/Home.module.css";
import {
  getBudgetSettings,
  updateBudgetSettings,
  getIncomeRecords,
  addIncomeRecord,
  getFixedExpenseCategories,
  addFixedExpenseCategory,
  updateFixedExpenseCategory,
  deleteFixedExpenseCategory,
  addFixedExpenseSubitem,
  updateFixedExpenseSubitem,
  deleteFixedExpenseSubitem,
  getFixedExpenseTransactions,
  addFixedExpenseTransaction,
  getVariableExpenses,
  addVariableExpenses,
  getWantsTransactions,
  addWantsTransaction,
  getSavingsTransactions,
  addSavingsTransaction,
  getDailyFoodTransactions,
  addDailyFoodTransaction,
  calculateTotalFromTransactions,
  getFixedExpenseCurrentAmounts,
  resetIncomeData,
  resetFixedExpensesData
} from '../lib/database';

export default function Home() {
  // Percentage allocation state
  const [percentageAllocation, setPercentageAllocation] = useState({
    needs: 60,
    wants: 20,
    savings: 20
  });

  const [data, setData] = useState({
    income: { current: 0, goal: 30000 },
    needs: { current: 0, goal: 0 }, // Dynamic % of income
    wants: { current: 0, goal: 0 }, // Dynamic % of income
    savings: { current: 0, goal: 0 }, // Dynamic % of income
    dailyFood: { current: 0, goal: 0 } // Daily food budget from remaining needs
  });

  const [fixedExpenses, setFixedExpenses] = useState([]);

  // Variable expenses state
  const [variableExpenses, setVariableExpenses] = useState([]);
  const [showVariableExpenseModal, setShowVariableExpenseModal] = useState(false);
  const [currentVariableExpenses, setCurrentVariableExpenses] = useState([]);
  const [variableExpenseInput, setVariableExpenseInput] = useState({ description: '', amount: '' });

  // Sub-item management state
  const [expandedExpenses, setExpandedExpenses] = useState({});
  const [showSubItemModal, setShowSubItemModal] = useState(null);
  const [subItemInput, setSubItemInput] = useState({ name: '', goal: '' });

  const [showModal, setShowModal] = useState(null);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [wantsExpenseDescription, setWantsExpenseDescription] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [showPercentageModal, setShowPercentageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(null);
  const [showResetModal, setShowResetModal] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [showCongrats, setShowCongrats] = useState(false);
  const [error, setError] = useState(null);

  // Temporary percentage state for modal
  const [tempPercentageAllocation, setTempPercentageAllocation] = useState({
    needs: 60,
    wants: 20,
    savings: 20
  });

  // History state for tracking money additions
  const [history, setHistory] = useState({
    income: [],
    wants: [],
    savings: [],
    dailyFood: [],
    expenses: {} // Will store arrays keyed by expense ID
  });

  // State for expanded dates in history
  const [expandedDates, setExpandedDates] = useState({});

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from Supabase
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Load budget settings
      const budgetSettings = await getBudgetSettings();
      setPercentageAllocation({
        needs: budgetSettings.needs_percentage,
        wants: budgetSettings.wants_percentage,
        savings: budgetSettings.savings_percentage
      });

      
      // Load income records
      const incomeRecords = await getIncomeRecords();
      const totalIncome = calculateTotalFromTransactions(incomeRecords);
      
      // Load wants transactions
      const wantsTransactions = await getWantsTransactions();
      const totalWants = calculateTotalFromTransactions(wantsTransactions);
      
      // Load savings transactions
      const savingsTransactions = await getSavingsTransactions();
      const totalSavings = calculateTotalFromTransactions(savingsTransactions);
      
      // Load daily food transactions
      const dailyFoodTransactions = await getDailyFoodTransactions();
      const totalDailyFood = calculateTotalFromTransactions(dailyFoodTransactions);
      
      // Load fixed expenses
      const expenseCategories = await getFixedExpenseCategories();
      const expenseCurrentAmounts = await getFixedExpenseCurrentAmounts();
      
      // Transform expense categories to match the existing structure
      const transformedExpenses = expenseCategories.map(category => ({
        id: category.id,
        name: category.name,
        current: expenseCurrentAmounts[category.id]?.current || 0,
        goal: category.goal_amount || 0,
        subItems: (category.fixed_expense_subitems || []).map(subitem => ({
          id: subitem.id,
          name: subitem.name,
          current: expenseCurrentAmounts[category.id]?.subitems[subitem.id] || 0,
          goal: subitem.goal_amount || 0
        }))
      }));
      
      // Load variable expenses
      const variableExpensesData = await getVariableExpenses();
      const groupedVariableExpenses = groupVariableExpensesByGroup(variableExpensesData);
      
      // Calculate total fixed expenses
      const totalFixedExpenses = transformedExpenses.reduce((sum, expense) => {
        if (expense.subItems && expense.subItems.length > 0) {
          return sum + expense.subItems.reduce((subSum, subItem) => subSum + subItem.current, 0);
        }
        return sum + expense.current;
      }, 0);
      
      // Update state
      setData({
        income: { current: totalIncome, goal: budgetSettings.income_goal },
        needs: {
          current: totalFixedExpenses,
          goal: budgetSettings.needs_goal || 0
        },
        wants: {
          current: totalWants,
          goal: budgetSettings.wants_goal || 0
        },
        savings: {
          current: totalSavings,
          goal: budgetSettings.savings_goal || 0
        },
        dailyFood: { current: totalDailyFood, goal: 0 }
      });
      
      setFixedExpenses(transformedExpenses);
      setVariableExpenses(groupedVariableExpenses);
      
      // Load history data
      setHistory({
        income: incomeRecords.map(r => ({
          id: r.id,
          amount: parseFloat(r.amount),
          timestamp: new Date(r.created_at).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: 'add'
        })),
        wants: wantsTransactions.map(r => ({
          id: r.id,
          amount: parseFloat(r.amount),
          timestamp: new Date(r.created_at).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: 'add'
        })),
        savings: savingsTransactions.map(r => ({
          id: r.id,
          amount: parseFloat(r.amount),
          timestamp: new Date(r.created_at).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: 'add'
        })),
        dailyFood: dailyFoodTransactions.map(r => ({
          id: r.id,
          amount: parseFloat(r.amount),
          timestamp: new Date(r.created_at).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: 'add'
        })),
        expenses: await loadExpenseHistory(transformedExpenses)
      });
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpenseHistory = async (expenses) => {
    const expenseHistory = {};
    
    for (const expense of expenses) {
      // Load main category transactions
      const categoryTransactions = await getFixedExpenseTransactions(expense.id);
      const mainTransactions = categoryTransactions
        .filter(t => !t.subitem_id)
        .map(t => ({
          id: t.id,
          amount: parseFloat(t.amount),
          timestamp: new Date(t.created_at).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: 'add'
        }));
      
      if (mainTransactions.length > 0) {
        expenseHistory[expense.id] = mainTransactions;
      }
      
      // Load sub-item transactions
      for (const subItem of expense.subItems || []) {
        const subItemTransactions = await getFixedExpenseTransactions(expense.id, subItem.id);
        const subTransactions = subItemTransactions.map(t => ({
          id: t.id,
          amount: parseFloat(t.amount),
          timestamp: new Date(t.created_at).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: 'add'
        }));
        
        if (subTransactions.length > 0) {
          expenseHistory[`${expense.id}-${subItem.id}`] = subTransactions;
        }
      }
    }
    
    return expenseHistory;
  };

  const groupVariableExpensesByGroup = (expenses) => {
    const groups = {};
    
    expenses.forEach(expense => {
      const groupId = expense.expense_group_id || expense.id;
      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          timestamp: new Date(expense.created_at).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          items: [],
          total: 0
        };
      }
      
      groups[groupId].items.push({
        id: expense.id,
        description: expense.description,
        amount: parseFloat(expense.amount)
      });
      groups[groupId].total += parseFloat(expense.amount);
    });
    
    return Object.values(groups);
  };



  // Update needs current amount based on fixed expenses
  useEffect(() => {
    const totalFixedExpenses = calculateAllFixedExpensesTotal('current');
    setData(prev => ({
      ...prev,
      needs: { ...prev.needs, current: totalFixedExpenses }
    }));
  }, [fixedExpenses]);

  const handleSetGoal = (type) => {
    setError(null);
    setShowModal({ type, action: 'goal' });
    setInputValue("");
  };

  const handleAddMoney = (type) => {
    setError(null);
    setShowModal({ type, action: 'add', isExpense: false });
    setInputValue("");
    if (type === 'wants') {
      setWantsExpenseDescription("");
    }
  };

  const handleAddExpense = (expenseType) => {
    setShowModal({ type: expenseType, action: 'add', isExpense: true });
    setInputValue("");
    if (expenseType === 'wants') {
      setWantsExpenseDescription("");
    } else {
      setExpenseDescription("");
    }
  };

  const handleAddNewExpenseItem = async () => {
    if (newExpenseName.trim()) {
      try {
        const newCategory = await addFixedExpenseCategory(newExpenseName.trim(), 0);
        setFixedExpenses(prev => [...prev, {
          id: newCategory.id,
          name: newCategory.name,
          current: 0,
          goal: newCategory.goal_amount,
          subItems: []
        }]);
        setNewExpenseName("");
      } catch (error) {
        console.error('Error adding expense category:', error);
        alert('เกิดข้อผิดพลาดในการเพิ่มรายการ');
      }
    }
  };

  const handleRemoveExpenseItem = async (expenseId) => {
    try {
      await deleteFixedExpenseCategory(expenseId);
      setFixedExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense category:', error);
      alert('เกิดข้อผิดพลาดในการลบรายการ');
    }
  };

  const handleSetExpenseGoal = (expenseId) => {
    setShowModal({ type: 'expense', action: 'goal', expenseId });
    setInputValue("");
  };

  // Sub-item management functions
  const handleToggleExpenseExpansion = (expenseId) => {
    setExpandedExpenses(prev => ({
      ...prev,
      [expenseId]: !prev[expenseId]
    }));
  };

  const handleOpenSubItemModal = (expenseId) => {
    setShowSubItemModal(expenseId);
    setSubItemInput({ name: '', goal: '' });
  };

  const handleAddSubItem = async () => {
    if (subItemInput.name.trim() && subItemInput.goal && parseFloat(subItemInput.goal) > 0) {
      try {
        const newSubItem = await addFixedExpenseSubitem(
          showSubItemModal,
          subItemInput.name.trim(),
          parseFloat(subItemInput.goal)
        );

        setFixedExpenses(prev => prev.map(expense =>
          expense.id === showSubItemModal
            ? { 
                ...expense, 
                subItems: [...expense.subItems, {
                  id: newSubItem.id,
                  name: newSubItem.name,
                  current: 0,
                  goal: newSubItem.goal_amount
                }] 
              }
            : expense
        ));

        setSubItemInput({ name: '', goal: '' });
        setShowSubItemModal(null);
      } catch (error) {
        console.error('Error adding sub-item:', error);
        alert('เกิดข้อผิดพลาดในการเพิ่มรายการย่อย');
      }
    }
  };

  const handleRemoveSubItem = async (expenseId, subItemId) => {
    try {
      await deleteFixedExpenseSubitem(subItemId);
      setFixedExpenses(prev => prev.map(expense =>
        expense.id === expenseId
          ? { ...expense, subItems: expense.subItems.filter(subItem => subItem.id !== subItemId) }
          : expense
      ));
    } catch (error) {
      console.error('Error deleting sub-item:', error);
      alert('เกิดข้อผิดพลาดในการลบรายการย่อย');
    }
  };

  const handleAddSubItemMoney = (expenseId, subItemId) => {
    setShowModal({ type: 'subItem', action: 'add', expenseId, subItemId });
    setInputValue("");
  };

  const handleSetSubItemGoal = (expenseId, subItemId) => {
    setShowModal({ type: 'subItem', action: 'goal', expenseId, subItemId });
    setInputValue("");
  };

  // Variable expense functions
  const handleOpenVariableExpenseModal = () => {
    setShowVariableExpenseModal(true);
    setCurrentVariableExpenses([]);
    setVariableExpenseInput({ description: '', amount: '' });
  };

  const handleAddVariableExpenseItem = () => {
    if (variableExpenseInput.description.trim() && variableExpenseInput.amount && parseFloat(variableExpenseInput.amount) > 0) {
      const newItem = {
        id: Date.now(),
        description: variableExpenseInput.description.trim(),
        amount: parseFloat(variableExpenseInput.amount)
      };
      setCurrentVariableExpenses(prev => [...prev, newItem]);
      setVariableExpenseInput({ description: '', amount: '' });
    }
  };

  const handleRemoveVariableExpenseItem = (itemId) => {
    setCurrentVariableExpenses(prev => prev.filter(item => item.id !== itemId));
  };

  const handleFinishVariableExpenses = async () => {
    if (currentVariableExpenses.length > 0) {
      try {
        await addVariableExpenses(currentVariableExpenses);
        
        const timestamp = new Date().toLocaleString('th-TH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        const newExpenseGroup = {
          id: Date.now(),
          timestamp,
          items: currentVariableExpenses,
          total: currentVariableExpenses.reduce((sum, item) => sum + item.amount, 0)
        };

        setVariableExpenses(prev => [...prev, newExpenseGroup]);
      } catch (error) {
        console.error('Error adding variable expenses:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่ายแปรผัน');
      }
    }
    setShowVariableExpenseModal(false);
    setCurrentVariableExpenses([]);
  };

  const getTotalVariableExpenses = () => {
    return variableExpenses.reduce((total, group) => total + group.total, 0);
  };

  // Helper functions for calculating totals with sub-items
  const calculateExpenseTotal = (expense, type = 'current') => {
    if (expense.subItems && expense.subItems.length > 0) {
      return expense.subItems.reduce((sum, subItem) => sum + subItem[type], 0);
    }
    return expense[type];
  };

  const calculateAllFixedExpensesTotal = (type = 'current') => {
    return fixedExpenses.reduce((sum, expense) => sum + calculateExpenseTotal(expense, type), 0);
  };

  const handleShowHistory = (type, expenseId = null) => {
    setShowHistoryModal({ type, expenseId });
    setExpandedDates({}); // Reset expanded dates when opening history
  };

  const handleShowVariableExpenseHistory = () => {
    setShowHistoryModal({ type: 'variableExpense' });
    setExpandedDates({}); // Reset expanded dates when opening history
  };

  // Helper function to group transactions by date
  const groupTransactionsByDate = (transactions) => {
    const groups = {};
    
    transactions.forEach(transaction => {
      // Extract date part from timestamp (remove time)
      const dateOnly = transaction.timestamp.split(' ')[0]; // Gets "DD/MM/YYYY" part
      
      if (!groups[dateOnly]) {
        groups[dateOnly] = [];
      }
      groups[dateOnly].push(transaction);
    });
    
    // Convert to array and sort by date (newest first)
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => {
        // Convert DD/MM/YYYY to comparable format
        const [dayA, monthA, yearA] = dateA.split('/');
        const [dayB, monthB, yearB] = dateB.split('/');
        const dateObjA = new Date(yearA, monthA - 1, dayA);
        const dateObjB = new Date(yearB, monthB - 1, dayB);
        return dateObjB - dateObjA;
      })
      .map(([date, transactions]) => ({
        date,
        transactions,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        count: transactions.length
      }));
  };

  // Helper function to normalize date format
  const normalizeDateFormat = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  // Special grouping function for wants transactions that combines positive and negative amounts
  const groupWantsTransactionsByDate = (transactions) => {
    const groups = {};
    
    transactions.forEach(transaction => {
      const dateOnly = transaction.timestamp.split(' ')[0];
      const normalizedDate = normalizeDateFormat(dateOnly);
      
      if (!groups[normalizedDate]) {
        groups[normalizedDate] = {
          date: normalizedDate,
          positiveAmount: 0,
          negativeAmount: 0,
          positiveTransactions: [],
          negativeTransactions: [],
          totalAmount: 0,
          count: 0
        };
      }
      
      if (transaction.amount >= 0) {
        groups[normalizedDate].positiveAmount += transaction.amount;
        groups[normalizedDate].positiveTransactions.push(transaction);
      } else {
        groups[normalizedDate].negativeAmount += transaction.amount;
        groups[normalizedDate].negativeTransactions.push(transaction);
      }
      
      groups[normalizedDate].totalAmount += transaction.amount;
      groups[normalizedDate].count += 1;
    });
    
    // Convert to array and sort by date (newest first)
    return Object.values(groups)
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/');
        const [dayB, monthB, yearB] = b.date.split('/');
        const dateObjA = new Date(yearA, monthA - 1, dayA);
        const dateObjB = new Date(yearB, monthB - 1, dayB);
        return dateObjB - dateObjA;
      });
  };

  // Helper function to group variable expenses by date
  const groupVariableExpensesByDate = (expenses) => {
    const groups = {};
    
    expenses.forEach(expense => {
      const dateOnly = expense.timestamp.split(' ')[0];
      
      if (!groups[dateOnly]) {
        groups[dateOnly] = [];
      }
      groups[dateOnly].push(expense);
    });
    
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => {
        const [dayA, monthA, yearA] = dateA.split('/');
        const [dayB, monthB, yearB] = dateB.split('/');
        const dateObjA = new Date(yearA, monthA - 1, dayA);
        const dateObjB = new Date(yearB, monthB - 1, dayB);
        return dateObjB - dateObjA;
      })
      .map(([date, expenses]) => ({
        date,
        expenses,
        totalAmount: expenses.reduce((sum, exp) => sum + exp.total, 0),
        count: expenses.length
      }));
  };

  // Handle date expansion toggle
  const handleToggleDateExpansion = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const addToHistory = (type, amount, expenseId = null, description = '', source = 'manual') => {
    const timestamp = new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const historyEntry = {
      id: Date.now(),
      amount,
      timestamp,
      type: 'add',
      description: description || null,
      source: source // 'manual', 'auto-income', 'expense'
    };

    if (type === 'expense' && expenseId) {
      setHistory(prev => ({
        ...prev,
        expenses: {
          ...prev.expenses,
          [expenseId]: [...(prev.expenses[expenseId] || []), historyEntry]
        }
      }));
    } else {
      setHistory(prev => ({
        ...prev,
        [type]: [...prev[type], historyEntry]
      }));
    }
  };

  // Calculate suggested amount for expense savings
  const calculateSuggestedAmount = (expenseGoal, expenseCurrent = 0) => {
    const currentIncome = data.income.current;
    const incomeGoal = data.income.goal;
    
    if (currentIncome === 0 || incomeGoal === 0 || expenseGoal === 0) return 0;
    
    // Calculate income proportion (current income / income goal)
    const incomeRatio = currentIncome / incomeGoal;
    
    // Calculate total suggested amount: expense goal * income ratio
    const totalSuggestedAmount = expenseGoal * incomeRatio;
    
    // Subtract already added amount to get remaining suggestion
    const remainingSuggestedAmount = totalSuggestedAmount - expenseCurrent;
    
    // Return 0 if already exceeded suggestion, otherwise return remaining amount
    return Math.max(0, Math.round(remainingSuggestedAmount));
  };

  const handleUseSuggestedAmount = () => {
    if (showModal && showModal.type === 'expense' && showModal.expenseId) {
      const expense = fixedExpenses.find(e => e.id === showModal.expenseId);
      if (expense) {
        const suggested = calculateSuggestedAmount(expense.goal, expense.current);
        setInputValue(suggested.toString());
      }
    }
  };

  // Percentage settings functions
  const handleOpenPercentageModal = () => {
    setTempPercentageAllocation({ ...percentageAllocation });
    setShowPercentageModal(true);
  };

  const handleClosePercentageModal = () => {
    setShowPercentageModal(false);
    setTempPercentageAllocation({ ...percentageAllocation });
  };

  const handlePercentageChange = (type, value) => {
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    setTempPercentageAllocation(prev => ({
      ...prev,
      [type]: numValue
    }));
  };

  const handleApplyPreset = (preset) => {
    setTempPercentageAllocation(preset);
  };

  const handleSavePercentages = async () => {
    const total = tempPercentageAllocation.needs + tempPercentageAllocation.wants + tempPercentageAllocation.savings;
    if (total === 100) {
      try {
        // Update budget settings without recalculating goals
        await updateBudgetSettings({
          needs_percentage: tempPercentageAllocation.needs,
          wants_percentage: tempPercentageAllocation.wants,
          savings_percentage: tempPercentageAllocation.savings
        });
        
        setPercentageAllocation({ ...tempPercentageAllocation });
        setShowPercentageModal(false);
      } catch (error) {
        console.error('Failed to save percentages:', error);
      }
    } else {
      alert(`รวมเปอร์เซ็นต์ต้องเท่ากับ 100% (ปัจจุบัน: ${total}%)`);
    }
  };

  // Reset functions
  const handleOpenResetModal = (type) => {
    setShowResetModal(type);
  };

  const handleConfirmReset = async () => {
    try {
      if (showResetModal === 'income') {
        await resetIncomeData();
        
        // Reset local state for income-related data
        setData(prev => ({
          ...prev,
          income: { ...prev.income, current: 0 },
          wants: { ...prev.wants, current: 0 },
          savings: { ...prev.savings, current: 0 }
        }));
        
        // Reset history
        setHistory(prev => ({
          ...prev,
          income: [],
          wants: [],
          savings: []
        }));
        
      } else if (showResetModal === 'fixedExpenses') {
        await resetFixedExpensesData();
        
        // Reset local state for fixed expenses
        setFixedExpenses(prev => prev.map(expense => ({
          ...expense,
          current: 0,
          subItems: expense.subItems.map(subItem => ({
            ...subItem,
            current: 0
          }))
        })));
        
        setData(prev => ({
          ...prev,
          needs: { ...prev.needs, current: 0 },
          dailyFood: { ...prev.dailyFood, current: 0 }
        }));
        
        // Reset variable expenses
        setVariableExpenses([]);
        
        // Reset history
        setHistory(prev => ({
          ...prev,
          dailyFood: [],
          expenses: {}
        }));
      }
      
      setShowResetModal(null);
      alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล');
    }
  };

  const presetOptions = [
    { name: '60/20/20 (แนะนำ)', needs: 60, wants: 20, savings: 20 },
    { name: '80/10/10 (ประหยัด)', needs: 80, wants: 10, savings: 10 },
    { name: '50/20/30 (เก็บเงิน)', needs: 50, wants: 20, savings: 30 },
    { name: '70/15/15 (สมดุล)', needs: 70, wants: 15, savings: 15 }
  ];

  const handleSubmit = async () => {
    if (!showModal) return;

    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount <= 0) return;
    
    // Reset expense description after submission
    const description = expenseDescription.trim();
    const wantsDescription = wantsExpenseDescription.trim();
    setExpenseDescription("");
    setWantsExpenseDescription("");

    const { type, action, expenseId, subItemId } = showModal;

    try {
      if (type === 'subItem') {
        if (action === 'goal') {
          await updateFixedExpenseSubitem(subItemId, { goal_amount: amount });
          setFixedExpenses(prev => prev.map(expense =>
            expense.id === expenseId
              ? {
                  ...expense,
                  subItems: expense.subItems.map(subItem =>
                    subItem.id === subItemId
                      ? { ...subItem, goal: amount }
                      : subItem
                  )
                }
              : expense
          ));
        } else if (action === 'add') {
          await addFixedExpenseTransaction(expenseId, amount, '', subItemId);
          setFixedExpenses(prev => prev.map(expense =>
            expense.id === expenseId
              ? {
                  ...expense,
                  subItems: expense.subItems.map(subItem =>
                    subItem.id === subItemId
                      ? { ...subItem, current: subItem.current + amount }
                      : subItem
                  )
                }
              : expense
          ));

          // Add to history for sub-item
          addToHistory('expense', amount, `${expenseId}-${subItemId}`);

          // Check if sub-item goal is reached
          const expense = fixedExpenses.find(e => e.id === expenseId);
          const subItem = expense?.subItems.find(s => s.id === subItemId);
          if (subItem && subItem.current + amount >= subItem.goal && subItem.goal > 0) {
            setShowCongrats(true);
            setTimeout(() => setShowCongrats(false), 3000);
          }
        }
      } else if (type === 'expense') {
        if (action === 'goal') {
          await updateFixedExpenseCategory(expenseId, { goal_amount: amount });
          setFixedExpenses(prev => prev.map(expense =>
            expense.id === expenseId
              ? { ...expense, goal: amount }
              : expense
          ));
        } else if (action === 'add') {
          await addFixedExpenseTransaction(expenseId, amount, description);
          setFixedExpenses(prev => prev.map(expense =>
            expense.id === expenseId
              ? { ...expense, current: expense.current + amount }
              : expense
          ));

          // Add to history
          addToHistory('expense', amount, expenseId);

          // Check if expense goal is reached
          const expense = fixedExpenses.find(e => e.id === expenseId);
          if (expense && expense.current + amount >= expense.goal && expense.goal > 0) {
            setShowCongrats(true);
            setTimeout(() => setShowCongrats(false), 3000);
          }
        }
      } else {
        if (action === 'goal') {
          if (type === 'income') {
            await updateBudgetSettings({
              needs: percentageAllocation.needs,
              wants: percentageAllocation.wants,
              savings: percentageAllocation.savings,
              income_goal: amount
            });
          } else if (type === 'needs') {
            await updateBudgetSettings({
              needs_goal: amount
            });
          } else if (type === 'wants') {
            await updateBudgetSettings({
              wants_goal: amount
            });
          } else if (type === 'savings') {
            await updateBudgetSettings({
              savings_goal: amount
            });
          }
          
          // Reload data from the database to reflect the changes
          await loadInitialData();
        } else if (action === 'add') {
          if (type === 'income') {
            await addIncomeRecord(amount);
            const wantsAmount = amount * (percentageAllocation.wants / 100);
            const savingsAmount = amount * (percentageAllocation.savings / 100);
            await addWantsTransaction(wantsAmount);
            await addSavingsTransaction(savingsAmount);
            setData(prev => ({
              ...prev,
              income: { ...prev.income, current: prev.income.current + amount },
              wants: { ...prev.wants, current: prev.wants.current + wantsAmount },
              savings: { ...prev.savings, current: prev.savings.current + savingsAmount }
            }));
            addToHistory('income', amount);
            addToHistory('wants', wantsAmount);
            addToHistory('savings', savingsAmount);

            const newCurrent = data.income.current + amount;
            if (newCurrent >= data.income.goal && data.income.goal > 0) {
              setShowCongrats(true);
              setTimeout(() => setShowCongrats(false), 3000);
            }
          } else if (type === 'wants') {
            const isExpense = showModal?.isExpense === true;
            const transactionAmount = isExpense ? -amount : amount;
            await addWantsTransaction(transactionAmount, wantsDescription);
            setData(prev => ({
              ...prev,
              [type]: {
                ...prev[type],
                current: prev[type].current + transactionAmount
              }
            }));
            addToHistory(type, transactionAmount, undefined, wantsDescription);

            const newCurrent = data.wants.current + transactionAmount;
            if (newCurrent >= data.wants.goal && data.wants.goal > 0) {
              setShowCongrats(true);
              setTimeout(() => setShowCongrats(false), 3000);
            }
          } else if (type === 'savings') {
            await addSavingsTransaction(amount);
            setData(prev => ({
              ...prev,
              [type]: { ...prev[type], current: prev[type].current + amount }
            }));
            addToHistory(type, amount);

            const newCurrent = data.savings.current + amount;
            if (newCurrent >= data.savings.goal && data.savings.goal > 0) {
              setShowCongrats(true);
              setTimeout(() => setShowCongrats(false), 3000);
            }
          } else if (type === 'dailyFood') {
            await addDailyFoodTransaction(amount);
            setData(prev => ({
              ...prev,
              [type]: { ...prev[type], current: prev[type].current + amount }
            }));
            addToHistory(type, amount);

            const newCurrent = data.dailyFood.current + amount;
            if (newCurrent >= data.dailyFood.goal && data.dailyFood.goal > 0) {
              setShowCongrats(true);
              setTimeout(() => setShowCongrats(false), 3000);
            }
          }
        }
      }
    } catch (err) {
      console.error('Detailed error in handleSubmit:', err);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setShowModal(null);
      setInputValue("");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = (current, goal) => {
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  // Calculate daily food budget details
  const getDailyFoodDetails = () => {
    const currentIncome = data.income.current;
    const incomeGoal = data.income.goal;
    
    if (currentIncome === 0 || incomeGoal === 0) {
      return { daysAvailable: 0, dailyBudget: 0, weeklyBudget: 0, currentBudget: 0 };
    }
    
    // Calculate income ratio and days available
    const incomeRatio = currentIncome / incomeGoal;
    const daysAvailable = Math.round(incomeRatio * 30);
    
    // Calculate current fixed expenses total
    const totalCurrentFixedExpenses = calculateAllFixedExpensesTotal('current');
    
    // Calculate total variable expenses
    const totalVariableExpenses = getTotalVariableExpenses();
    
    // Calculate available food budget: needs% of current income - current fixed expenses - variable expenses
    const totalFoodBudget = Math.max(0, (currentIncome * (percentageAllocation.needs / 100

)) - totalCurrentFixedExpenses);
    const availableFoodBudget = Math.max(0, totalFoodBudget - totalVariableExpenses);
    
    // Calculate daily budget: available food budget / available days
    const dailyBudget = daysAvailable > 0 ? availableFoodBudget / daysAvailable : 0;
    
    // Calculate weekly budget
    const weeklyBudget = dailyBudget * 7;
    
    return {
      daysAvailable,
      dailyBudget: Math.round(dailyBudget),
      weeklyBudget: Math.round(weeklyBudget),
      currentBudget: Math.round(availableFoodBudget),
      totalFoodBudget: Math.round(totalFoodBudget)
    };
  };

  // Calculate total daily food budget available (60% of current income - fixed expenses - variable expenses)
  const getTotalDailyFoodBudget = () => {
    return getDailyFoodDetails().currentBudget;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  const cards = [
    {
      type: 'income',
      title: 'รายรับ',
      subtitle: 'รายได้ในแต่ละเดือน',
      backgroundColor: '#F0F8F0',
      accentColor: '#4CAF50',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      data: data.income
    },
    {
      type: 'dailyFood',
      title: 'ค่าอาหารรายวัน',
      subtitle: `${getDailyFoodDetails().daysAvailable} วัน | ${formatCurrency(getDailyFoodDetails().weeklyBudget)}/สัปดาห์`,
      backgroundColor: '#FFF0F5',
      accentColor: '#E91E63',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      ),
      data: { current: getDailyFoodDetails().dailyBudget, goal: getDailyFoodDetails().dailyBudget }
    },
    {
      type: 'wants',
      title: 'ความต้องการ',
      subtitle: `${percentageAllocation.wants}% สำหรับสิ่งที่อยากได้`,
      backgroundColor: '#FFF8F0',
      accentColor: '#FF9800',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="8" width="18" height="4" rx="1"/>
          <path d="M12 8v13"/>
          <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
          <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.9 4.9 0 0 1 12 8a4.9 4.9 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
        </svg>
      ),
      data: data.wants
    },
    {
      type: 'savings',
      title: 'การออมและลงทุน',
      subtitle: `${percentageAllocation.savings}% สำหรับอนาคต`,
      backgroundColor: '#F0F8FF',
      accentColor: '#2196F3',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 9h6v6H9z"/>
          <path d="M9 1v4"/>
          <path d="M15 1v4"/>
          <path d="M9 19v4"/>
          <path d="M15 19v4"/>
          <path d="M1 9h4"/>
          <path d="M1 15h4"/>
          <path d="M19 9h4"/>
          <path d="M19 15h4"/>
        </svg>
      ),
      data: data.savings
    }
  ];

  return (
    <>
      <Head>
        <title>แอปรายรับ-รายจ่าย</title>
        <meta name="description" content="แอปจัดการเงินแบบ 60/20/20" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        {/* Settings Button - Top Right */}
        <button
          className={styles.settingsButton}
          onClick={handleOpenPercentageModal}
          title="ตั้งค่าเปอร์เซ็นต์การแบ่งเงิน"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2v10l8.66 5"/>
            <path d="M12 12L4 7"/>
          </svg>
        </button>

        <header className={styles.header}>
          <h1>แอปรายรับ-รายจ่าย</h1>
          <p>จัดการเงินแบบ {percentageAllocation.needs}/{percentageAllocation.wants}/{percentageAllocation.savings}</p>
        </header>

        <main className={styles.main}>
          <div className={styles.cardsGrid}>
            {cards.map((card) => (
              <div
                key={card.type}
                className={styles.card}
              >
                {/* Show action buttons for all cards */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardActions}>
                    {/* Show goal button for all cards except dailyFood */}
                    {card.type !== 'dailyFood' && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleSetGoal(card.type)}
                        title="ตั้งเป้าหมาย"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10"/>
                          <circle cx="12" cy="12" r="6"/>
                          <circle cx="12" cy="12" r="2"/>
                        </svg>
                      </button>
                    )}
                    <button
                      className={card.type === 'dailyFood' ? styles.variableHistoryBtn : styles.actionBtn}
                      onClick={card.type === 'dailyFood' ? handleShowVariableExpenseHistory : () => handleShowHistory(card.type)}
                      title={card.type === 'dailyFood' ? "ประวัติค่าใช้จ่ายแปรผัน" : "ประวัติการเพิ่มเงิน"}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                    </button>
                    {card.type === 'dailyFood' ? (
                      <button
                        className={styles.variableExpenseBtn}
                        onClick={handleOpenVariableExpenseModal}
                        title="ค่าใช้จ่ายแปรผัน"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                        <span>ค่าใช้จ่ายแปรผัน</span>
                      </button>
                    ) : card.type === 'wants' ? (
                      <>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleAddExpense(card.type)}
                          title="เพิ่มรายจ่าย"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleAddMoney(card.type)}
                          title="เพิ่มเงิน"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleAddMoney(card.type)}
                        title="เพิ่มเงิน"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.titleRow}>
                    <div className={styles.titleIcon} style={{ color: card.accentColor }}>
                      {card.icon}
                    </div>
                    <h3>{card.title}</h3>
                  </div>
                  
                  {/* Show subtitle for dailyFood card */}
                  {card.type === 'dailyFood' && (
                    <div className={styles.subtitle}>
                      {card.subtitle}
                    </div>
                  )}
                  
                  <div className={styles.amounts}>
                    <div
                      className={styles.currentAmount}
                      style={{ color: card.accentColor }}
                    >
                      {formatCurrency(card.data.current)}
                    </div>
                    {/* Show total daily food budget for dailyFood card */}
                    {card.type === 'dailyFood' && (
                      <div className={styles.goalAmount}>
                        / {formatCurrency(getTotalDailyFoodBudget())}
                      </div>
                    )}
                    {/* Hide goal amount for dailyFood card but show for others */}
                    {card.type !== 'dailyFood' && (
                      <div className={styles.goalAmount}>
                        / {formatCurrency(card.data.goal)}
                      </div>
                    )}
                  </div>

                  {/* Hide progress bar and percentage for dailyFood card */}
                  {card.type !== 'dailyFood' && (
                    <>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${getProgressPercentage(card.data.current, card.data.goal)}%`,
                            backgroundColor: card.accentColor
                          }}
                        ></div>
                      </div>
                      
                      <div className={styles.progressText}>
                        {getProgressPercentage(card.data.current, card.data.goal).toFixed(1)}%
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Fixed Expenses Card */}
            <div className={`${styles.card} ${styles.fixedExpensesCard}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => setShowSettingsModal(true)}
                    title="ตั้งเป้าหมายหลัก"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.titleRow}>
                  <div className={styles.titleIcon} style={{ color: '#9C27B0' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
                      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
                      <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>
                    </svg>
                  </div>
                  <h3>ค่าใช้จ่ายคงที่</h3>
                </div>

                {/* Total Fixed Expenses Summary */}
                <div className={styles.totalExpensesSection}>
                  <div className={styles.totalLabel}>ยอดรวมค่าใช้จ่ายคงที่:</div>
                  <div className={styles.totalAmounts}>
                    <span className={styles.totalCurrent}>
                      {formatCurrency(calculateAllFixedExpensesTotal('current'))}
                    </span>
                    <span className={styles.totalGoal}>
                      / {formatCurrency(calculateAllFixedExpensesTotal('goal'))}
                    </span>
                  </div>
                </div>

                {/* Fixed Expenses List */}
                <div className={styles.expensesList}>
                  {fixedExpenses.map((expense) => {
                    const hasSubItems = expense.subItems && expense.subItems.length > 0;
                    const isCompleted = calculateExpenseTotal(expense, 'current') >= calculateExpenseTotal(expense, 'goal') && calculateExpenseTotal(expense, 'goal') > 0;
                    const isExpanded = expandedExpenses[expense.id];
                    
                    return (
                    <div key={expense.id} className={`${styles.expenseItem} ${isCompleted ? styles.expenseItemCompleted : ''}`}>
                      <div className={styles.expenseInfo}>
                        <div className={styles.expenseHeader}>
                          <div className={styles.expenseNameSection}>
                            {hasSubItems && (
                              <button
                                className={styles.expandBtn}
                                onClick={() => handleToggleExpenseExpansion(expense.id)}
                                title={isExpanded ? "ย่อ" : "ขยาย"}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points={isExpanded ? "6,9 12,15 18,9" : "9,18 15,12 9,6"}/>
                                </svg>
                              </button>
                            )}
                            <span className={styles.expenseName}>{expense.name}</span>
                          </div>
                          <div className={styles.expenseActions}>
                            {!hasSubItems && (
                              <>
                                <button
                                  className={styles.expenseBtn}
                                  onClick={() => handleShowHistory('expense', expense.id)}
                                  title="ประวัติการเพิ่มเงิน"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12,6 12,12 16,14"/>
                                  </svg>
                                </button>
                                <button
                                  className={styles.expenseBtn}
                                  onClick={() => setShowModal({ type: 'expense', action: 'add', expenseId: expense.id, isExpense: false })}
                                  title="เพิ่มเงิน"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className={styles.expenseAmounts}>
                          <span className={styles.expenseCurrent}>
                            {formatCurrency(calculateExpenseTotal(expense, 'current'))}
                          </span>
                          <span className={styles.expenseGoal}> / {formatCurrency(calculateExpenseTotal(expense, 'goal'))}</span>
                        </div>

                        {/* Sub-items */}
                        {hasSubItems && isExpanded && (
                          <div className={styles.subItemsList}>
                            {expense.subItems.map((subItem) => {
                              const subItemCompleted = subItem.current >= subItem.goal && subItem.goal > 0;
                              return (
                                <div key={subItem.id} className={`${styles.subItem} ${subItemCompleted ? styles.subItemCompleted : ''}`}>
                                  <div className={styles.subItemHeader}>
                                    <span className={styles.subItemName}>{subItem.name}</span>
                                    <div className={styles.subItemActions}>
                                      <button
                                        className={styles.expenseBtn}
                                        onClick={() => handleShowHistory('expense', `${expense.id}-${subItem.id}`)}
                                        title="ประวัติการเพิ่มเงิน"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                          <circle cx="12" cy="12" r="10"/>
                                          <polyline points="12,6 12,12 16,14"/>
                                        </svg>
                                      </button>
                                      <button
                                        className={styles.expenseBtn}
                                        onClick={() => handleAddSubItemMoney(expense.id, subItem.id)}
                                        title="เพิ่มเงิน"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                          <line x1="12" y1="5" x2="12" y2="19"/>
                                          <line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                  <div className={styles.subItemAmounts}>
                                    <span className={styles.subItemCurrent}>
                                      {formatCurrency(subItem.current)}
                                    </span>
                                    <span className={styles.subItemGoal}>
                                      / {formatCurrency(subItem.goal)}
                                    </span>
                                  </div>
                                  <div className={styles.subItemProgressBar}>
                                    <div
                                      className={styles.subItemProgressFill}
                                      style={{
                                        width: `${Math.min((subItem.current / subItem.goal) * 100, 100)}%`,
                                        backgroundColor: '#9C27B0'
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className={styles.expenseProgressBar}>
                          <div
                            className={styles.expenseProgressFill}
                            style={{
                              width: `${getProgressPercentage(calculateExpenseTotal(expense, 'current'), calculateExpenseTotal(expense, 'goal'))}%`,
                              backgroundColor: '#9C27B0'
                            }}
                          ></div>
                        </div>
                        
                        <div className={styles.expenseProgressText}>
                          {getProgressPercentage(calculateExpenseTotal(expense, 'current'), calculateExpenseTotal(expense, 'goal')).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Modal */}
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>
                {showModal.action === 'goal' 
                  ? 'ตั้งเป้าหมาย' 
                  : (showModal.isExpense ? 'ค่าใช้จ่าย' : 'เพิ่มเงิน')}
                {showModal.type === 'expense' && showModal.expenseId && (
                  <span className={styles.modalSubtitle}>
                    {fixedExpenses.find(e => e.id === showModal.expenseId)?.name}
                  </span>
                )}
              </h3>
              
              {/* Show suggestion for expense add money */}
              {showModal.action === 'add' && showModal.type === 'expense' && showModal.expenseId && (
                <div className={styles.suggestionRow}>
                  <span className={styles.suggestionText}>
                    แนะนำ ({formatCurrency(calculateSuggestedAmount(
                      fixedExpenses.find(e => e.id === showModal.expenseId)?.goal || 0,
                      fixedExpenses.find(e => e.id === showModal.expenseId)?.current || 0
                    ))})
                  </span>
                  <button
                    onClick={handleUseSuggestedAmount}
                    className={styles.suggestionBtn}
                  >
                    ใช้จำนวนนี้
                  </button>
                </div>
              )}
              
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ใส่จำนวนเงิน"
                className={styles.input}
                autoFocus
              />
              {showModal.action === 'add' && showModal.type === 'wants' && showModal.isExpense && (
                <input
                  type="text"
                  value={wantsExpenseDescription}
                  onChange={(e) => setWantsExpenseDescription(e.target.value)}
                  placeholder="รายละเอียดค่าใช้จ่าย (ไม่บังคับ)"
                  className={styles.input}
                />
              )}
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowModal(null)}
                  className={styles.cancelBtn}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  className={styles.confirmBtn}
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.settingsModal}>
              <h3>ตั้งค่าหลัก - ค่าใช้จ่ายคงที่</h3>
              
              <div className={styles.addExpenseSection}>
                <h4>เพิ่มรายการใหม่</h4>
                <div className={styles.addExpenseForm}>
                  <input
                    type="text"
                    value={newExpenseName}
                    onChange={(e) => setNewExpenseName(e.target.value)}
                    placeholder="ชื่อรายการ เช่น ค่าเช่าบ้าน"
                    className={styles.input}
                  />
                  <button
                    onClick={handleAddNewExpenseItem}
                    className={styles.addBtn}
                    disabled={!newExpenseName.trim()}
                  >
                    เพิ่ม
                  </button>
                </div>
              </div>

              <div className={styles.expenseManageList}>
                <h4>จัดการรายการ</h4>
                {fixedExpenses.map((expense) => (
                  <div key={expense.id} className={styles.manageExpenseItem}>
                    <div className={styles.expenseDetails}>
                      <span className={styles.expenseName}>{expense.name}</span>
                      <div className={styles.expenseAmounts}>
                        เป้าหมายปัจจุบัน: {formatCurrency(calculateExpenseTotal(expense, 'goal'))}
                      </div>
                    </div>
                    <div className={styles.manageActions}>
                      <button
                        className={styles.manageBtn}
                        onClick={() => handleOpenSubItemModal(expense.id)}
                        title="เพิ่มรายการย่อย"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                      {(!expense.subItems || expense.subItems.length === 0) && (
                        <input
                          type="number"
                          value={expense.goal || ''}
                          onChange={async (e) => {
                            const newGoal = parseFloat(e.target.value) || 0;
                            try {
                              await updateFixedExpenseCategory(expense.id, { goal_amount: newGoal });
                              setFixedExpenses(prev => prev.map(exp =>
                                exp.id === expense.id
                                  ? { ...exp, goal: newGoal }
                                  : exp
                              ));
                            } catch (error) {
                              console.error('Error updating expense goal:', error);
                            }
                          }}
                          placeholder="ใส่จำนวนเป้าหมาย"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #e1e8ed',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            width: '120px'
                          }}
                        />
                      )}
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleRemoveExpenseItem(expense.id)}
                        title="ลบรายการ"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                        </svg>
                      </button>
                    </div>

                    {/* Sub-items management */}
                    {expense.subItems && expense.subItems.length > 0 && (
                      <div className={styles.subItemsManagement}>
                        <h5>รายการย่อย:</h5>
                        {expense.subItems.map((subItem) => (
                          <div key={subItem.id} className={styles.manageSubItem}>
                            <div className={styles.subItemDetails}>
                              <span className={styles.subItemName}>{subItem.name}</span>
                              <div className={styles.subItemAmounts}>
                                เป้าหมาย: {formatCurrency(subItem.goal)}
                              </div>
                            </div>
                            <div className={styles.subItemManageActions}>
                              <input
                                type="number"
                                value={subItem.goal || ''}
                                onChange={async (e) => {
                                  const newGoal = parseFloat(e.target.value) || 0;
                                  try {
                                    await updateFixedExpenseSubitem(subItem.id, { goal_amount: newGoal });
                                    setFixedExpenses(prev => prev.map(exp =>
                                      exp.id === expense.id
                                        ? {
                                            ...exp,
                                            subItems: exp.subItems.map(sub =>
                                              sub.id === subItem.id
                                                ? { ...sub, goal: newGoal }
                                                : sub
                                            )
                                          }
                                        : exp
                                    ));
                                  } catch (error) {
                                    console.error('Error updating sub-item goal:', error);
                                  }
                                }}
                                placeholder="เป้าหมาย"
                                style={{
                                  padding: '6px 10px',
                                  border: '1px solid #e1e8ed',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  width: '100px'
                                }}
                              />
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleRemoveSubItem(expense.id, subItem.id)}
                                title="ลบรายการย่อย"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <polyline points="3,6 5,6 21,6"/>
                                  <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={styles.confirmBtn}
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Congratulations Modal */}
        {showCongrats && (
          <div className={styles.modalOverlay}>
            <div className={styles.congratsModal}>
              <div className={styles.congratsIcon}>🎉</div>
              <h2>ยินดีด้วย!</h2>
              <p>คุณบรรลุเป้าหมายแล้ว!</p>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.historyModal}>
              <div className={styles.historyHeader}>
                <h3>
                  ประวัติการเพิ่มเงิน
                  {showHistoryModal.type === 'expense' && showHistoryModal.expenseId && (
                    <span className={styles.modalSubtitle}>
                      {fixedExpenses.find(e => e.id === showHistoryModal.expenseId)?.name}
                    </span>
                  )}
                  {showHistoryModal.type === 'income' && <span className={styles.modalSubtitle}>รายรับ</span>}
                  {showHistoryModal.type === 'wants' && <span className={styles.modalSubtitle}>ความต้องการ</span>}
                  {showHistoryModal.type === 'savings' && <span className={styles.modalSubtitle}>การออมและลงทุน</span>}
                  {showHistoryModal.type === 'dailyFood' && <span className={styles.modalSubtitle}>ค่าอาหารรายวัน</span>}
                  {showHistoryModal.type === 'variableExpense' && <span className={styles.modalSubtitle}>ค่าใช้จ่ายแปรผัน</span>}
                </h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowHistoryModal(null)}
                  title="ปิด"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              
              <div className={styles.historyContent}>
                {(() => {
                  let historyData = [];
                  let groupedData = [];
                  
                  if (showHistoryModal.type === 'expense' && showHistoryModal.expenseId) {
                    historyData = history.expenses[showHistoryModal.expenseId] || [];
                    groupedData = groupTransactionsByDate(historyData);
                  } else if (showHistoryModal.type === 'variableExpense') {
                    historyData = variableExpenses || [];
                    groupedData = groupVariableExpensesByDate(historyData);
                  } else {
                    historyData = history[showHistoryModal.type] || [];
                    if (showHistoryModal.type === 'wants') {
                      groupedData = groupWantsTransactionsByDate(historyData);
                    } else {
                      groupedData = groupTransactionsByDate(historyData);
                    }
                  }

                  if (historyData.length === 0) {
                    return (
                      <div className={styles.noHistory}>
                        <p>{showHistoryModal.type === 'variableExpense' ? 'ยังไม่มีประวัติค่าใช้จ่ายแปรผัน' : 'ยังไม่มีประวัติการเพิ่มเงิน'}</p>
                      </div>
                    );
                  }

                  return (
                    <div className={styles.historyList}>
                      {groupedData.map((dateGroup) => (
                        <div key={dateGroup.date} className={styles.historyDateGroup}>
                          {/* Date Header - Clickable */}
                          <div
                            className={styles.historyDateHeader}
                            onClick={() => handleToggleDateExpansion(dateGroup.date)}
                          >
                            <div className={styles.historyDateInfo}>
                              <div className={styles.historyDate}>{dateGroup.date}</div>
                              <div className={styles.historyDateSummary}>
                                {dateGroup.count} รายการ • {formatCurrency(dateGroup.totalAmount)}
                              </div>
                            </div>
                            <div className={styles.expandIcon}>
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                style={{
                                  transform: expandedDates[dateGroup.date] ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease'
                                }}
                              >
                                <polyline points="6,9 12,15 18,9"/>
                              </svg>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {expandedDates[dateGroup.date] && (
                            <div className={styles.historyDateContent}>
                              {showHistoryModal.type === 'variableExpense' ? (
                                dateGroup.expenses.map((entry) => (
                                  <div key={entry.id} className={styles.historyItem}>
                                    <div className={styles.historyAmount}>
                                      {formatCurrency(entry.total)}
                                    </div>
                                    <div className={styles.historyDetails}>
                                      {entry.items.map((item, index) => (
                                        <div key={index} className={styles.historyItemDetail}>
                                          {item.description}: {formatCurrency(item.amount)}
                                        </div>
                                      ))}
                                    </div>
                                    <div className={styles.historyTimestamp}>
                                      {entry.timestamp.split(' ')[1]} {/* Show only time */}
                                    </div>
                                  </div>
                                ))
                              ) : showHistoryModal.type === 'wants' ? (
                                <>
                                  {/* Summary */}
                                  <div className={styles.historyItem + ' ' + styles.wantsSummaryItem}>
                                    <div className={styles.historyAmount}>
                                      <div className={styles.wantsSummary}>
                                        {dateGroup.positiveAmount > 0 && (
                                          <span className={styles.positiveAmount}>
                                            +{formatCurrency(dateGroup.positiveAmount)}
                                          </span>
                                        )}
                                        {dateGroup.negativeAmount < 0 && (
                                          <span className={styles.negativeAmount}>
                                            {formatCurrency(dateGroup.negativeAmount)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className={styles.historyDetails}>
                                      <div className={styles.historyItemDetail}>
                                        สรุปประจำวัน
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Individual Transactions */}
                                  {[...dateGroup.positiveTransactions, ...dateGroup.negativeTransactions]
                                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                    .map((entry) => (
                                      <div key={entry.id} className={styles.historyItem}>
                                        <div className={styles.historyAmount}>
                                          {entry.amount < 0 ? '' : '+'}{formatCurrency(entry.amount)}
                                        </div>
                                        <div className={styles.historyDetails}>
                                          {entry.description && (
                                            <div className={styles.historyItemDetail}>
                                              {entry.description}
                                            </div>
                                          )}
                                        </div>
                                        <div className={styles.historyTimestamp}>
                                          {entry.timestamp.split(' ')[1]} {/* Show only time */}
                                        </div>
                                      </div>
                                    ))}
                                </>
                              ) : (
                                dateGroup.transactions.map((entry) => (
                                  <div key={entry.id} className={styles.historyItem}>
                                    <div className={styles.historyAmount}>
                                      {entry.amount < 0 ? '' : '+'}{formatCurrency(entry.amount)}
                                    </div>
                                    <div className={styles.historyDetails}>
                                      {entry.description && (
                                        <div className={styles.historyItemDetail}>
                                          {entry.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className={styles.historyTimestamp}>
                                      {entry.timestamp.split(' ')[1]} {/* Show only time */}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowHistoryModal(null)}
                  className={styles.confirmBtn}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Variable Expense Modal */}
        {showVariableExpenseModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.variableExpenseModal}>
              <div className={styles.historyHeader}>
                <h3>ค่าใช้จ่ายแปรผัน</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowVariableExpenseModal(false)}
                  title="ปิด"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className={styles.variableExpenseContent}>
                <div className={styles.addExpenseForm}>
                  <input
                    type="text"
                    placeholder="รายละเอียดค่าใช้จ่าย"
                    value={variableExpenseInput.description}
                    onChange={(e) => setVariableExpenseInput(prev => ({ ...prev, description: e.target.value }))}
                    className={styles.input}
                  />
                  <input
                    type="number"
                    placeholder="จำนวนเงิน"
                    value={variableExpenseInput.amount}
                    onChange={(e) => setVariableExpenseInput(prev => ({ ...prev, amount: e.target.value }))}
                    className={styles.input}
                  />
                  <button
                    onClick={handleAddVariableExpenseItem}
                    className={styles.addBtn}
                    disabled={!variableExpenseInput.description.trim() || !variableExpenseInput.amount || parseFloat(variableExpenseInput.amount) <= 0}
                  >
                    เพิ่ม
                  </button>
                </div>

                {currentVariableExpenses.length > 0 && (
                  <div className={styles.currentExpensesList}>
                    <h4>รายการค่าใช้จ่ายปัจจุบัน:</h4>
                    {currentVariableExpenses.map((item) => (
                      <div key={item.id} className={styles.variableExpenseItem}>
                        <div className={styles.variableExpenseHeader}>
                          <div className={styles.variableExpenseName}>{item.description}</div>
                          <button
                            onClick={() => handleRemoveVariableExpenseItem(item.id)}
                            className={styles.deleteBtn}
                            title="ลบ"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            </svg>
                          </button>
                        </div>
                        <div className={styles.variableExpenseAmount}>{formatCurrency(item.amount)}</div>
                      </div>
                    ))}
                    <div className={styles.totalExpense}>
                      <strong>รวม: {formatCurrency(currentVariableExpenses.reduce((sum, item) => sum + item.amount, 0))}</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowVariableExpenseModal(false)}
                  className={styles.cancelBtn}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleFinishVariableExpenses}
                  className={styles.confirmBtn}
                  disabled={currentVariableExpenses.length === 0}
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Percentage Settings Modal */}
        {showPercentageModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.percentageModal}>
              <div className={styles.historyHeader}>
                <h3>ตั้งค่าเปอร์เซ็นต์การแบ่งเงิน</h3>
                <button
                  className={styles.closeBtn}
                  onClick={handleClosePercentageModal}
                  title="ปิด"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className={styles.percentageContent}>
                {/* Preset Options */}
                <div className={styles.presetSection}>
                  <h4>ตัวเลือกที่แนะนำ:</h4>
                  <div className={styles.presetGrid}>
                    {presetOptions.map((preset, index) => (
                      <button
                        key={index}
                        className={styles.presetBtn}
                        onClick={() => handleApplyPreset(preset)}
                      >
                        <div className={styles.presetName}>{preset.name}</div>
                        <div className={styles.presetValues}>
                          ความจำเป็น: {preset.needs}% | ความต้องการ: {preset.wants}% | ออม: {preset.savings}%
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Settings */}
                <div className={styles.customSection}>
                  <h4>ตั้งค่าเอง:</h4>
                  
                  {/* Needs */}
                  <div className={styles.percentageRow}>
                    <label className={styles.percentageLabel}>ความจำเป็น (ค่าใช้จ่ายคงที่ + อาหาร):</label>
                    <div className={styles.percentageControls}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempPercentageAllocation.needs}
                        onChange={(e) => handlePercentageChange('needs', e.target.value)}
                        className={styles.percentageSlider}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tempPercentageAllocation.needs}
                        onChange={(e) => handlePercentageChange('needs', e.target.value)}
                        className={styles.percentageInput}
                      />
                      <span className={styles.percentageSymbol}>%</span>
                    </div>
                  </div>

                  {/* Wants */}
                  <div className={styles.percentageRow}>
                    <label className={styles.percentageLabel}>ความต้องการ (สิ่งที่อยากได้):</label>
                    <div className={styles.percentageControls}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempPercentageAllocation.wants}
                        onChange={(e) => handlePercentageChange('wants', e.target.value)}
                        className={styles.percentageSlider}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tempPercentageAllocation.wants}
                        onChange={(e) => handlePercentageChange('wants', e.target.value)}
                        className={styles.percentageInput}
                      />
                      <span className={styles.percentageSymbol}>%</span>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className={styles.percentageRow}>
                    <label className={styles.percentageLabel}>การออมและลงทุน (อนาคต):</label>
                    <div className={styles.percentageControls}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempPercentageAllocation.savings}
                        onChange={(e) => handlePercentageChange('savings', e.target.value)}
                        className={styles.percentageSlider}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tempPercentageAllocation.savings}
                        onChange={(e) => handlePercentageChange('savings', e.target.value)}
                        className={styles.percentageInput}
                      />
                      <span className={styles.percentageSymbol}>%</span>
                    </div>
                  </div>

                  {/* Total Display */}
                  <div className={styles.totalPercentage}>
                    <strong>
                      รวม: {tempPercentageAllocation.needs + tempPercentageAllocation.wants + tempPercentageAllocation.savings}%
                      {(tempPercentageAllocation.needs + tempPercentageAllocation.wants + tempPercentageAllocation.savings) !== 100 && (
                        <span className={styles.totalError}> (ต้องเท่ากับ 100%)</span>
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={handleClosePercentageModal}
                  className={styles.cancelBtn}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSavePercentages}
                  className={styles.confirmBtn}
                  disabled={(tempPercentageAllocation.needs + tempPercentageAllocation.wants + tempPercentageAllocation.savings) !== 100}
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Item Modal */}
        {showSubItemModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>
                เพิ่มรายการย่อย
                <span className={styles.modalSubtitle}>
                  {fixedExpenses.find(e => e.id === showSubItemModal)?.name}
                </span>
              </h3>
              
              <input
                type="text"
                value={subItemInput.name}
                onChange={(e) => setSubItemInput(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ชื่อรายการย่อย"
                className={styles.input}
                autoFocus
              />
              
              <input
                type="number"
                value={subItemInput.goal}
                onChange={(e) => setSubItemInput(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="เป้าหมาย"
                className={styles.input}
              />
              
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowSubItemModal(null)}
                  className={styles.cancelBtn}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddSubItem}
                  className={styles.confirmBtn}
                  disabled={!subItemInput.name.trim() || !subItemInput.goal || parseFloat(subItemInput.goal) <= 0}
                >
                  เพิ่ม
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
