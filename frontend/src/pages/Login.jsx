import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiTrendingUp, FiUsers } from 'react-icons/fi';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';

const features = [
  { icon: FiTrendingUp, title: 'Real-time Analytics', desc: 'Monitor collections and performance live' },
  { icon: FiUsers, title: 'Member Management', desc: 'Manage thousands of members with ease' },
  { icon: FiShield, title: 'Secure & Reliable', desc: 'Enterprise-grade security for your data' },
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const onSubmit = (data) => {
    try {
      setLoading(true);
      const res = authService.login(data.username, data.password);
      login(res.user);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#1C1C2E] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gold/10" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-gold/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/[0.02]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-11 h-11 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/30">
            <div className="w-5 h-5 bg-white rounded-sm" />
          </div>
          <div>
            <p className="text-white font-bold text-xl tracking-wide">BHARATHI</p>
            <p className="text-gold text-xs font-semibold tracking-[0.2em] -mt-0.5">CHIT FUNDS</p>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage Your<br />
            <span className="text-gold">Chit Fund</span><br />
            Portfolio
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-xs">
            Institutional-grade platform for managing chit fund schemes, teams, members and payments — all in one place.
          </p>

          {/* Feature list */}
          <div className="space-y-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={16} className="text-gold" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-gray-600 text-xs">
          © 2024 Bharathi Chit Funds. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 bg-[#FAF8F2] flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          <div>
            <p className="font-bold text-gray-800 tracking-wide">BHARATHI</p>
            <p className="text-gold text-[10px] font-bold tracking-widest -mt-0.5">CHIT FUNDS</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-2">Sign in to your admin portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Enter your username"
                  className={`w-full pl-11 pr-4 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all
                    ${errors.username
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-gray-200 focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]'
                    }`}
                  {...register('username', { required: 'Username is required' })}
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`w-full pl-11 pr-12 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all
                    ${errors.password
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-gray-200 focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]'
                    }`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" {...register('remember')} />
                <div className="w-4 h-4 border-2 border-gray-300 rounded peer-checked:bg-gold peer-checked:border-gold transition-all" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100">
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <span className="text-sm text-gray-600">Keep me signed in for 30 days</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gold text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-gold-hover hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>LOGIN <FiArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Divider hint */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              Don't have access?{' '}
              <a href="#" className="text-gold font-semibold hover:underline">Contact Administrator</a>
            </p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Privacy Policy</a>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
