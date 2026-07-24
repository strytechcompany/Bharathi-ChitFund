const fpaymentService = require('../services/fpaymentService');

const getAll = async (req, res) => {
  try {
    const payments = await fpaymentService.getAll(req.query);
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const payment = await fpaymentService.getById(req.params.id);
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const payment = await fpaymentService.create(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const payment = await fpaymentService.update(req.params.id, req.body);
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await fpaymentService.remove(req.params.id);
    res.json({ success: true, message: 'FPayment deleted' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
