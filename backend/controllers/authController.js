const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Otp = require('../models/Otp');
const sendOTP = require('../utils/sendOTP');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Create first admin account
// @route   POST /api/auth/create-admin
// @access  Public
const createAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const adminExists = await Admin.findOne({ $or: [{ username }, { email }] });

    if (adminExists) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    const admin = await Admin.create({
      username,
      email,
      password,
    });

    if (admin) {
      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login and generate OTP
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });

    if (admin && (await admin.matchPassword(password))) {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Delete existing OTPs for this email to prevent duplicates
      await Otp.deleteMany({ email: admin.email });

      // Save new OTP
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
      await Otp.create({
        email: admin.email,
        otp,
        expiresAt
      });

      // Send OTP via email
      const isSent = await sendOTP(admin.email, otp);

      if (isSent) {
        res.json({
          success: true,
          message: 'OTP sent successfully',
          email: admin.email
        });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const validOtp = await Otp.findOne({ email, otp });

    if (!validOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (new Date() > validOtp.expiresAt) {
       await Otp.deleteOne({ _id: validOtp._id });
       return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Delete used OTP
    await Otp.deleteOne({ _id: validOtp._id });

    res.json({
      success: true,
      token: generateToken(admin._id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current User
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.status(200).json(req.admin);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAdmin,
  login,
  verifyOTP,
  getMe,
};
