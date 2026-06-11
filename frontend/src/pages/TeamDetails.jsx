import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp, FiSearch, FiBell, FiDownload, FiX } from 'react-icons/fi';
import teamService from '../services/teamService';
import memberService from '../services/memberService';
import paymentService from '../services/paymentService';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MEMBER_EMPTY = { fullName: '', mobile: '', address: '', aadhaarNumber: '', joiningDate: '', chitAmount: '', monthlyPadi: '', totalMonths: '20', notes: '', isPremium: false };

const TeamDetails = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [memberPayments, setMemberPayments] = useState({});
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(MEMBER_EMPTY);
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'paid' });

  const load = async () => {
    setLoading(true);
    const [t, m] = await Promise.all([
      teamService.getOne(teamId).catch(() => null),
      memberService.getAll(teamId).catch(() => []),
    ]);
    setTeam(t); setMembers(m); setLoading(false);
  };
  useEffect(() => { load(); }, [teamId]);

  const toggleExpand = async (memberId) => {
    if (expanded === memberId) { setExpanded(null); return; }
    setExpanded(memberId);
    if (!memberPayments[memberId]) {
      const payments = await paymentService.getAll({ member: memberId }).catch(() => []);
      setMemberPayments(prev => ({ ...prev, [memberId]: payments }));
    }
  };

  const openCreate = () => { setEditing(null); setForm({ ...MEMBER_EMPTY, chitAmount: team?.chitScheme?.monthlyAmount || '', monthlyPadi: team?.chitScheme?.monthlyAmount || '' }); setModal(true); };
  const openEdit = (m) => {
    setEditing(m._id);
    setForm({ fullName: m.fullName, mobile: m.mobile, address: m.address || '', aadhaarNumber: m.aadhaarNumber || '', joiningDate: m.joiningDate?.slice(0,10) || '', chitAmount: m.chitAmount, monthlyPadi: m.monthlyPadi, totalMonths: m.totalMonths, notes: m.notes || '', isPremium: m.isPremium || false });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile) return toast.error('Full name and mobile are required');
    setSaving(true);
    try {
      if (editing) { await memberService.update(editing, form); toast.success('Member updated'); }
      else { await memberService.create({ ...form, team: teamId }); toast.success('Member added'); }
      setModal(false); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this member?')) return;
    try { await memberService.remove(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payForm.amount) return toast.error('Enter payment amount');
    try {
      await paymentService.create({ ...payForm, member: payModal, team: teamId });
      setMemberPayments(prev => ({ ...prev, [payModal]: null }));
      const payments = await paymentService.getAll({ member: payModal });
      setMemberPayments(prev => ({ ...prev, [payModal]: payments }));
      setPayModal(null);
      toast.success('Payment recorded');
    } catch { toast.error('Failed to record payment'); }
  };

  const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const filtered = members.filter(m => m.fullName.toLowerCase().includes(search.toLowerCase()) || m.mobile.includes(search));

  const now = new Date();
  const monthsCompleted = team?.startDate ? Math.min(Math.floor((now - new Date(team.startDate)) / (30 * 24 * 3600 * 1000)), team.chitScheme?.durationMonths || 24) : 0;

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!team) return <div className="text-center py-12 text-red-400">Team not found</div>;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        <button onClick={() => navigate('/teams')} className="hover:text-gold">Teams</button>
        <span>/</span><button onClick={() => navigate(-1)} className="hover:text-gold">Team List</button>
        <span>/</span><span className="text-gray-600">{team.teamName} Details</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{team.teamName} Details</h2>

      {/* Top Info Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-5 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Current Active Scheme</p>
            <p className="text-xl font-bold text-gray-800">₹{team.chitScheme?.amount ? (team.chitScheme.amount/100000).toFixed(0) : '—'} Lakh Premium Chit</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-gold/10 text-gold font-semibold px-2 py-0.5 rounded">{team.teamCode}</span>
              {team.startDate && <span className="text-xs text-gray-400">{new Date(team.startDate).toLocaleDateString('en-IN', {month:'short', year:'numeric'})}</span>}
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Total Members</p>
            <p className="text-4xl font-bold text-gray-800">{members.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Months Completed</p>
            <p className="text-4xl font-bold text-gray-800">{String(monthsCompleted).padStart(2,'0')}<span className="text-lg text-gray-400">/{team.chitScheme?.durationMonths || 24}</span></p>
          </div>
        </div>
        <div className="bg-[#5C4A00] text-white rounded-xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs text-gold uppercase font-semibold mb-1">Next Collection Target</p>
            <p className="text-3xl font-bold">₹{team.chitScheme?.monthlyAmount?.toLocaleString() || '—'}</p>
            <p className="text-xs text-gold/70 mt-2">Due Date: 15th of this month</p>
          </div>
          <button className="mt-3 w-full py-2 bg-white text-[#5C4A00] text-xs font-bold rounded-lg hover:bg-gold/10 flex items-center justify-center gap-2">
            <FiBell size={12} /> Send Reminders
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Team Members</h3>
            <p className="text-xs text-gray-400">Manage individual member collections and profile data.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member..." className="pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold w-48" />
            </div>
            <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold-hover">
              <FiPlus size={12} /> Add Member
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No members yet. Click "Add Member" to get started.</div>
        ) : (
          filtered.map(m => {
            const isExp = expanded === m._id;
            const payments = memberPayments[m._id] || [];
            const lastPayment = payments[0];
            const currentStatus = lastPayment?.status === 'paid' ? `Paid (${MONTHS[lastPayment.month - 1]})` : `Due (${MONTHS[new Date().getMonth()]})`;

            return (
              <div key={m._id} className="border-b border-gray-100 last:border-0">
                <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(m._id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold flex-shrink-0">
                      {initials(m.fullName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{m.fullName}</p>
                        {m.isPremium && <span className="text-[9px] bg-gold text-white font-bold px-1.5 py-0.5 rounded uppercase">Premium</span>}
                      </div>
                      <p className="text-xs text-gray-400">{m.mobile}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-semibold">Current Status</p>
                      <p className={`text-sm font-semibold ${lastPayment?.status === 'paid' ? 'text-green-600' : 'text-red-500'}`}>{currentStatus}</p>
                    </div>
                    {isExp ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isExp && (
                  <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-5 mt-4">
                      {/* Personal Details */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><FiPlus size={12} className="opacity-0" />Personal Details</p>
                        <div className="space-y-2 text-sm">
                          <div><p className="text-xs text-gray-400">Full Legal Name</p><p className="font-medium text-gray-800">{m.fullName}</p></div>
                          <div><p className="text-xs text-gray-400">Mobile Number</p><p className="font-medium text-gray-800">{m.mobile}</p></div>
                          {m.address && <div><p className="text-xs text-gray-400">Address</p><p className="font-medium text-gray-800">{m.address}</p></div>}
                          {m.aadhaarNumber && <div><p className="text-xs text-gray-400">Aadhaar</p><p className="font-medium text-gray-800">XXXX XXXX {m.aadhaarNumber.slice(-4)}</p></div>}
                          {m.joiningDate && <div><p className="text-xs text-gray-400">Join Date</p><p className="font-medium text-gray-800">{new Date(m.joiningDate).toLocaleDateString('en-IN')}</p></div>}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-white rounded-lg border border-gray-100">
                          <div><p className="text-xs text-gray-400">Chit Amount</p><p className="font-bold text-gray-800">₹{Number(m.chitAmount).toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-400">Monthly Pay</p><p className="font-bold text-gray-800">₹{Number(m.monthlyPadi).toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-400">Total Paid</p><p className="font-bold text-gray-800">₹{(payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)).toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-400">Months Paid</p><p className="font-bold text-gray-800">{payments.filter(p => p.status === 'paid').length} / {m.totalMonths}</p></div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => openEdit(m)} className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white">Edit Member Profile</button>
                          <button onClick={() => handleDelete(m._id)} className="px-3 py-2 border border-red-100 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50"><FiTrash2 size={12} /></button>
                        </div>
                      </div>

                      {/* Payment History */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment History</p>
                          <div className="flex gap-2">
                            <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:bg-white"><FiDownload size={10} /> Excel</button>
                            <button onClick={() => { setPayModal(m._id); setPayForm({ amount: m.monthlyPadi, month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'paid' }); }} className="flex items-center gap-1 text-xs bg-[#5C4A00] text-white px-2 py-1 rounded hover:bg-gold"><FiPlus size={10} /> Record Payment</button>
                          </div>
                        </div>
                        {payments.length === 0 ? (
                          <p className="text-xs text-gray-400 py-4 text-center">No payment records</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead><tr className="border-b border-gray-100">
                              <th className="text-left py-2 text-gray-400 font-semibold">Month</th>
                              <th className="text-right py-2 text-gray-400 font-semibold">Amount</th>
                              <th className="text-right py-2 text-gray-400 font-semibold">Date</th>
                              <th className="text-right py-2 text-gray-400 font-semibold">Status</th>
                            </tr></thead>
                            <tbody>
                              {payments.map(p => (
                                <tr key={p._id} className="border-b border-gray-50">
                                  <td className="py-2 text-gray-700">{MONTHS[p.month - 1]} {p.year}</td>
                                  <td className="py-2 text-right text-gray-700">₹{p.amount?.toLocaleString()}</td>
                                  <td className="py-2 text-right text-gray-500">{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : <span className="italic text-gray-300">Pending</span>}</td>
                                  <td className="py-2 text-right">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${p.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>{p.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Member Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{editing ? 'Edit Member' : 'New Member Registration'}</h3>
                <p className="text-xs text-gold">{team.teamName}</p>
              </div>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Full Name *</label>
                  <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Enter member name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Mobile Number *</label>
                  <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="+91 00000 00000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Full Address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="House no, Street, Landmark, City" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Aadhaar Number</label>
                  <input value={form.aadhaarNumber} onChange={e => setForm({...form, aadhaarNumber: e.target.value})} placeholder="XXXX XXXX XXXX" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Joining Date</label>
                  <input type="date" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Chit Amount (₹)</label>
                  <input type="number" value={form.chitAmount} onChange={e => setForm({...form, chitAmount: e.target.value})} placeholder="5,00,000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Monthly Padi (₹)</label>
                  <input type="number" value={form.monthlyPadi} onChange={e => setForm({...form, monthlyPadi: e.target.value})} placeholder="10,000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Total Months</label>
                <select value={form.totalMonths} onChange={e => setForm({...form, totalMonths: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  {[12,18,20,24,30,36].map(n => <option key={n} value={n}>{n} Months</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPremium" checked={form.isPremium} onChange={e => setForm({...form, isPremium: e.target.checked})} className="accent-gold" />
                <label htmlFor="isPremium" className="text-sm text-gray-600">Premium Member</label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Description / Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Add any special instructions or member notes..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update Member' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Record Payment</h3>
              <button onClick={() => setPayModal(null)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Amount (₹) *</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Month</label>
                  <select value={payForm.month} onChange={e => setPayForm({...payForm, month: Number(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                    {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Year</label>
                  <input type="number" value={payForm.year} onChange={e => setPayForm({...payForm, year: Number(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Status</label>
                <select value={payForm.status} onChange={e => setPayForm({...payForm, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  <option value="paid">Paid</option>
                  <option value="due">Due</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPayModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetails;
