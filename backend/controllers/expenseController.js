const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// Calculate shares based on split type
const calculateShares = (amount, splitType, splitData) => {
  const shares = {};
  switch (splitType) {
    case 'EQUAL':
      const perPerson = amount / splitData.length;
      splitData.forEach(p => shares[p.person] = parseFloat(perPerson.toFixed(2)));
      break;
    case 'PERCENTAGE':
      splitData.forEach(p => {
        shares[p.person] = parseFloat((amount * (p.value / 100)).toFixed(2));
      });
      break;
    case 'SHARE':
      const totalShares = splitData.reduce((sum, p) => sum + p.value, 0);
      splitData.forEach(p => {
        shares[p.person] = parseFloat((amount * (p.value / totalShares)).toFixed(2));
      });
      break;
    case 'EXACT':
      splitData.forEach(p => shares[p.person] = parseFloat(p.value.toFixed(2)));
      break;
  }
  return shares;
};

// Create new expense
exports.createExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, description, paid_by, split_type, split_data } = req.body;
  
  try {
    // Validate share sum for EXACT type
    if (split_type === 'EXACT') {
      const total = split_data.reduce((sum, p) => sum + p.value, 0);
      if (Math.abs(total - amount) > 0.01) {
        return res.status(400).json({ 
          error: 'Sum of exact amounts must equal expense total' 
        });
      }
    }

    const shares = calculateShares(amount, split_type, split_data);
    const processedSplitData = split_data.map(p => ({
      person: p.person,
      value: shares[p.person]
    }));

    const expense = new Expense({
      amount,
      description,
      paid_by,
      split_type,
      split_data: processedSplitData
    });

    await expense.save();

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense added successfully'
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const { amount, description, paid_by, split_type, split_data } = req.body;
    
    // Recalculate shares if needed
    if (split_type !== expense.split_type || 
        amount !== expense.amount ||
        JSON.stringify(split_data) !== JSON.stringify(expense.split_data)) {
      const shares = calculateShares(amount, split_type, split_data);
      split_data = Object.keys(shares).map(person => ({
        person,
        value: shares[person]
      }));
    }

    expense.amount = amount;
    expense.description = description;
    expense.paid_by = paid_by;
    expense.split_type = split_type;
    expense.split_data = split_data;

    await expense.save();
    res.json({ success: true, data: expense, message: 'Expense updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    await expense.remove();
    res.json({ success: true, message: 'Expense removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all people
exports.getPeople = async (req, res) => {
  try {
    const expenses = await Expense.find();
    const peopleSet = new Set();
    
    expenses.forEach(expense => {
      peopleSet.add(expense.paid_by);
      expense.split_data.forEach(item => peopleSet.add(item.person));
    });
    
    res.json({ success: true, data: Array.from(peopleSet) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};