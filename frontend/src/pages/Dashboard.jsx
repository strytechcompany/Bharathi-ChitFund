import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiUser, FiDollarSign, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import dashboardService from '../services/dashboardService';
import chitService from '../services/chitService';

const fmt = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

const TIER_COLORS = {
  BRONZE: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  SILVER: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  GOLD: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  PLATINUM: { bg: 'bg-gold/5 border-2 border-gold', border: 'border-gold', badge: 'bg-gold text-white', dot: 'bg-gold' },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ totalSchemes: 0, totalTeams: 0, totalMembers: 0, monthlyCollection: 0, pendingPayments: 0 });
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getSummary().catch(() => null),
      chitService.getAll().catch(() => []),
    ]).then(([s, c]) => {
      if (s) setSummary(s);
      setSchemes(c || []);
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: 'Total Chit Schemes', value: summary.totalSchemes, icon: FiHome, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Teams', value: summary.totalTeams, icon: FiUsers, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Total Members', value: summary.totalMembers.toLocaleString(), icon: FiUser, color: 'text-green-600 bg-green-50' },
    { label: 'Monthly Collection', value: fmt(summary.monthlyCollection), icon: FiDollarSign, color: 'text-gold bg-yellow-50' },
    { label: 'Pending Payments', value: fmt(summary.pendingPayments), icon: FiAlertTriangle, color: 'text-red-500 bg-red-50', alert: true },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Executive Summary</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time financial status and operational health of Bharathi Chit Funds.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, alert }) => (
          <div key={label} className={`bg-white rounded-xl border p-4 ${alert ? 'border-red-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-tight">{label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={14} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${alert ? 'text-red-500' : 'text-gray-800'}`}>{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Active Premium Schemes */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Active Premium Schemes</h3>
        <button onClick={() => navigate('/chit-schemes')} className="text-sm text-gold font-semibold flex items-center gap-1 hover:underline">
          View All Schemes <FiArrowRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : schemes.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-3">No chit schemes yet.</p>
          <button onClick={() => navigate('/chit-schemes')} className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover">
            Create First Scheme
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {schemes.slice(0, 8).map((scheme) => {
            const tier = scheme.tier || 'BRONZE';
            const c = TIER_COLORS[tier] || TIER_COLORS.BRONZE;
            return (
              <div
                key={scheme._id}
                onClick={() => navigate(`/chit-schemes/${scheme._id}/teams`)}
                className={`bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition-all ${tier === 'PLATINUM' ? 'border-gold border-2' : 'border-gray-100'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${c.badge}`}>{tier} TIER</span>
                  {tier === 'PLATINUM' && <span className="text-[10px] font-bold px-2 py-0.5 bg-gold text-white rounded uppercase">PREMIUM</span>}
                </div>
                <p className="text-xl font-bold text-gray-800 mb-1">₹{(scheme.amount / 100000).toFixed(0)} Lakh</p>
                <p className="text-sm text-gray-500 mb-4">Chit</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{scheme.durationMonths} Months</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${scheme.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {scheme.status}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Monthly: ₹{scheme.monthlyAmount?.toLocaleString()}</span>
                  <FiArrowRight size={14} className="text-gold" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
