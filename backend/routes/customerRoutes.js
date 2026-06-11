const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/customerController');

router.route('/').get(getAll).post(create);
router.route('/:id').get(getOne).put(update).delete(remove);

module.exports = router;
