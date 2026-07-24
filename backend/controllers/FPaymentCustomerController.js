const fpaymentCustomerService = require('../services/fpaymentCustomerService');

const getAll = async (req, res) => {
  try {
    const customers = await fpaymentCustomerService.getAll();
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const customer = await fpaymentCustomerService.getById(req.params.id);
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const getByMobile = async (req, res) => {
  try {
    const customer = await fpaymentCustomerService.getByMobile(req.params.mobile);
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const customer = await fpaymentCustomerService.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const customer = await fpaymentCustomerService.update(req.params.id, req.body);
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await fpaymentCustomerService.remove(req.params.id);
    res.json({ success: true, message: 'FPaymentCustomer deleted' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const addTransaction = async (req, res) => {
  try {
    const customer = await fpaymentCustomerService.addTransaction(req.params.id, req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, getByMobile, create, update, remove, addTransaction };
