import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import authService from '../services/authService';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await authService.login(data.username, data.password);
      if (res.success) {
        toast.success(res.message);
        navigate('/verify-otp', { state: { email: res.email } });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#222]">Welcome Back</h1>
        <p className="text-sm text-gray-500 mt-2">
          Please enter your institutional credentials to access the Bharathi Admin portal.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Username
          </label>
          <div className="relative">
            <FiUser className="input-icon" />
            <input
              type="text"
              placeholder="Enter your username"
              className={`input-field ${errors.username ? 'border-red-500' : ''}`}
              {...register('username', { required: 'Username is required' })}
            />
          </div>
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Password
            </label>
            <a href="#" className="text-xs font-semibold text-gold hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <FiLock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="remember"
            className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold accent-gold"
            {...register('remember')}
          />
          <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
            Keep me logged in for 30 days
          </label>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'PROCESSING...' : 'LOGIN'} <FiArrowRight className="ml-1" />
        </button>
      </form>
    </div>
  );
};

export default Login;
