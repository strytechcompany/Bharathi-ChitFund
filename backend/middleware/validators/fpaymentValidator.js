const PAYMENT_METHODS = ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'];
const STATUSES = ['pending', 'completed', 'failed', 'cancelled'];

const validateCreateFPayment = (req, res, next) => {
  const errors = [];
  const { memberName, amount, paymentMethod, status } = req.body;

  if (!memberName || !String(memberName).trim()) errors.push('memberName is required');
  if (amount === undefined || amount === null || isNaN(amount) || Number(amount) <= 0) {
    errors.push('amount must be a positive number');
  }
  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
    errors.push(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`);
  }
  if (status && !STATUSES.includes(status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  }

  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  next();
};

const validateUpdateFPayment = (req, res, next) => {
  const errors = [];
  const { amount, paymentMethod, status } = req.body;

  if (amount !== undefined && (isNaN(amount) || Number(amount) <= 0)) {
    errors.push('amount must be a positive number');
  }
  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
    errors.push(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`);
  }
  if (status && !STATUSES.includes(status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  }

  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  next();
};

module.exports = { validateCreateFPayment, validateUpdateFPayment };
