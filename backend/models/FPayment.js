const mongoose = require('mongoose');

const generatePaymentId = () =>
  `FP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

const fpaymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true, default: generatePaymentId },

  memberId: { type: mongoose.Schema.Types.ObjectId },
  memberName: { type: String, required: true },

  schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentScheme' },
  schemeName: { type: String, default: '' },

  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'FPaymentTeam' },
  teamName: { type: String, default: '' },

  installmentNo: { type: Number, default: 1 },
  installmentType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'monthly',
  },

  month: { type: Number },
  year: { type: Number },
  week: { type: Number },
  day: { type: Number },

  amount: { type: Number, required: true, min: 0 },

  paymentDate: { type: Date, default: Date.now },

  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'],
    default: 'cash',
  },

  referenceNumber: { type: String, default: '' },

  description: { type: String, default: '' },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
  },

  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('FPayment', fpaymentSchema);
