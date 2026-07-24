import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiList, FiUsers, FiUser, FiCreditCard, FiBarChart2, FiSettings, FiPlus, FiBell, FiArchive, FiDollarSign
} from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const nav = [
  { to: '/', icon: FiGrid, label: 'Dashboard', exact: true },
  { to: '/chit-schemes', icon: FiList, label: 'Chit Schemes' },
  { to: '/teams', icon: FiUsers, label: 'Teams' },
  { to: '/customers', icon: FiUser, label: 'Customers' },
  { to: '/payments', icon: FiCreditCard, label: 'Payments' },
  { to: '/fpayment', icon: FiDollarSign, label: 'FPayment' },
  { to: '/completed', icon: FiArchive, label: 'Completed' },
  { to: '/notifications', icon: FiBell, label: 'Notifications' },
  { to: '/reports', icon: FiBarChart2, label: 'Reports' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
];

const Sidebar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="w-56 min-h-screen bg-[#1C1C2E] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold rounded flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Bharathi Admin</div>
            <div className="text-gold text-[10px] font-semibold tracking-wider">Institutional Access</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#FAF8F2] text-gold'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* New Chit Scheme button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => navigate('/chit-schemes')}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#3D3A2E] text-gold text-sm font-semibold rounded-lg hover:bg-[#4a4630] transition-colors"
        >
          <FiPlus size={14} /> New Chit Scheme
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
