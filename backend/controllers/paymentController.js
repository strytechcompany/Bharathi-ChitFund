const Payment = require('../models/Payment');

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

module.exports = { getAll, create, update };
