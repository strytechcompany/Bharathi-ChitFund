const mongoose = require('mongoose');

const fpaymentTeamMemberSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobile: { type: String, default: '' },
  address: { type: String, default: '' },
  chitAmount: { type: Number, default: 0 },
  totalMonths: { type: Number, default: 0 },
  paymentFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
  monthlyAmount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now },
});

const fpaymentTeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  memberLimit: { type: Number, default: 30 },

  schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentScheme' },
  schemeName: { type: String, default: '' },

  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active' },

  members: [fpaymentTeamMemberSchema],

  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('FPaymentTeam', fpaymentTeamSchema, 'fpayment_teams');
