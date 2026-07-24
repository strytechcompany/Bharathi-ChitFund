const mongoose = require('mongoose');

const paymentSchemeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'], default: 'BRONZE' },
  amount: { type: Number, required: true },
  durationMonths: { type: Number, required: true },
  monthlyAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active' },
  description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('PaymentScheme', paymentSchemeSchema, 'payment_schemes');
