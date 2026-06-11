const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  amount: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  paidDate: { type: Date },
  transactionId: { type: String, default: '' },
  status: { type: String, enum: ['paid', 'due', 'pending'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
