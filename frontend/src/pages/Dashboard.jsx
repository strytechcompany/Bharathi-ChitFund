import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 animate-fade-in">
        <div className="flex justify-between items-center border-b pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#222]">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back to Bharathi Chit Funds</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-[#FDF6E3] border border-gold rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gold mb-4">Admin Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Username</p>
              <p className="text-lg font-medium">{user?.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Email</p>
              <p className="text-lg font-medium">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
