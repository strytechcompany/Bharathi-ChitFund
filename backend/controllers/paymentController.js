const Payment = require('../models/Payment');
const Member = require('../models/Member');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.member) filter.member = req.query.member;
    if (req.query.team) filter.team = req.query.team;
    const payments = await Payment.find(filter)
      .populate('member', 'fullName mobile paymentFrequency')
      .populate('team', 'teamName')
      .sort({ createdAt: -1 });
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

const remove = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getUnpaidNotifications = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();
    const currentWeek = Math.ceil(currentDay / 7);

    const activeMembers = await Member.find({ status: 'active' })
      .populate({
        path: 'team',
        populate: {
          path: 'chitScheme',
          model: 'ChitScheme'
        }
      });

    // Only consider members in active teams that have already started
    const validMembers = activeMembers.filter(m => 
      m.team && 
      m.team.status === 'active' && 
      m.team.startDate && 
      new Date(m.team.startDate) <= currentDate
    );

    const paidPayments = await Payment.find({
      month: currentMonth,
      year: currentYear,
      status: 'paid',
      member: { $in: validMembers.map(m => m._id) }
    });

    const unpaidNotifications = [];

    validMembers.forEach(member => {
      const memberPayments = paidPayments.filter(p => p.member.toString() === member._id.toString());
      
      let isUnpaid = false;
      let missingPeriod = '';

      if (member.paymentFrequency === 'daily') {
        const hasPaidToday = memberPayments.some(p => p.day === currentDay || (p.paidDate && new Date(p.paidDate).getDate() === currentDay));
        if (!hasPaidToday) { isUnpaid = true; missingPeriod = `Today (Day ${currentDay})`; }
      } else if (member.paymentFrequency === 'weekly') {
        const hasPaidThisWeek = memberPayments.some(p => p.week === currentWeek || (p.paidDate && Math.ceil(new Date(p.paidDate).getDate() / 7) === currentWeek));
        if (!hasPaidThisWeek) { isUnpaid = true; missingPeriod = `This Week (Wk ${currentWeek})`; }
      } else {
        const hasPaidThisMonth = memberPayments.some(p => p.month === currentMonth && p.year === currentYear);
        if (!hasPaidThisMonth) { isUnpaid = true; missingPeriod = `This Month`; }
      }

      if (isUnpaid) {
        let amountDue = member.monthlyPadi;
        if (!amountDue && member.team && member.team.chitScheme) {
          amountDue = member.team.chitScheme.monthlyAmount;
        }
        
        unpaidNotifications.push({
          memberId: member._id,
          fullName: member.fullName,
          mobile: member.mobile,
          amountDue: amountDue || 0,
          teamName: member.team.teamName,
          chitSchemeName: member.team.chitScheme.name,
          paymentFrequency: member.paymentFrequency || 'monthly',
          missingPeriod: missingPeriod
        });
      }
    });

    res.json({ success: true, data: unpaidNotifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, create, update, remove, getUnpaidNotifications };
