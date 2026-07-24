import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiArrowLeft } from 'react-icons/fi';
import fpaymentService from '../services/fpaymentService';

const STATUS_COLOR = {
  completed: 'bg-green-100 text-green-600',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-500',
  cancelled: 'bg-gray-100 text-gray-500',
};

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const FPaymentPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => fpaymentService.getAllFPayments().then(setPayments).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this payment record?')) return;
    try { await fpaymentService.deleteFPayment(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const filtered = payments.filter(p =>
    p.memberName.toLowerCase().includes(search.toLowerCase()) || (p.paymentId || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/fpayment')} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gold hover:border-gold transition-colors">
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">FPayment Ledger</h2>
            <p className="text-sm text-gray-500">Manage flexible/free-form payment records</p>
          </div>
        </div>
        <button onClick={() => navigate('/fpayment/payments/create')} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover">
          <FiPlus size={14} /> Add Payment
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payments..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold" />
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 mb-3">{search ? 'No results found.' : 'No payment records yet.'}</p>
            {!search && <button onClick={() => navigate('/fpayment/payments/create')} className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold">Add First Payment</button>}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Member', 'Amount', 'Method', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/fpayment/payments/${p._id}`)}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800 text-sm">{p.memberName}</p>
                      <p className="text-xs text-gray-400">{p.paymentId}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 capitalize">{(p.paymentMethod || '').replace('_', ' ')}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${STATUS_COLOR[p.status] || STATUS_COLOR.completed}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{formatDate(p.paymentDate)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/fpayment/payments/${p._id}/edit`)} className="text-gray-400 hover:text-gold p-1"><FiEdit2 size={14} /></button>
                        <button onClick={(e) => handleDelete(e, p._id)} className="text-gray-400 hover:text-red-500 p-1"><FiTrash2 size={14} /></button>
                      </div>
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

export default FPaymentPayments;
