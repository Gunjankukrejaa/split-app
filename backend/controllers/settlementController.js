const Expense = require('../models/Expense');

// Calculate balances
exports.getBalances = async (req, res) => {
  try {
    const expenses = await Expense.find();
    const balances = {};

    expenses.forEach(expense => {
      // Add paid amount
      balances[expense.paid_by] = (balances[expense.paid_by] || 0) + expense.amount;
      
      // Subtract owed amounts
      expense.split_data.forEach(p => {
        balances[p.person] = (balances[p.person] || 0) - p.value;
      });
    });

    // Format to 2 decimal places
    Object.keys(balances).forEach(person => {
      balances[person] = parseFloat(balances[person].toFixed(2));
    });

    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Calculate simplified settlements
exports.getSettlements = async (req, res) => {
  try {
    const expenses = await Expense.find();
    const balances = {};

    // Calculate balances
    expenses.forEach(expense => {
      balances[expense.paid_by] = (balances[expense.paid_by] || 0) + expense.amount;
      expense.split_data.forEach(p => {
        balances[p.person] = (balances[p.person] || 0) - p.value;
      });
    });

    // Prepare creditors and debtors
    const creditors = [];
    const debtors = [];
    
    Object.entries(balances).forEach(([person, balance]) => {
      if (balance > 0.01) {
        creditors.push({ person, amount: parseFloat(balance.toFixed(2)) });
      } else if (balance < -0.01) {
        debtors.push({ person, amount: parseFloat((-balance).toFixed(2)) });
      }
    });

    // Sort by amount (descending)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Minimize transactions
    const transactions = [];
    
    while (creditors.length > 0 && debtors.length > 0) {
      const creditor = creditors[0];
      const debtor = debtors[0];
      const amount = parseFloat(Math.min(creditor.amount, debtor.amount).toFixed(2));
      
      transactions.push({
        from: debtor.person,
        to: creditor.person,
        amount
      });

      creditor.amount -= amount;
      debtor.amount -= amount;

      if (creditor.amount < 0.01) creditors.shift();
      if (debtor.amount < 0.01) debtors.shift();
    }

    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};