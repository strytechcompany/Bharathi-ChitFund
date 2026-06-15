const express = require('express');
const router = express.Router();
const { getAll, create, update, getUnpaidNotifications } = require('../controllers/paymentController');

router.route('/unpaid-notifications').get(getUnpaidNotifications);
router.route('/').get(getAll).post(create);
router.route('/:id').put(update);

module.exports = router;
