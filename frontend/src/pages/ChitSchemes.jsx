import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiArrowRight } from 'react-icons/fi';
import chitService from '../services/chitService';

const TIERS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
const EMPTY = { name: '', tier: 'BRONZE', amount: '', durationMonths: '', monthlyAmount: '', status: 'active', description: '' };

const ChitSchemes = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => chitService.getAll().then(setSchemes).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (s) => { setEditing(s._id); setForm({ name: s.name, tier: s.tier, amount: s.amount, durationMonths: s.durationMonths, monthlyAmount: s.monthlyAmount, status: s.status, description: s.description || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.durationMonths || !form.monthlyAmount) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      if (editing) { await chitService.update(editing, form); toast.success('Updated'); }
      else { await chitService.create(form); toast.success('Created'); }
      setModal(false);
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this scheme?')) return;
    try { await chitService.remove(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const TIER_COLOR = { BRONZE: 'bg-amber-100 text-amber-700', SILVER: 'bg-slate-100 text-slate-600', GOLD: 'bg-yellow-100 text-yellow-700', PLATINUM: 'bg-gold text-white' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Chit Schemes</h2>
          <p className="text-sm text-gray-500">Manage all chit fund schemes</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover">
          <FiPlus size={14} /> Create Scheme
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        schemes.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 mb-3">No chit schemes yet.</p>
            <button onClick={openCreate} className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold">Create First Scheme</button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {schemes.map(s => (
              <div key={s._id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${TIER_COLOR[s.tier] || TIER_COLOR.BRONZE}`}>{s.tier} TIER</span>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-gold"><FiEdit2 size={14} /></button>
                    <button onClick={() => handleDelete(s._id)} className="text-gray-400 hover:text-red-500"><FiTrash2 size={14} /></button>
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
                  <button onClick={() => navigate(`/chit-schemes/${s._id}/teams`)} className="flex items-center gap-1 text-gold text-xs font-semibold hover:underline">
                    View Teams <FiArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Edit Scheme' : 'New Chit Scheme'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Scheme Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. ₹10 Lakh Chit Scheme" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Tier</label>
                  <select value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                    {TIERS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                    <option>active</option><option>inactive</option><option>completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Chit Amount (₹) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="1000000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Monthly Amount (₹) *</label>
                  <input type="number" value={form.monthlyAmount} onChange={e => setForm({...form, monthlyAmount: e.target.value})} placeholder="41667" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
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

export default ChitSchemes;
