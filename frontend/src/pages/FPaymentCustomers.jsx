import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiArrowLeft } from 'react-icons/fi';
import fpaymentCustomerService from '../services/fpaymentCustomerService';

const FPaymentCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => fpaymentCustomerService.getAll().then(setCustomers).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this customer?')) return;
    try { await fpaymentCustomerService.remove(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const filtered = customers.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/fpayment')} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gold hover:border-gold transition-colors">
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">FPayment Customers</h2>
            <p className="text-sm text-gray-500">Manage your FPayment customer database</p>
          </div>
        </div>
        <button onClick={() => navigate('/fpayment/customers/create')} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover">
          <FiPlus size={14} /> Add Customer
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold" />
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 mb-3">{search ? 'No results found.' : 'No customers yet.'}</p>
            {!search && <button onClick={() => navigate('/fpayment/customers/create')} className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold">Add First Customer</button>}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Customer', 'Mobile', 'Address', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/fpayment/customers/${c._id}`)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold flex-shrink-0">{initials(c.fullName)}</div>
                        <p className="font-semibold text-gray-800 text-sm hover:text-gold">{c.fullName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.mobile}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-[200px] truncate">{c.address || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${c.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/fpayment/customers/${c._id}/edit`)} className="text-gray-400 hover:text-gold p-1"><FiEdit2 size={14} /></button>
                        <button onClick={(e) => handleDelete(e, c._id)} className="text-gray-400 hover:text-red-500 p-1"><FiTrash2 size={14} /></button>
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

export default FPaymentCustomers;
