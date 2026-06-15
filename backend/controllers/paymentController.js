const Payment = require('../models/Payment');
const Member = require('../models/Member');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.member) filter.member = req.query.member;
    if (req.query.team) filter.team = req.query.team;
    const payments = await Payment.find(filter)
      .populate('member', 'fullName mobile')
      .populate('team', 'teamName')
      .sort({ year: -1, month: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      paidDate: req.body.status === 'paid' ? new Date() : null,
      transactionId: req.body.status === 'paid'
        ? 'TXN_' + Math.floor(Math.random() * 9000000 + 1000000)
        : '',
    });
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getUnpaidNotifications = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const activeMembers = await Member.find({ status: 'active' })
      .populate({
        path: 'team',
        populate: {
          path: 'chitScheme',
          model: 'ChitScheme'
        }
      });

    const paidPayments = await Payment.find({
      month: currentMonth,
      year: currentYear,
      status: 'paid'
    });

    const paidMemberIds = new Set(paidPayments.map(p => p.member.toString()));

    const unpaidNotifications = [];

    activeMembers.forEach(member => {
      if (!paidMemberIds.has(member._id.toString())) {
        let amountDue = member.monthlyPadi;
        if (!amountDue && member.team && member.team.chitScheme) {
          amountDue = member.team.chitScheme.monthlyAmount;
        }
        
        unpaidNotifications.push({
          memberId: member._id,
          fullName: member.fullName,
          mobile: member.mobile,
          amountDue: amountDue || 0,
          teamName: member.team ? member.team.teamName : 'No Team',
          chitSchemeName: (member.team && member.team.chitScheme) ? member.team.chitScheme.name : 'No Scheme',
        });
      }
    });

    res.json({ success: true, data: unpaidNotifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, create, update, getUnpaidNotifications };
