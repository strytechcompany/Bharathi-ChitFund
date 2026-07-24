const express = require('express');
const router = express.Router();
const { getAll, getOne, getByMobile, create, update, remove, addTransaction } = require('../controllers/FPaymentCustomerController');

router.route('/').get(getAll).post(create);
router.route('/mobile/:mobile').get(getByMobile);
router.route('/:id').get(getOne).put(update).delete(remove);
router.route('/:id/transactions').post(addTransaction);

module.exports = router;
