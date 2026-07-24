const FPayment = require('../models/FPayment');

const getAll = async (filters = {}) => {
  const query = {};
  if (filters.memberId) query.memberId = filters.memberId;
  if (filters.schemeId) query.schemeId = filters.schemeId;
  if (filters.teamId) query.teamId = filters.teamId;
  if (filters.status) query.status = filters.status;

  return FPayment.find(query).sort({ createdAt: -1 });
};

const getById = async (id) => {
  const payment = await FPayment.findById(id);
  if (!payment) {
    const error = new Error('FPayment not found');
    error.statusCode = 404;
    throw error;
  }
  return payment;
};

const create = async (data) => FPayment.create(data);

const update = async (id, data) => {
  const payment = await FPayment.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!payment) {
    const error = new Error('FPayment not found');
    error.statusCode = 404;
    throw error;
  }
  return payment;
};

const remove = async (id) => {
  const payment = await FPayment.findByIdAndDelete(id);
  if (!payment) {
    const error = new Error('FPayment not found');
    error.statusCode = 404;
    throw error;
  }
  return payment;
};

module.exports = { getAll, getById, create, update, remove };
