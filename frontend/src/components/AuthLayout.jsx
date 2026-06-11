import React from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Logo Header */}
      <div className="mb-8 flex items-center justify-center">
        <div className="w-10 h-10 bg-gold rounded flex items-center justify-center mr-3 relative overflow-hidden">
          {/* Simple logo representation */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-sm"></div>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-wide text-[#222222]">BHARATHI</span>
          <span className="text-sm font-semibold tracking-widest text-gold mt-[-4px]">CHIT FUNDS</span>
        </div>
      </div>

      {/* Main Content */}
      <Outlet />

      {/* Footer */}
      <div className="mt-8 text-sm text-[#666666] flex flex-col items-center">
        <p className="mb-2">
          Don't have an account? <a href="#" className="font-bold text-gold hover:underline">Contact Administrator</a>
        </p>
        <div className="flex items-center space-x-3 font-semibold text-xs text-[#888888]">
          <a href="#" className="hover:text-[#444]">Privacy Policy</a>
          <span className="w-1 h-1 bg-gold rounded-full"></span>
          <a href="#" className="hover:text-[#444]">Terms of Service</a>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
