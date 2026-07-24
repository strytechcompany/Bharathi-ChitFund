import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiArrowRight, FiUsers, FiUser, FiCreditCard, FiSquare, FiCheckSquare, FiMoreVertical, FiCheckCircle } from 'react-icons/fi';
import paymentSchemeService from '../services/paymentSchemeService';

const EMPTY = { name: '', amount: '', durationMonths: '', status: 'active', description: '' };
const HIDDEN_KEY = 'fpayment_hidden_schemes';

const TIER_COLOR = { BRONZE: 'bg-amber-100 text-amber-700', SILVER: 'bg-slate-100 text-slate-600', GOLD: 'bg-yellow-100 text-yellow-700', PLATINUM: 'bg-gold text-white' };

const FPayment = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [hiddenIds, setHiddenIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HIDDEN_KEY)) || []; } catch { return []; }
  });
  const [showHidden, setShowHidden] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const toggleHidden = (id) => {
    setHiddenIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      return next;
    });
  };

  const load = () => paymentSchemeService.getAll().then(setSchemes).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (s) => { setEditing(s._id); setForm({ name: s.name, amount: s.amount, durationMonths: s.durationMonths, status: s.status, description: s.description || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.durationMonths) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      if (editing) { await paymentSchemeService.update(editing, form); toast.success('Updated'); }
      else { await paymentSchemeService.create(form); toast.success('Created'); }
      setModal(false);
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment scheme?')) return;
    try { await paymentSchemeService.remove(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const handleComplete = async (id) => {
    try { await paymentSchemeService.update(id, { status: 'completed' }); toast.success('Scheme marked as completed'); load(); } catch { toast.error('Action failed'); }
  };

  const activeSchemes = schemes.filter(s => s.status !== 'completed');
  const visibleSchemes = activeSchemes.filter(s => !hiddenIds.includes(s._id));
  const hiddenSchemes = activeSchemes.filter(s => hiddenIds.includes(s._id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payment Schemes</h2>
          <p className="text-sm text-gray-500">Manage all FPayment schemes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/fpayment/payments')} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <FiCreditCard size={14} /> Ledger
          </button>
          <button onClick={() => navigate('/fpayment/customers')} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <FiUser size={14} /> Customers
          </button>
          <button onClick={() => navigate('/fpayment/teams')} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <FiUsers size={14} /> Teams
          </button>
          {hiddenSchemes.length > 0 && (
            <button onClick={() => setShowHidden(v => !v)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
              <FiCheckSquare size={14} /> Hidden ({hiddenSchemes.length})
            </button>
          )}
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover">
            <FiPlus size={14} /> Create Payment Scheme
          </button>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        activeSchemes.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 mb-3">No active payment schemes yet.</p>
            <button onClick={openCreate} className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold">Create First Payment Scheme</button>
          </div>
        ) : visibleSchemes.length === 0 && !showHidden ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400">All payment schemes are hidden. Click "Hidden ({hiddenSchemes.length})" above to view them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {(showHidden ? activeSchemes : visibleSchemes).map(s => {
              const isHidden = hiddenIds.includes(s._id);
              const menuOpen = openMenu === s._id;
              return (
                <div key={s._id} className={`relative rounded-xl border p-5 transition-all ${isHidden ? 'bg-gray-50 border-gray-100 opacity-60 hover:opacity-100' : 'bg-white border-gray-100 hover:shadow-md'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${TIER_COLOR[s.tier] || TIER_COLOR.BRONZE}`}>{s.tier} TIER</span>
                    <div className="relative">
                      <button onClick={() => setOpenMenu(menuOpen ? null : s._id)} className="text-gray-400 hover:text-gray-600 p-1"><FiMoreVertical size={16} /></button>
                      {menuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg border border-gray-100 shadow-lg z-20 py-1">
                            <button onClick={() => { toggleHidden(s._id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                              {isHidden ? <FiCheckSquare size={13} /> : <FiSquare size={13} />} {isHidden ? 'Deselect' : 'Select'}
                            </button>
                            <button onClick={() => { openEdit(s); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                              <FiEdit2 size={13} /> Edit
                            </button>
                            <button onClick={() => { handleComplete(s._id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                              <FiCheckCircle size={13} /> Mark Completed
                            </button>
                            <div className="my-1 border-t border-gray-100" />
                            <button onClick={() => { handleDelete(s._id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50">
                              <FiTrash2 size={13} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{s.name}</h3>
                  <p className="text-2xl font-bold text-gray-800 mb-1">₹{Number(s.amount).toLocaleString()}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-3 mb-4">
                    <div><span className="font-medium">Monthly:</span> ₹{Number(s.monthlyAmount).toLocaleString()}</div>
                    <div><span className="font-medium">Duration:</span> {s.durationMonths} months</div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${s.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                    <button onClick={() => navigate('/fpayment/teams')} className="flex items-center gap-1 text-gold text-xs font-semibold hover:underline">
                      View Teams <FiArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Edit Payment Scheme' : 'New Payment Scheme'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Payment Scheme Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. ₹10 Lakh Payment Scheme" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  <option>active</option><option>inactive</option><option>completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Payment Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="1000000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Duration (Months) *</label>
                <input type="number" value={form.durationMonths} onChange={e => setForm({...form, durationMonths: e.target.value})} placeholder="24" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPayment;
