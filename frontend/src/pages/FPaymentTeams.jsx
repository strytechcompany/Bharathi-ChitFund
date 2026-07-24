import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiDownload, FiSearch } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import fpaymentTeamService from '../services/fpaymentTeamService';
import paymentSchemeService from '../services/paymentSchemeService';

const STATUSES = ['active', 'inactive', 'completed'];
const EMPTY = { teamName: '', memberLimit: 30, schemeId: '', startDate: '', endDate: '', status: 'active' };

const STATUS_STYLE = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  completed: 'bg-purple-100 text-purple-700',
};

const FPaymentTeams = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [t, c] = await Promise.all([
      fpaymentTeamService.getAllTeams().catch(() => []),
      paymentSchemeService.getAll().catch(() => []),
    ]);
    setTeams(t);
    setSchemes(c);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (t) => {
    setEditing(t._id);
    setForm({
      teamName: t.teamName,
      memberLimit: t.memberLimit,
      schemeId: t.schemeId?._id || t.schemeId || '',
      startDate: t.startDate?.slice(0, 10) || '',
      endDate: t.endDate?.slice(0, 10) || '',
      status: t.status,
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.teamName || !form.startDate) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      const scheme = schemes.find(s => s._id === form.schemeId);
      const payload = { ...form, schemeName: scheme?.name || '' };
      if (!payload.schemeId) delete payload.schemeId;
      if (editing) { await fpaymentTeamService.updateTeam(editing, payload); toast.success('Updated'); }
      else { await fpaymentTeamService.createTeam({ ...payload, createdBy: user?.name || user?.username || '' }); toast.success('Created'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this team?')) return;
    try { await fpaymentTeamService.deleteTeam(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const filtered = teams.filter(t => t.teamName.toLowerCase().includes(search.toLowerCase()));
  const totalMembers = teams.reduce((s, t) => s + (t.members?.length || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All FPayment Teams</h2>
          <p className="text-sm text-gray-500">Manage teams for the FPayment module</p>
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
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Teams', value: teams.length },
          { label: 'Active Members', value: totalMembers },
          { label: 'Active Teams', value: teams.filter(t => t.status === 'active').length },
          { label: 'Completed Teams', value: teams.filter(t => t.status === 'completed').length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-3xl font-bold text-gray-800">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-5 max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold" />
      </div>

      {/* Teams Grid */}
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-3">{search ? 'No results found.' : 'No teams yet.'}</p>
          {!search && <button onClick={openCreate} className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold">Create First Team</button>}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-5">
          {filtered.map(t => (
            <div key={t._id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-gray-800">{t.teamName}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${STATUS_STYLE[t.status] || STATUS_STYLE.active}`}>
                  {t.status}
                </span>
              </div>

              <div className="space-y-3 mb-5 flex-grow">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Period</p>
                  <p className="text-sm font-medium text-gray-800">
                    {t.startDate ? new Date(t.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                    {' - '}
                    {t.endDate ? new Date(t.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Members</p>
                  <p className="text-sm font-medium text-gray-800">{t.members?.length || 0} / {t.memberLimit}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => navigate(`/fpayment/teams/${t._id}`)} className="flex-1 py-2 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold-hover">
                  View Members
                </button>
                <button onClick={() => openEdit(t)} className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gold hover:border-gold"><FiEdit2 size={14} /></button>
                <button onClick={() => handleDelete(t._id)} className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200"><FiTrash2 size={14} /></button>
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
                <input value={form.teamName} onChange={e => setForm({ ...form, teamName: e.target.value })} placeholder="Team Alpha-01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Member Limit</label>
                <input type="number" value={form.memberLimit} onChange={e => setForm({ ...form, memberLimit: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">FPayment Scheme</label>
                <select value={form.schemeId} onChange={e => setForm({ ...form, schemeId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  <option value="">Select scheme (optional)</option>
                  {schemes.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
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

export default FPaymentTeams;
