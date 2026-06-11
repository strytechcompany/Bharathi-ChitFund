const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  teamCode: { type: String, required: true, unique: true },
  chitScheme: { type: mongoose.Schema.Types.ObjectId, ref: 'ChitScheme', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['planning', 'filling', 'active', 'ongoing', 'completed'], default: 'planning' },
  memberLimit: { type: Number, default: 30 },
  collectionPercentage: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
