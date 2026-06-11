const ChitScheme = require('../models/ChitScheme');

const getAll = async (req, res) => {
  try {
    const chits = await ChitScheme.find().sort({ createdAt: -1 });
    res.json({ success: true, data: chits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const chit = await ChitScheme.findById(req.params.id);
    if (!chit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: chit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const chit = await ChitScheme.create(req.body);
    res.status(201).json({ success: true, data: chit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const chit = await ChitScheme.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!chit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: chit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const chit = await ChitScheme.findByIdAndDelete(req.params.id);
    if (!chit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
