const express = require('express');
const router = express.Router();
const {
  createAdmin,
  login,
  verifyOTP,
  getMe,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-admin', createAdmin);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
