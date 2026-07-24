const mongoose = require('mongoose');

const fpaymentTransactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  transactionDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['paid', 'pending'], default: 'paid' },
}, { timestamps: true });

const fpaymentCustomerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  aadhaarNumber: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes: { type: String, default: '' },

  transactions: [fpaymentTransactionSchema],

  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('FPaymentCustomer', fpaymentCustomerSchema, 'fpayment_customers');
