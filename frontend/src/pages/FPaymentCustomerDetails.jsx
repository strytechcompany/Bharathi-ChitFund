import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import fpaymentCustomerService from '../services/fpaymentCustomerService';

const TXN_EMPTY = { amount: '', description: '' };

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const FPaymentCustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(TXN_EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => fpaymentCustomerService.getOne(id).then(setCustomer).catch(() => toast.error('Failed to load customer')).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this customer?')) return;
    try {
      await fpaymentCustomerService.remove(id);
      toast.success('Deleted');
      navigate('/fpayment/customers');
    } catch {
      toast.error('Delete failed');
    }
  };

  const openAddTransaction = () => { setForm(TXN_EMPTY); setModal(true); };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');
    setSaving(true);
    try {
      await fpaymentCustomerService.addTransaction(id, form);
      toast.success('Transaction added');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>;
  if (!customer) return <div className="text-center py-16 text-red-400">Customer not found</div>;

  const transactions = [...(customer.transactions || [])].sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
  const paymentHistory = transactions.filter(t => t.status === 'paid');
  const totalPaid = paymentHistory.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/fpayment/customers')} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gold hover:border-gold transition-colors">
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{customer.fullName}</h2>
            <p className="text-sm text-gray-400">FPayment Customer Profile</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/fpayment/customers/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <FiEdit2 size={14} /> Edit
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-100 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50">
            <FiTrash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center text-gold text-lg font-bold flex-shrink-0">
          {initials(customer.fullName)}
        </div>
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Mobile</p>
            <p className="text-sm font-semibold text-gray-800">{customer.mobile}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Address</p>
            <p className="text-sm text-gray-700">{customer.address || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Status</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${customer.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
              {customer.status}
            </span>
          </div>
          {customer.email && (
            <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Email</p><p className="text-sm text-gray-700">{customer.email}</p></div>
          )}
          {customer.aadhaarNumber && (
            <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Aadhaar</p><p className="text-sm text-gray-700">XXXX XXXX {customer.aadhaarNumber.slice(-4)}</p></div>
          )}
          {customer.notes && (
            <div className="col-span-3">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Notes</p>
              <p className="text-sm text-gray-600">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Independent FPayment Data */}
      <div className="bg-white rounded-xl border border-gray-100 mb-6">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">FPayment Data</h3>
            <p className="text-xs text-gray-400">Independent transaction history for this customer · Total Paid ₹{totalPaid.toLocaleString()}</p>
          </div>
          <button onClick={openAddTransaction} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold-hover">
            <FiPlus size={12} /> Add Transaction
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No FPayment transactions yet for this customer.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Date', 'Amount', 'Description', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 text-sm text-gray-600">{formatDate(t.transactionDate)}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-800">{formatCurrency(t.amount)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{t.description || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${t.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Payment History</h3>
          <p className="text-xs text-gray-400">All completed payments for {customer.fullName}, newest first.</p>
        </div>

        {paymentHistory.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No completed payments yet for this customer.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Date', 'Paid Amount', 'Description'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map(t => (
                <tr key={t._id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 text-sm text-gray-600">{formatDate(t.transactionDate)}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-green-600">{formatCurrency(t.amount)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{t.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Transaction Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Add Transaction</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleAddTransaction} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="1000" className="no-spinner w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Notes (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPaymentCustomerDetails;
