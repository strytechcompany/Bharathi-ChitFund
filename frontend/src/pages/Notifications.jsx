import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiBell } from 'react-icons/fi';
import paymentService from '../services/paymentService';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    paymentService.getUnpaidNotifications()
      .then(setNotifications)
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const filtered = notifications.filter(n =>
    n.fullName.toLowerCase().includes(search.toLowerCase()) || 
    n.mobile.includes(search) ||
    n.teamName.toLowerCase().includes(search.toLowerCase()) ||
    n.chitSchemeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiBell className="text-gold" /> Unpaid Notifications
          </h2>
          <p className="text-sm text-gray-500">Customers who haven't paid for the current month</p>
        </div>
      </div>

      <div className="relative mb-5 max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold" />
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <FiBell size={24} className="text-green-500" />
              </div>
            </div>
            <p className="text-gray-400 mb-1 font-semibold">All clear!</p>
            <p className="text-gray-400 text-sm">{search ? 'No results found.' : 'No pending payments for the current month.'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Customer', 'Mobile', 'Amount Due', 'Period', 'Payment Mode', 'Team', 'Chit Scheme'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((n, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xs font-bold flex-shrink-0">{initials(n.fullName)}</div>
                        <p className="font-semibold text-gray-800 text-sm">{n.fullName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{n.mobile}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-red-600">₹{n.amountDue.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">
                      {(() => {
                        const d = new Date();
                        const mStr = d.toLocaleDateString('en-US', { month: 'short' });
                        const y = d.getFullYear();
                        const date = d.getDate();
                        const week = Math.ceil(date / 7);
                        if (n.paymentFrequency === 'daily') return `${date} ${mStr} ${y} (Day ${date})`;
                        if (n.paymentFrequency === 'weekly') return `${mStr} ${y} (Wk ${week})`;
                        return `${mStr} ${y}`;
                      })()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-600 rounded uppercase">{n.paymentFrequency || 'monthly'}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{n.teamName}</td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded uppercase">{n.chitSchemeName}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default Notifications;
