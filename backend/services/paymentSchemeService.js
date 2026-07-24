const PaymentScheme = require('../models/PaymentScheme');

const notFound = () => {
  const error = new Error('PaymentScheme not found');
  error.statusCode = 404;
  return error;
};

const getAll = async () => PaymentScheme.find().sort({ createdAt: -1 });

const getById = async (id) => {
  const scheme = await PaymentScheme.findById(id);
  if (!scheme) throw notFound();
  return scheme;
};

const create = async (data) => PaymentScheme.create(data);

const update = async (id, data) => {
  const scheme = await PaymentScheme.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!scheme) throw notFound();
  return scheme;
};

const remove = async (id) => {
  const scheme = await PaymentScheme.findByIdAndDelete(id);
  if (!scheme) throw notFound();
  return scheme;
};

module.exports = { getAll, getById, create, update, remove };
