import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiKey, FiCheckCircle } from 'react-icons/fi';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }

    if (timeLeft === 0) return;

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, email, navigate]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.verifyOTP(email, otp);
      if (res.success) {
        toast.success('Login successful!');
        // Get user details
        const userData = await authService.getMe();
        login(userData);
        navigate('/'); // Redirect to dashboard
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      // We don't have password here, wait! 
      // Actually the backend API for login requires username/password to send OTP. 
      // If we need resend, we might need a dedicated resend endpoint, or the user has to login again.
      // Let's implement a quick workaround: since we don't have a resend API, we just show a toast for demo.
      // In a real app we'd have a /resend-otp endpoint that accepts email.
      toast.info('Please go back to login to request a new OTP');
      navigate('/login');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="card animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#FDF6E3] rounded-full flex items-center justify-center mx-auto mb-4">
          <FiKey className="text-2xl text-gold" />
        </div>
        <h1 className="text-2xl font-bold text-[#222]">Verification Code</h1>
        <p className="text-sm text-gray-500 mt-2">
          We've sent a 6-digit verification code to your registered email address.
        </p>
      </div>

      <form onSubmit={handleVerify}>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Email Address
          </label>
          <div className="relative">
            <FiMail className="input-icon" />
            <input
              type="email"
              className="input-field bg-gray-100 text-gray-500"
              value={email}
              readOnly
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Enter OTP
            </label>
            <span className={`text-xs font-bold ${timeLeft < 30 ? 'text-red-500' : 'text-gold'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="relative">
            <FiKey className="input-icon" />
            <input
              type="text"
              placeholder="123456"
              className="input-field text-center tracking-[0.5em] font-bold text-lg"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary mb-4"
          disabled={loading || timeLeft === 0}
        >
          {loading ? 'VERIFYING...' : 'VERIFY OTP'} <FiCheckCircle className="ml-1" />
        </button>

        <button
          type="button"
          className={`w-full py-3 text-sm font-semibold rounded-lg transition-colors ${
            timeLeft === 0 
              ? 'text-gold bg-[#FDF6E3] hover:bg-[#FCEBBB]' 
              : 'text-gray-400 bg-transparent cursor-not-allowed'
          }`}
          disabled={timeLeft > 0 || resending}
          onClick={handleResend}
        >
          {resending ? 'SENDING...' : 'RESEND OTP'}
        </button>
      </form>
    </div>
  );
};

export default VerifyOTP;
