import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import paymentService from '../services/paymentService';
import memberService from '../services/memberService';
import teamService from '../services/teamService';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ member: '', team: '', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'paid' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, m, t] = await Promise.all([
      paymentService.getAll({}).catch(() => []),
      memberService.getAll().catch(() => []),
      teamService.getAll().catch(() => []),
    ]);
    setPayments(p); setMembers(m); setTeams(t); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.member || !form.amount) return toast.error('Member and amount are required');
    setSaving(true);
    try {
      await paymentService.create(form);
      toast.success('Payment recorded');
      setModal(false); load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const filtered = payments.filter(p => {
    const name = p.member?.fullName || '';
    const mobile = p.member?.mobile || '';
    return name.toLowerCase().includes(search.toLowerCase()) || mobile.includes(search);
  });

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalDue = payments.filter(p => p.status === 'due').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payments</h2>
          <p className="text-sm text-gray-500">Track and record all payment transactions</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover">
          <FiPlus size={14} /> Record Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Transactions</p>
          <p className="text-3xl font-bold text-gray-800">{payments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Collected</p>
          <p className="text-3xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Due</p>
          <p className="text-3xl font-bold text-red-500">₹{totalDue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by member name..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold" />
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400">{search ? 'No results found.' : 'No payment records yet.'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Member', 'Team', 'Month / Year', 'Amount', 'Paid Date', 'Transaction ID', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800 text-sm">{p.member?.fullName || '—'}</p>
                      <p className="text-xs text-gray-400">{p.member?.mobile}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.team?.teamName || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">₹{p.amount?.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : <span className="italic text-gray-300">—</span>}</td>
                    <td className="px-5 py-4 text-xs text-gray-500 font-mono">{p.transactionId || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${p.status === 'paid' ? 'bg-green-100 text-green-600' : p.status === 'due' ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Record Payment Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Record Payment</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Member *</label>
                <select value={form.member} onChange={e => setForm({...form, member: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  <option value="">Select member</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.fullName} — {m.mobile}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Team</label>
                <select value={form.team} onChange={e => setForm({...form, team: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  <option value="">Select team</option>
                  {teams.map(t => <option key={t._id} value={t._id}>{t.teamName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Month</label>
                  <select value={form.month} onChange={e => setForm({...form, month: Number(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                    {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Year</label>
                  <input type="number" value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  <option value="paid">Paid</option>
                  <option value="due">Due</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover disabled:opacity-50">
                  {saving ? 'Saving...' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
