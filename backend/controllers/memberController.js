const Member = require('../models/Member');
const Payment = require('../models/Payment');

const getAll = async (req, res) => {
  try {
    const filter = req.query.team ? { team: req.query.team } : {};
    const members = await Member.find(filter).populate('team', 'teamName teamCode').sort({ createdAt: -1 });
    res.json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).populate('team');
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });

    const payments = await Payment.find({ member: member._id }).sort({ year: -1, month: -1 });
    res.json({ success: true, data: { ...member.toObject(), payments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await Payment.deleteMany({ member: req.params.id });
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
