const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/FPaymentController');
const { validateCreateFPayment, validateUpdateFPayment } = require('../middleware/validators/fpaymentValidator');

router.route('/').get(getAll).post(validateCreateFPayment, create);
router.route('/:id').get(getOne).put(validateUpdateFPayment, update).delete(remove);

module.exports = router;
