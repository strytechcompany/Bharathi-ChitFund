const ChitScheme = require('../models/ChitScheme');
const Team = require('../models/Team');
const Member = require('../models/Member');
const Payment = require('../models/Payment');

const getSummary = async (req, res) => {
  try {
    const [totalSchemes, totalTeams, totalMembers, paidPayments, duePayments] = await Promise.all([
      ChitScheme.countDocuments({ status: 'active' }),
      Team.countDocuments(),
      Member.countDocuments({ status: 'active' }),
      Payment.find({ status: 'paid' }),
      Payment.find({ status: 'due' }),
    ]);

    const monthlyCollection = paidPayments.reduce((s, p) => s + p.amount, 0);
    const pendingPayments = duePayments.reduce((s, p) => s + p.amount, 0);

    res.json({ success: true, data: { totalSchemes, totalTeams, totalMembers, monthlyCollection, pendingPayments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSummary };
