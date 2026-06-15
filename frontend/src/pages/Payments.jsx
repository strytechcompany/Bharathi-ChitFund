import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiPlus, FiX, FiUser, FiArrowLeft } from 'react-icons/fi';
import paymentService from '../services/paymentService';
import memberService from '../services/memberService';
import teamService from '../services/teamService';
import chitService from '../services/chitService';
import customerService from '../services/customerService';
import PaymentTracker from '../components/PaymentTracker';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const EMPTY_FORM = {
  chitScheme: '',
  team: '',
  member: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  status: 'paid',
};

const getCalendarWeeks = (team) => {
  if (!team?.startDate) return [];
  const start = new Date(team.startDate);
  start.setHours(0,0,0,0);
  const end = team.endDate ? new Date(team.endDate) : new Date(new Date(team.startDate).setMonth(start.getMonth() + (team.chitScheme?.durationMonths || 24)));
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

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('standard'); // 'standard' or 'search'

  // Standard Entry Dropdown state
  const [schemes, setSchemes] = useState([]);
  const [schemeTeams, setSchemeTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMemberObj, setSelectedMemberObj] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Search User Flow state
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerMembers, setCustomerMembers] = useState([]); // Memberships of the customer
  const [loadingCustomerMembers, setLoadingCustomerMembers] = useState(false);
  
  // Payment Tracker state (when a specific team is clicked)
  const [activeTrackerMember, setActiveTrackerMember] = useState(null);
  const [memberPayments, setMemberPayments] = useState([]);
  const [calendarWeeks, setCalendarWeeks] = useState([]);
  const [teamMonths, setTeamMonths] = useState([]);

  const load = async () => {
    setLoading(true);
    const p = await paymentService.getAll({}).catch(() => []);
    setPayments(p);
    setLoading(false);
  };

  useEffect(() => {
    load();
    chitService.getAll().then(setSchemes).catch(() => []);
    customerService.getAll().then(setCustomers).catch(() => []);
  }, []);

  const handleSchemeChange = async (schemeId) => {
    setForm({ ...EMPTY_FORM, chitScheme: schemeId });
    setSchemeTeams([]);
    setTeamMembers([]);
    setSelectedTeam(null);
    setSelectedMemberObj(null);
    if (!schemeId) return;
    setLoadingTeams(true);
    const teams = await teamService.getAll(schemeId).catch(() => []);
    setSchemeTeams(teams);
    setLoadingTeams(false);
  };

  const handleTeamChange = async (teamId) => {
    setForm(prev => ({ ...prev, team: teamId, member: '' }));
    setTeamMembers([]);
    setSelectedMemberObj(null);
    if (!teamId) { setSelectedTeam(null); return; }
    setSelectedTeam(schemeTeams.find(t => t._id === teamId) || null);
    setLoadingMembers(true);
    const members = await memberService.getAll(teamId).catch(() => []);
    setTeamMembers(members);
    setLoadingMembers(false);
  };

  const handleMemberChange = async (memberId) => {
    setForm(prev => ({ ...prev, member: memberId }));
    if (!memberId) { setSelectedMemberObj(null); return; }
    const memberObj = teamMembers.find(m => m._id === memberId) || null;
    setSelectedMemberObj(memberObj);

    if (memberObj && selectedTeam?.startDate) {
      const existing = await paymentService.getAll({ member: memberId }).catch(() => []);
      const now = new Date();
      const missed = [];
      const d = new Date(new Date(selectedTeam.startDate).getFullYear(), new Date(selectedTeam.startDate).getMonth(), 1);
      while (d < now) {
        const mo = d.getMonth() + 1;
        const yr = d.getFullYear();
        if (!existing.find(p => p.month === mo && p.year === yr && p.status === 'paid')) {
          missed.push(`${MONTHS[mo - 1]} ${yr}`);
        }
        d.setMonth(d.getMonth() + 1);
      }
      if (missed.length > 0) {
        toast.warning(
          `${memberObj.fullName} has ${missed.length} missed payment${missed.length > 1 ? 's' : ''}: ${missed.slice(0, 3).join(', ')}${missed.length > 3 ? ` +${missed.length - 3} more` : ''}`,
          { position: 'top-right', autoClose: 6000 }
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.member || !form.team) return toast.error('Select scheme, team and member');
    setSaving(true);
    try {
      await paymentService.create({
        member: form.member,
        team: form.team,
        amount: selectedMemberObj?.monthlyPadi || 0,
        month: form.month,
        year: form.year,
        status: form.status,
      });
      toast.success('Payment recorded successfully');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally { setSaving(false); }
  };

  const openModal = () => {
    setForm(EMPTY_FORM);
    setSchemeTeams([]);
    setTeamMembers([]);
    setSelectedTeam(null);
    setSelectedMemberObj(null);
    setSelectedCustomer(null);
    setActiveTrackerMember(null);
    setModal(true);
  };

  const handleCustomerSelect = async (cust) => {
    setSelectedCustomer(cust);
    setLoadingCustomerMembers(true);
    try {
      const members = await memberService.getByMobile(cust.mobile);
      if (!members || members.length === 0) {
        setCustomerMembers([]);
        return;
      }

      const memberships = [];
      members.forEach(m => {
        if (m.team) {
          memberships.push({
            scheme: m.team.chitScheme || { name: 'Unknown Scheme' },
            team: m.team,
            member: m,
            payments: [] // Will fetch when tracker opens
          });
        }
      });
      setCustomerMembers(memberships);
    } catch (err) {
      toast.error('Failed to load customer teams');
    } finally {
      setLoadingCustomerMembers(false);
    }
  };

  const openTracker = async (membership) => {
    setActiveTrackerMember(membership);
    const m = membership.member;
    const t = membership.team;
    
    setTeamMonths(getTeamMonths(t));
    setCalendarWeeks(getCalendarWeeks(t));
    
    // Fetch payments just to be sure
    const p = await paymentService.getAll({ member: m._id, team: t._id }).catch(() => []);
    setMemberPayments(p);
  };

  const filtered = payments.filter(p => {
    const name = p.member?.fullName || '';
    const mobile = p.member?.mobile || '';
    return name.toLowerCase().includes(search.toLowerCase()) || mobile.includes(search);
  });

  const searchedCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.mobile.includes(customerSearch)
  );

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
  const totalDue = payments.filter(p => p.status === 'due').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payments</h2>
          <p className="text-sm text-gray-500">Track and record all payment transactions</p>
        </div>
        <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover">
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
                  {['Member', 'Team', 'Payment Mode', 'Month / Year', 'Amount', 'Paid Date', 'Status'].map(h => (
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
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold capitalize">
                        {p.member?.paymentFrequency || 'monthly'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {MONTHS[p.month - 1]} {p.year}
                      {p.week ? ` (Wk ${p.week})` : ''}
                      {p.day ? ` (Day ${p.day})` : ''}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">₹{p.amount?.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : <span className="italic text-gray-300">—</span>}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${p.status === 'paid' ? 'bg-green-100 text-green-600' : p.status === 'due' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600'}`}>{p.status}</span>
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
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-gray-800">Record Payment</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            
            {!activeTrackerMember ? (
              <>
                <div className="flex border-b border-gray-100 shrink-0">
                  <button 
                    onClick={() => setTab('standard')}
                    className={`flex-1 py-3 text-sm font-bold text-center border-b-2 ${tab === 'standard' ? 'border-gold text-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    Standard Entry
                  </button>
                  <button 
                    onClick={() => setTab('search')}
                    className={`flex-1 py-3 text-sm font-bold text-center border-b-2 ${tab === 'search' ? 'border-gold text-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    Search Member
                  </button>
                </div>

                {tab === 'standard' && (
                  <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                    {/* Step 1: Chit Scheme */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Chit Scheme *</label>
                      <select
                        value={form.chitScheme}
                        onChange={e => handleSchemeChange(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
                      >
                        <option value="">Select chit scheme</option>
                        {schemes.map(s => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Step 2: Team (filtered by scheme) */}
                    {form.chitScheme && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Team *</label>
                        <select
                          value={form.team}
                          onChange={e => handleTeamChange(e.target.value)}
                          disabled={loadingTeams}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold disabled:opacity-60"
                        >
                          <option value="">{loadingTeams ? 'Loading teams...' : 'Select team'}</option>
                          {schemeTeams.map(t => (
                            <option key={t._id} value={t._id}>{t.teamName}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Step 3: Member (filtered by team) */}
                    {form.team && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Member *</label>
                        <select
                          value={form.member}
                          onChange={e => handleMemberChange(e.target.value)}
                          disabled={loadingMembers}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold disabled:opacity-60"
                        >
                          <option value="">{loadingMembers ? 'Loading members...' : 'Select member'}</option>
                          {teamMembers.map(m => (
                            <option key={m._id} value={m._id}>{m.fullName} — {m.mobile}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Step 4: Member info card */}
                    {selectedMemberObj && (
                      <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                          <FiUser size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm">{selectedMemberObj.fullName}</p>
                          <p className="text-xs text-gray-500">{selectedMemberObj.mobile}</p>
                          <div className="mt-2">
                            <p className="text-[10px] text-gray-400 uppercase font-semibold">Monthly Amount</p>
                            <p className="text-sm font-bold text-gold">₹{Number(selectedMemberObj.monthlyPadi || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Month + Year */}
                    {form.member && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Month</label>
                          <select
                            value={form.month}
                            onChange={e => setForm({...form, month: Number(e.target.value)})}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
                          >
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Year</label>
                          <input
                            type="number"
                            value={form.year}
                            onChange={e => setForm({...form, year: Number(e.target.value)})}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                      <button
                        type="submit"
                        disabled={saving || !form.member}
                        className="flex-1 py-2.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Record'}
                      </button>
                    </div>
                  </form>
                )}

                {tab === 'search' && (
                  <div className="p-5 overflow-y-auto flex-1 flex flex-col min-h-0">
                    {!selectedCustomer ? (
                      <>
                        <div className="relative mb-4 shrink-0">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input 
                            autoFocus
                            value={customerSearch} 
                            onChange={e => setCustomerSearch(e.target.value)} 
                            placeholder="Search by name or mobile..." 
                            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold shadow-sm" 
                          />
                        </div>
                        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                          {searchedCustomers.map(c => (
                            <button
                              key={c._id}
                              onClick={() => handleCustomerSelect(c)}
                              className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-gold hover:shadow-md transition-all bg-white flex items-center justify-between group"
                            >
                              <div>
                                <p className="font-bold text-gray-800">{c.fullName}</p>
                                <p className="text-xs text-gray-500 mt-1">{c.mobile}</p>
                              </div>
                              <span className="text-xs font-bold text-gold opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                            </button>
                          ))}
                          {searchedCustomers.length === 0 && customerSearch && (
                            <p className="text-center text-gray-400 py-8 text-sm">No customers found matching "{customerSearch}"</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col h-full">
                        <button 
                          onClick={() => setSelectedCustomer(null)}
                          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 mb-4 shrink-0 w-fit"
                        >
                          <FiArrowLeft size={14} /> Back to Search
                        </button>
                        
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 shrink-0 border border-gray-100">
                          <p className="font-bold text-lg text-gray-800">{selectedCustomer.fullName}</p>
                          <p className="text-sm text-gray-500">{selectedCustomer.mobile}</p>
                        </div>
                        
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 shrink-0">Select Team to Record Payment</p>
                        
                        <div className="space-y-3 overflow-y-auto pr-1">
                          {loadingCustomerMembers ? (
                            <p className="text-center text-gray-400 py-8 text-sm">Loading teams...</p>
                          ) : customerMembers.length === 0 ? (
                            <p className="text-center text-gray-400 py-8 text-sm">This customer is not part of any teams.</p>
                          ) : (
                            customerMembers.map((mship, i) => (
                              <button
                                key={i}
                                onClick={() => openTracker(mship)}
                                className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-gold hover:shadow-md transition-all bg-white"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-bold text-gray-800">{mship.team.teamName}</p>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold capitalize">{mship.member.paymentFrequency || 'monthly'} Pay</span>
                                </div>
                                <p className="text-xs text-gray-500">{mship.scheme.name}</p>
                                <p className="text-xs font-semibold text-gold mt-2">₹{mship.member.monthlyPadi} / {mship.member.paymentFrequency || 'month'}</p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-5 flex flex-col overflow-hidden min-h-0">
                <button 
                  onClick={() => setActiveTrackerMember(null)}
                  className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 mb-4 shrink-0 w-fit"
                >
                  <FiArrowLeft size={14} /> Back to Teams
                </button>
                
                <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 mb-4 shrink-0 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{activeTrackerMember.team.teamName}</p>
                    <p className="text-xs text-gray-500">{activeTrackerMember.scheme.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Amount</p>
                    <p className="text-sm font-bold text-gold">₹{activeTrackerMember.member.monthlyPadi}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <PaymentTracker 
                    member={activeTrackerMember.member}
                    team={activeTrackerMember.team}
                    calendarWeeks={calendarWeeks}
                    teamMonths={teamMonths}
                    memberPayments={memberPayments}
                    onPaymentChange={async () => {
                      const p = await paymentService.getAll({ member: activeTrackerMember.member._id, team: activeTrackerMember.team._id }).catch(() => []);
                      setMemberPayments(p);
                      load();
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
