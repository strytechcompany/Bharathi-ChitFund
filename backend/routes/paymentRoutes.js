const express = require('express');
const router = express.Router();
const { getAll, create, update } = require('../controllers/paymentController');

router.route('/').get(getAll).post(create);
router.route('/:id').put(update);

module.exports = router;
