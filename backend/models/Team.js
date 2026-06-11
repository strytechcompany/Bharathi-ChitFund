const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  teamCode: { type: String, default: '' },
  chitScheme: { type: mongoose.Schema.Types.ObjectId, ref: 'ChitScheme', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active' },
  memberLimit: { type: Number, default: 30 },
  collectionPercentage: { type: Number, default: 0 },
  description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
