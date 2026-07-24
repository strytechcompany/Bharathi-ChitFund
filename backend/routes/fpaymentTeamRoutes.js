const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove, addMember, updateMember, removeMember } = require('../controllers/FPaymentTeamController');

router.route('/').get(getAll).post(create);
router.route('/:id').get(getOne).put(update).delete(remove);
router.route('/:id/members').post(addMember);
router.route('/:id/members/:memberId').put(updateMember).delete(removeMember);

module.exports = router;
