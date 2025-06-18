const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  description: { type: String, required: true, trim: true },
  paid_by: { type: String, required: true, trim: true },
  split_type: { 
    type: String, 
    required: true, 
    enum: ['EQUAL', 'PERCENTAGE', 'SHARE', 'EXACT'] 
  },
  split_data: [
    {
      person: { type: String, required: true },
      value: { type: Number, min: 0 }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);