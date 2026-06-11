import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiArrowRight, FiDownload } from 'react-icons/fi';
import teamService from '../services/teamService';
import chitService from '../services/chitService';

const STATUSES = ['planning', 'filling', 'active', 'ongoing', 'completed'];
const EMPTY = { teamName: '', teamCode: '', chitScheme: '', startDate: '', endDate: '', status: 'planning', memberLimit: 30 };

const STATUS_STYLE = {
  ongoing: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  filling: 'bg-yellow-100 text-yellow-700',
  planning: 'bg-gray-100 text-gray-600',
  completed: 'bg-purple-100 text-purple-700',
};

const Teams = () => {
  const { schemeId } = useParams();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [scheme, setScheme] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [t, c] = await Promise.all([
      teamService.getAll(schemeId).catch(() => []),
      chitService.getAll().catch(() => []),
    ]);
    setTeams(t);
    setSchemes(c);
    if (schemeId) setScheme(c.find(s => s._id === schemeId) || null);
    setLoading(false);
  };
  useEffect(() => { load(); }, [schemeId]);

  const openCreate = () => { setEditing(null); setForm({...EMPTY, chitScheme: schemeId || (schemes[0]?._id || '')}); setModal(true); };
  const openEdit = (t) => {
    setEditing(t._id);
    setForm({ teamName: t.teamName, teamCode: t.teamCode, chitScheme: t.chitScheme?._id || t.chitScheme, startDate: t.startDate?.slice(0,10) || '', endDate: t.endDate?.slice(0,10) || '', status: t.status, memberLimit: t.memberLimit });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.teamName || !form.teamCode || !form.chitScheme || !form.startDate) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      if (editing) { await teamService.update(editing, form); toast.success('Updated'); }
      else { await teamService.create(form); toast.success('Created'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this team?')) return;
    try { await teamService.remove(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const totalMembers = teams.reduce((s, t) => s + (t.currentMembers || 0), 0);
  const totalLimit = teams.reduce((s, t) => s + (t.memberLimit || 0), 0);
  const totalFund = scheme ? (scheme.amount / 100000) * teams.length : 0;

  return (
    <div>
      {/* Breadcrumb */}
      {scheme && (
        <div className="text-xs text-gray-400 mb-1">
          <button onClick={() => navigate('/chit-schemes')} className="hover:text-gold">Schemes</button>
          <span className="mx-1">/</span>
          <span className="text-gray-600">₹{(scheme.amount/100000).toFixed(0)} Lakh Chit Scheme</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{scheme ? `₹${(scheme.amount/100000).toFixed(0)} Lakh Chit Scheme` : 'All Teams'}</h2>
          {scheme && <p className="text-sm text-gold">Manage and monitor teams under the high-value institutional chit program.</p>}
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <FiDownload size={14} /> Export Data
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover">
            <FiPlus size={14} /> Create New Team
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Teams', value: teams.length },
          { label: 'Active Members', value: totalMembers },
          { label: 'Total Fund Value', value: `₹${totalFund.toFixed(1)} L` },
          { label: 'Overall Collection', value: `${teams.length ? Math.round(teams.reduce((s, t) => s + (t.collectionPercentage || 0), 0) / teams.length) : 0}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-3xl font-bold text-gray-800">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Teams Grid */}
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-3">No teams yet.</p>
          <button onClick={openCreate} className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold">Create First Team</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {teams.map(t => (
            <div key={t._id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
              <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                <FiUsers size={40} className="text-gray-300" />
                <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${STATUS_STYLE[t.status] || STATUS_STYLE.planning}`}>
                  {t.status}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-bold text-gray-800">{t.teamName}</h3>
                    <p className="text-xs text-gray-400">ID: {t.teamCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{t.collectionPercentage || 0}%</p>
                    <p className="text-[10px] text-gray-400 uppercase">Collected</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-3 mb-4">
                  <div><p className="text-gray-400 uppercase text-[10px] font-semibold">Period</p><p className="text-gray-700 font-medium">{t.startDate ? new Date(t.startDate).toLocaleDateString('en-IN', {month:'short', year:'numeric'}) : '—'}</p></div>
                  <div><p className="text-gray-400 uppercase text-[10px] font-semibold">Members</p><p className="text-gray-700 font-medium">{t.currentMembers || 0} / {t.memberLimit} {t.currentMembers >= t.memberLimit ? 'Full' : 'Active'}</p></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/teams/${t._id}`)} className="flex-1 py-2 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold-hover">
                    View Members
                  </button>
                  <button onClick={() => openEdit(t)} className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gold hover:border-gold"><FiEdit2 size={14} /></button>
                  <button onClick={() => handleDelete(t._id)} className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200"><FiTrash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Edit Team' : 'Create New Team'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Team Name *</label>
                <input value={form.teamName} onChange={e => setForm({...form, teamName: e.target.value})} placeholder="Team Alpha-01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Team Code *</label>
                  <input value={form.teamCode} onChange={e => setForm({...form, teamCode: e.target.value})} placeholder="BCF-10L-001" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Member Limit</label>
                  <input type="number" value={form.memberLimit} onChange={e => setForm({...form, memberLimit: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Chit Scheme *</label>
                <select value={form.chitScheme} onChange={e => setForm({...form, chitScheme: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  <option value="">Select scheme</option>
                  {schemes.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
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

export default Teams;
