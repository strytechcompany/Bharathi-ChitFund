const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  aadhaarNumber: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
