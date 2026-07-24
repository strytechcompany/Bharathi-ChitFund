const FPaymentCustomer = require('../models/FPaymentCustomer');

const notFound = () => {
  const error = new Error('FPaymentCustomer not found');
  error.statusCode = 404;
  return error;
};

const checkDuplicate = async (fullName, mobile, excludeId) => {
  const orConditions = [];
  if (fullName) orConditions.push({ fullName });
  if (mobile) orConditions.push({ mobile });
  if (orConditions.length === 0) return;

  const filter = { $or: orConditions };
  if (excludeId) filter._id = { $ne: excludeId };

  const existing = await FPaymentCustomer.findOne(filter);
  if (existing) {
    if (existing.fullName === fullName) {
      const error = new Error('Customer name already exists');
      error.statusCode = 400;
      throw error;
    }
    if (existing.mobile === mobile) {
      const error = new Error('Mobile number already exists');
      error.statusCode = 400;
      throw error;
    }
  }
};

const getAll = async () => FPaymentCustomer.find().sort({ createdAt: -1 });

const getById = async (id) => {
  const customer = await FPaymentCustomer.findById(id);
  if (!customer) throw notFound();
  return customer;
};

const getByMobile = async (mobile) => {
  const customer = await FPaymentCustomer.findOne({ mobile });
  if (!customer) throw notFound();
  return customer;
};

const create = async (data) => {
  await checkDuplicate(data.fullName, data.mobile);
  return FPaymentCustomer.create(data);
};

const update = async (id, data) => {
  await checkDuplicate(data.fullName, data.mobile, id);
  const customer = await FPaymentCustomer.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!customer) throw notFound();
  return customer;
};

const remove = async (id) => {
  const customer = await FPaymentCustomer.findByIdAndDelete(id);
  if (!customer) throw notFound();
  return customer;
};

const addTransaction = async (id, transactionData) => {
  const customer = await FPaymentCustomer.findById(id);
  if (!customer) throw notFound();
  customer.transactions.push(transactionData);
  await customer.save();
  return customer;
};

module.exports = { getAll, getById, getByMobile, create, update, remove, addTransaction };
