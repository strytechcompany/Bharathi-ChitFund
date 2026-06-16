import { useContext, useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FiBell, FiHelpCircle, FiLogOut, FiSearch, FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';
import { AuthContext } from '../context/AuthContext';
import { checkCompletedTeams } from '../services/completionService';

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Run immediately
    checkCompletedTeams();
    // Then every 30 mins (30 * 60 * 1000 = 1800000 ms)
    const interval = setInterval(checkCompletedTeams, 1800000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">
          <h1 className="text-gold font-bold text-lg mr-4 whitespace-nowrap">Bharathi Chit Funds</h1>

          <div className="flex-1 max-w-sm relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search records..."
              className="w-full pl-8 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-full outline-none focus:border-gold"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="text-gray-400 hover:text-gray-600"><FiBell size={18} /></button>
            <button className="text-gray-400 hover:text-gray-600"><FiHelpCircle size={18} /></button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-800">{user?.name || 'Admin User'}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{user?.role || 'SUPER ADMIN'}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-white text-xs font-bold">
                {(user?.name || 'A').charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 font-medium ml-1"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
