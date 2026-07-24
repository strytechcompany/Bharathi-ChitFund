const paymentSchemeService = require('../services/paymentSchemeService');

const getAll = async (req, res) => {
  try {
    const schemes = await paymentSchemeService.getAll();
    res.json({ success: true, data: schemes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const scheme = await paymentSchemeService.getById(req.params.id);
    res.json({ success: true, data: scheme });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const scheme = await paymentSchemeService.create(req.body);
    res.status(201).json({ success: true, data: scheme });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const scheme = await paymentSchemeService.update(req.params.id, req.body);
    res.json({ success: true, data: scheme });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await paymentSchemeService.remove(req.params.id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
