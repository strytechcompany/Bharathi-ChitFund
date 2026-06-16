import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp, FiSearch, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import teamService from '../services/teamService';
import memberService from '../services/memberService';
import paymentService from '../services/paymentService';
import customerService from '../services/customerService';
import PaymentTracker from '../components/PaymentTracker';
import { syncTeamToLocal, downloadTeamReport } from '../services/dataSyncService';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MEMBER_EMPTY = { fullName: '', mobile: '', address: '', monthlyPadi: '', paymentFrequency: 'monthly', notes: '' };

const TeamDetails = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [memberPayments, setMemberPayments] = useState({});
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(MEMBER_EMPTY);
  const [saving, setSaving] = useState(false);
  const [totalCollection, setTotalCollection] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [fetchingCustomer, setFetchingCustomer] = useState(false);
  const [fetchResults, setFetchResults] = useState([]);

  const loadTotalCollection = async () => {
    const allPay = await paymentService.getAll({ team: teamId }).catch(() => []);
    
    const grouped = {};
    allPay.forEach(p => {
      const mid = typeof p.member === 'object' ? p.member._id : p.member;
      if (!grouped[mid]) grouped[mid] = [];
      grouped[mid].push(p);
    });
    setMemberPayments(grouped);

    setTotalCollection(allPay.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0));
  };

  const load = async () => {
    setLoading(true);
    const [t, m] = await Promise.all([
      teamService.getOne(teamId).catch(() => null),
      memberService.getAll(teamId).catch(() => []),
    ]);
    setTeam(t);
    setMembers(m);
    setLoading(false);
    loadTotalCollection();
  };
  useEffect(() => { load(); }, [teamId]);

  const getTeamMonths = (t) => {
    if (!t?.startDate) return [];
    const months = [];
    const start = new Date(t.startDate);
    const total = Number(t.chitScheme?.durationMonths || 24);
    for (let i = 0; i < total; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
    }
    return months;
  };

  const getCalendarWeeks = (t) => {
    if (!t?.startDate) return [];
    const start = new Date(t.startDate);
    start.setHours(0,0,0,0);
    const end = t.endDate ? new Date(t.endDate) : new Date(new Date(t.startDate).setMonth(start.getMonth() + (t.chitScheme?.durationMonths || 24)));
    end.setHours(23,59,59,999);

    let cur = new Date(start);
    cur.setDate(cur.getDate() - cur.getDay()); // go back to Sunday

    const weeks = [];
    let weekIndex = 1;
    let currentMonthKey = `${start.getFullYear()}-${start.getMonth() + 1}`;

    while (cur <= end) {
      const weekStart = new Date(cur);
      const weekMonthKey = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}`;
      
      if (weekMonthKey !== currentMonthKey) {
        weekIndex = 1;
        currentMonthKey = weekMonthKey;
      }

      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        if (d >= start && d <= end) {
          days.push(d);
        }
      }

      if (days.length > 0) {
        weeks.push({
          monthKey: weekMonthKey,
          weekNum: weekIndex++,
          days: days,
          label: `${days[0].getDate()} ${MONTHS[days[0].getMonth()]} - ${days[days.length-1].getDate()} ${MONTHS[days[days.length-1].getMonth()]}`
        });
      }

      cur.setDate(cur.getDate() + 7);
    }
    return weeks;
  };

  const toggleExpand = async (memberId, frequency) => {
    if (expanded === memberId) { setExpanded(null); return; }
    setExpanded(memberId);
    let payments = memberPayments[memberId];
    if (!payments) {
      payments = await paymentService.getAll({ member: memberId }).catch(() => []);
      setMemberPayments(prev => ({ ...prev, [memberId]: payments }));
    }
    // Notify missed past months for monthly users only
    if (team && frequency === 'monthly') {
      const now = new Date();
      const missed = getTeamMonths(team).filter(({ month, year }) => {
        const monthEnd = new Date(year, month - 1, 28);
        return monthEnd < now && !payments.find(p => p.month === month && p.year === year && p.status === 'paid');
      });
      if (missed.length > 0) {
        toast.warning(`${missed.length} missed payment${missed.length > 1 ? 's' : ''} for this member`, { position: 'top-right', autoClose: 6000 });
      }
    }
  };

  const openCreate = async () => {
    setEditing(null);
    setForm(MEMBER_EMPTY);
    setFetchResults([]);
    setModal(true);
    if (customers.length === 0) {
      const list = await customerService.getAll().catch(() => []);
      setCustomers(list);
    }
  };
  const openEdit = (m) => {
    setEditing(m._id);
    setForm({ fullName: m.fullName, mobile: m.mobile, address: m.address || '', monthlyPadi: m.monthlyPadi, paymentFrequency: m.paymentFrequency || 'monthly', notes: m.notes || '' });
    setModal(true);
  };

  const fetchCustomer = () => {
    if (!form.mobile) return toast.error('Enter a mobile number first');
    const q = form.mobile.trim();
    const matches = customers.filter(c => c.mobile.includes(q));
    if (matches.length === 0) {
      setFetchResults([]);
      toast.warning('No customer found with this mobile number', { position: 'top-right', autoClose: 3000 });
    } else {
      setFetchResults(matches);
    }
  };

  const selectCustomer = (c) => {
    setForm(prev => ({ ...prev, fullName: c.fullName, mobile: c.mobile, address: c.address || '' }));
    setFetchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile) return toast.error('Full name and mobile are required');
    setSaving(true);
    try {
      const schemeData = {
        chitAmount: team.chitScheme?.amount || 0,
        totalMonths: team.chitScheme?.durationMonths || 24,
      };
      if (editing) { await memberService.update(editing, { ...form, ...schemeData }); toast.success('Member updated'); }
      else { await memberService.create({ ...form, ...schemeData, team: teamId }); toast.success('Member added'); }
      setModal(false); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleCompleteTeam = async () => {
    try { 
      await teamService.update(team._id, { status: 'completed' }); 
      toast.success('Team marked as completed');
      
      // Sync and download specific team report
      const teamData = { team, members, memberPayments };
      syncTeamToLocal(teamData);
      downloadTeamReport(teamData);
      
      navigate(`/chit-schemes/${team.chitScheme?._id}/teams`); 
    } catch { 
      toast.error('Failed to mark as completed'); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this member?')) return;
    try { await memberService.remove(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const filtered = members.filter(m => m.fullName.toLowerCase().includes(search.toLowerCase()) || m.mobile.includes(search));

  const now = new Date();
  const monthsCompleted = team?.startDate
    ? Math.min(Math.floor((now - new Date(team.startDate)) / (30 * 24 * 3600 * 1000)), team.chitScheme?.durationMonths || 24)
    : 0;

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!team) return <div className="text-center py-12 text-red-400">Team not found</div>;

  const teamMonths = team ? getTeamMonths(team) : [];
  const calendarWeeks = team ? getCalendarWeeks(team) : [];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        <button onClick={() => navigate('/teams')} className="hover:text-gold">Teams</button>
        <span>/</span>
        <button onClick={() => navigate(-1)} className="hover:text-gold">Team List</button>
        <span>/</span>
        <span className="text-gray-600">{team.teamName} Details</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{team.teamName} Details</h2>
        {team.status !== 'completed' && (
          <button onClick={handleCompleteTeam} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition">
            Mark Team as Completed
          </button>
        )}
      </div>

      {/* Top Info Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Current Active Scheme</p>
            <p className="text-xl font-bold text-gray-800">
              ₹{team.chitScheme?.amount ? (team.chitScheme.amount / 100000).toFixed(0) : '—'} Lakh Premium Chit
            </p>
            <div className="flex items-center gap-2 mt-2">
              {team.startDate && (
                <span className="text-xs text-gray-400">
                  {new Date(team.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Total Members</p>
            <p className="text-4xl font-bold text-gray-800">{members.length}</p>
          </div>
        </div>
        <div className="bg-[#5C4A00] text-white rounded-xl p-5 flex flex-col justify-center">
          <p className="text-xs text-gold uppercase font-semibold mb-1">Total Collection</p>
          <p className="text-3xl font-bold">₹{totalCollection.toLocaleString()}</p>
          <p className="text-xs text-gold/70 mt-2">All payments collected</p>
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
            const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
            
            const paidCount = payments.filter(p => p.status === 'paid').length;
            let fullyPaidMonths = paidCount;
            let fullyPaidDays = 0;
            let fullyPaidWeeks = 0;

            if (m.paymentFrequency === 'daily') {
              fullyPaidDays = paidCount;
              fullyPaidWeeks = Math.floor(paidCount / 7);
              const monthsPaidMap = {};
              payments.filter(p => p.status === 'paid').forEach(p => {
                const k = `${p.year}-${p.month}`;
                monthsPaidMap[k] = (monthsPaidMap[k] || 0) + 1;
              });
              fullyPaidMonths = Object.keys(monthsPaidMap).filter(k => {
                const [year, month] = k.split('-');
                const daysInMonth = new Date(year, month, 0).getDate();
                return monthsPaidMap[k] >= daysInMonth;
              }).length;
            } else if (m.paymentFrequency === 'weekly') {
              fullyPaidWeeks = paidCount;
              fullyPaidDays = fullyPaidWeeks * 7;
              fullyPaidMonths = Math.floor(paidCount / 4); // rough approximation
            } else {
              fullyPaidMonths = paidCount;
              fullyPaidWeeks = fullyPaidMonths * 4;
              fullyPaidDays = fullyPaidMonths * 30;
            }

            return (
              <div key={m._id} className="border-b border-gray-100 last:border-0">
                {/* Member row — name + total paid */}
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(m._id, m.paymentFrequency || 'monthly')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold flex-shrink-0">
                      {initials(m.fullName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{m.fullName}</p>
                        {m.isPremium && (
                          <span className="text-[9px] bg-gold text-white font-bold px-1.5 py-0.5 rounded uppercase">Premium</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{m.mobile}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-semibold">Amount Paid</p>
                      <p className="text-sm font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                    </div>
                    {isExp ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded panel */}
                {isExp && (
                  <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-6 mt-4">

                      {/* Left: Personal Details */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Personal Details</p>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                          <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-400">Full Legal Name</p><p className="font-medium text-gray-800">{m.fullName}</p></div>
                          <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-400">Mobile Number</p><p className="font-medium text-gray-800">{m.mobile}</p></div>
                          
                          {m.address && <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-400">Address</p><p className="font-medium text-gray-800">{m.address}</p></div>}
                          <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-400">Mode of Pay</p><p className="font-medium text-gray-800 capitalize">{m.paymentFrequency || 'monthly'}</p></div>

                          {m.aadhaarNumber && <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-400">Aadhaar</p><p className="font-medium text-gray-800">XXXX XXXX {m.aadhaarNumber.slice(-4)}</p></div>}
                          {m.joiningDate && <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-400">Join Date</p><p className="font-medium text-gray-800">{new Date(m.joiningDate).toLocaleDateString('en-IN')}</p></div>}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-white rounded-lg border border-gray-100">
                          <div><p className="text-xs text-gray-400">Chit Amount</p><p className="font-bold text-gray-800">₹{Number(m.chitAmount).toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-400">{m.paymentFrequency === 'daily' ? 'Daily' : m.paymentFrequency === 'weekly' ? 'Weekly' : 'Monthly'} Pay</p><p className="font-bold text-gray-800">₹{Number(m.monthlyPadi).toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-400">Total Paid</p><p className="font-bold text-gray-800">₹{totalPaid.toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-400">Days Completed</p><p className="font-bold text-gray-800">{fullyPaidDays}</p></div>
                          <div><p className="text-xs text-gray-400">Weeks Completed</p><p className="font-bold text-gray-800">{fullyPaidWeeks}</p></div>
                          <div><p className="text-xs text-gray-400">Months Completed</p><p className="font-bold text-gray-800">{fullyPaidMonths} / {m.totalMonths}</p></div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={e => { e.stopPropagation(); openEdit(m); }}
                            className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white"
                          >
                            Edit Member Profile
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(m._id); }}
                            className="px-3 py-2 border border-red-100 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Right: Monthly Payment Grid */}
                      <div className="md:col-span-1 lg:col-span-1">
                        <PaymentTracker 
                          member={m}
                          team={team}
                          calendarWeeks={calendarWeeks}
                          teamMonths={teamMonths}
                          memberPayments={memberPayments[m._id] || []}
                          onPaymentChange={loadTotalCollection}
                        />
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{editing ? 'Edit Member' : 'Add Member'}</h3>
                <p className="text-xs text-gold">{team.teamName}</p>
              </div>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Mobile + fetch */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Mobile Number *</label>
                <div className="flex gap-2">
                  <input
                    value={form.mobile}
                    onChange={e => { setForm({...form, mobile: e.target.value}); setFetchResults([]); }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), fetchCustomer())}
                    placeholder="Enter mobile number"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={fetchCustomer}
                    disabled={fetchingCustomer}
                    className="px-4 py-2 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold-hover disabled:opacity-50 whitespace-nowrap"
                  >
                    {fetchingCustomer ? '...' : 'Fetch →'}
                  </button>
                </div>

                {/* Results list */}
                {fetchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100">
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{fetchResults.length} result{fetchResults.length > 1 ? 's' : ''} found — click to select</p>
                    </div>
                    {fetchResults.map(c => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gold/5 border-b border-gray-50 last:border-0 text-left transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[10px] font-bold flex-shrink-0">
                          {c.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{c.fullName}</p>
                          <p className="text-xs text-gray-400 truncate">{c.mobile}{c.address ? ` · ${c.address}` : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Full Name *</label>
                <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Member name (auto-filled after fetch)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Member Address" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>

              {/* Scheme info (readonly) */}
              {team.chitScheme && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Chit Amount</p>
                    <p className="text-sm font-bold text-gray-700">₹{Number(team.chitScheme.amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Months</p>
                    <p className="text-sm font-bold text-gray-700">{team.chitScheme.durationMonths || 24} months</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Payment Frequency *</label>
                <select value={form.paymentFrequency || 'monthly'} onChange={e => setForm({...form, paymentFrequency: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                  {form.paymentFrequency === 'daily' ? 'Daily' : form.paymentFrequency === 'weekly' ? 'Weekly' : 'Monthly'} Padi (₹) *
                </label>
                <input type="number" value={form.monthlyPadi} onChange={e => setForm({...form, monthlyPadi: e.target.value})} placeholder={`Enter ${form.paymentFrequency || 'monthly'} amount`} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Any notes..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold resize-none" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetails;
