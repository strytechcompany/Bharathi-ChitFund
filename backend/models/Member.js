const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, default: '' },
  aadhaarNumber: { type: String, default: '' },
  joiningDate: { type: Date },
  chitAmount: { type: Number, default: 0 },
  monthlyPadi: { type: Number, default: 0 },
  totalMonths: { type: Number, default: 20 },
  notes: { type: String, default: '' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isPremium: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);
