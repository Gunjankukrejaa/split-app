const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const expenseController = require('../controllers/expenseController');

// Validate split data
const validateSplitData = (req, res, next) => {
  const { split_type, split_data } = req.body;
  if (!Array.isArray(split_data)) {
    return res.status(400).json({ error: 'split_data must be an array' });
  }
  
  // Validate person names
  for (const item of split_data) {
    if (!item.person || typeof item.person !== 'string') {
      return res.status(400).json({ error: 'Each split item requires a valid person name' });
    }
  }
  
  next();
};

router.get('/', expenseController.getAllExpenses);
router.post(
  '/',
  [
    check('amount').isFloat({ min: 0.01 }).withMessage('Amount must be at least 0.01'),
    check('description').notEmpty().withMessage('Description is required'),
    check('paid_by').notEmpty().withMessage('Payer is required'),
    check('split_type').isIn(['EQUAL', 'PERCENTAGE', 'SHARE', 'EXACT']).withMessage('Invalid split type'),
    validateSplitData
  ],
  expenseController.createExpense
);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;