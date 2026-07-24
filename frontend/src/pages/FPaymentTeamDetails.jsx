import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp, FiSearch, FiX } from 'react-icons/fi';
import fpaymentTeamService from '../services/fpaymentTeamService';
import fpaymentService from '../services/fpaymentService';
import fpaymentCustomerService from '../services/fpaymentCustomerService';
import FPaymentTracker from '../components/FPaymentTracker';
import { printFPaymentMemberReceipt } from '../utils/fpaymentPdfReceipt';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MEMBER_EMPTY = { fullName: '', mobile: '', address: '', paymentFrequency: 'monthly', monthlyAmount: '', notes: '' };

const getTeamMonths = (t) => {
  if (!t?.startDate) return [];
  const months = [];
  const start = new Date(t.startDate);
  const total = Number(t.schemeId?.durationMonths || 12);
  for (let i = 0; i < total; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
  }
  return months;
};

const getCalendarWeeks = (t) => {
  if (!t?.startDate) return [];
  const start = new Date(t.startDate);
  start.setHours(0, 0, 0, 0);
  const end = t.endDate ? new Date(t.endDate) : new Date(new Date(t.startDate).setMonth(start.getMonth() + (t.schemeId?.durationMonths || 12)));
  end.setHours(23, 59, 59, 999);

  let cur = new Date(start);
  cur.setDate(cur.getDate() - cur.getDay());

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
      if (d >= start && d <= end) days.push(d);
    }

    if (days.length > 0) {
      weeks.push({
        monthKey: weekMonthKey,
        weekNum: weekIndex++,
        days,
        label: `${days[0].getDate()} ${MONTHS[days[0].getMonth()]} - ${days[days.length - 1].getDate()} ${MONTHS[days[days.length - 1].getMonth()]}`,
      });
    }

    cur.setDate(cur.getDate() + 7);
  }
  return weeks;
};

const FPaymentTeamDetails = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [memberPayments, setMemberPayments] = useState({});
  const [totalCollection, setTotalCollection] = useState(0);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(MEMBER_EMPTY);
  const [saving, setSaving] = useState(false);
  const [fetchingCustomer, setFetchingCustomer] = useState(false);

  const loadPayments = async () => {
    const allPay = await fpaymentService.getAllFPayments({ teamId }).catch(() => []);
    const grouped = {};
    allPay.forEach(p => {
      if (!grouped[p.memberId]) grouped[p.memberId] = [];
      grouped[p.memberId].push(p);
    });
    setMemberPayments(grouped);
    setTotalCollection(allPay.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0));
  };

  const load = async () => {
    setLoading(true);
    const t = await fpaymentTeamService.getTeamById(teamId).catch(() => null);
    setTeam(t);
    setLoading(false);
    loadPayments();
  };
  useEffect(() => { load(); }, [teamId]);

  const toggleExpand = (memberId) => setExpanded(prev => prev === memberId ? null : memberId);

  const openAddMember = () => { setEditing(null); setForm(MEMBER_EMPTY); setModal(true); };
  const openEditMember = (m) => {
    setEditing(m._id);
    setForm({ fullName: m.fullName, mobile: m.mobile, address: m.address || '', paymentFrequency: m.paymentFrequency || 'monthly', monthlyAmount: m.monthlyAmount || '', notes: m.notes || '' });
    setModal(true);
  };

  const fetchCustomer = async () => {
    if (!form.mobile) return toast.error('Enter a mobile number first');
    setFetchingCustomer(true);
    try {
      const c = await fpaymentCustomerService.getByMobile(form.mobile.trim());
      setForm(prev => ({ ...prev, fullName: c.fullName, address: c.address || '', notes: c.notes || prev.notes }));
      toast.success('Customer found');
    } catch {
      toast.warning('Customer not found. Please add the customer first.', { position: 'top-right', autoClose: 4000 });
    } finally {
      setFetchingCustomer(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile) return toast.error('Full name and mobile are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        monthlyAmount: Number(form.monthlyAmount) || 0,
        chitAmount: team.schemeId?.amount || 0,
        totalMonths: team.schemeId?.durationMonths || 0,
      };
      if (editing) { await fpaymentTeamService.updateMember(teamId, editing, payload); toast.success('Member updated'); }
      else { await fpaymentTeamService.addMember(teamId, payload); toast.success('Member added'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await fpaymentTeamService.removeMember(teamId, memberId);
      toast.success('Member removed');
      load();
    } catch {
      toast.error('Remove failed');
    }
  };

  const handlePrintReceipt = (m) => {
    printFPaymentMemberReceipt(m, team, memberPayments[m._id] || []);
  };

  const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!team) return <div className="text-center py-12 text-red-400">Team not found</div>;

  const members = team.members || [];
  const filtered = members.filter(m => m.fullName.toLowerCase().includes(search.toLowerCase()) || (m.mobile || '').includes(search));
  const teamMonths = getTeamMonths(team);
  const calendarWeeks = getCalendarWeeks(team);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        <button onClick={() => navigate('/fpayment/teams')} className="hover:text-gold">FPayment Teams</button>
        <span>/</span>
        <span className="text-gray-600">{team.teamName} Details</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{team.teamName} Details</h2>
      </div>

      {/* Top Info Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Current Scheme</p>
            <p className="text-xl font-bold text-gray-800">{team.schemeName || team.schemeId?.name || '—'}</p>
            {team.startDate && (
              <span className="text-xs text-gray-400">
                {new Date(team.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Total Members</p>
            <p className="text-4xl font-bold text-gray-800">{members.length}</p>
          </div>
        </div>
        <div className="bg-[#5C4A00] text-white rounded-xl p-5 flex flex-col justify-center">
          <p className="text-xs text-gold uppercase font-semibold mb-1">Total Collection</p>
          <p className="text-3xl font-bold">₹{totalCollection.toLocaleString()}</p>
          <p className="text-xs text-gold/70 mt-2">From linked FPayment records</p>
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
            <button onClick={openAddMember} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold-hover">
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
            const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
            const remainingBalance = Math.max(Number(m.chitAmount || 0) - totalPaid, 0);

            const paidCount = payments.filter(p => p.status === 'completed').length;
            let fullyPaidMonths = paidCount;
            let fullyPaidDays = 0;
            let fullyPaidWeeks = 0;

            if (m.paymentFrequency === 'daily') {
              fullyPaidDays = paidCount;
              fullyPaidWeeks = Math.floor(paidCount / 7);
              const monthsPaidMap = {};
              payments.filter(p => p.status === 'completed').forEach(p => {
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
              fullyPaidMonths = Math.floor(paidCount / 4);
            } else {
              fullyPaidMonths = paidCount;
              fullyPaidWeeks = fullyPaidMonths * 4;
              fullyPaidDays = fullyPaidMonths * 30;
            }

            return (
              <div key={m._id} className="border-b border-gray-100 last:border-0">
                {/* Member row */}
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(m._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold flex-shrink-0">
                      {initials(m.fullName)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{m.fullName}</p>
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

                      {/* Left: Personal Details + Summary */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Personal Details</p>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                          <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-400">Full Legal Name</p><p className="font-medium text-gray-800">{m.fullName}</p></div>
                          <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-400">Mobile Number</p><p className="font-medium text-gray-800">{m.mobile}</p></div>
                          {m.address && <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-400">Address</p><p className="font-medium text-gray-800">{m.address}</p></div>}
                          <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-400">Payment Mode</p><p className="font-medium text-gray-800 capitalize">{m.paymentFrequency || 'monthly'}</p></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-white rounded-lg border border-gray-100">
                          <div><p className="text-xs text-gray-400">Payment Scheme Amount</p><p className="font-bold text-gray-800">₹{Number(m.chitAmount).toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-400">Installment Amount</p><p className="font-bold text-gray-800">₹{Number(m.monthlyAmount).toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-400">Total Paid</p><p className="font-bold text-gray-800">₹{totalPaid.toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-400">Remaining Balance</p><p className="font-bold text-gray-800">₹{remainingBalance.toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-400">Days Completed</p><p className="font-bold text-gray-800">{fullyPaidDays}</p></div>
                          <div><p className="text-xs text-gray-400">Weeks Completed</p><p className="font-bold text-gray-800">{fullyPaidWeeks}</p></div>
                          <div><p className="text-xs text-gray-400">Months Completed</p><p className="font-bold text-gray-800">{fullyPaidMonths} / {m.totalMonths}</p></div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={e => { e.stopPropagation(); openEditMember(m); }}
                            className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white"
                          >
                            Edit Member Profile
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handlePrintReceipt(m); }}
                            className="flex-1 py-2 border border-gold/30 rounded-lg text-xs font-semibold text-gold hover:bg-gold/5"
                          >
                            Print Receipt
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleRemoveMember(m._id); }}
                            className="px-3 py-2 border border-red-100 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Right: FPayment Tracker */}
                      <div>
                        <FPaymentTracker
                          member={m}
                          team={team}
                          calendarWeeks={calendarWeeks}
                          teamMonths={teamMonths}
                          memberPayments={memberPayments[m._id] || []}
                          onPaymentChange={loadPayments}
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
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Edit Member' : 'Add Member'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Mobile Number *</label>
                <div className="flex gap-2">
                  <input
                    value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value })}
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Full Name *</label>
                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Member name (auto-filled after fetch)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Address</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Member Address" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>

              {team.schemeId && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Payment Scheme Amount</p>
                    <p className="text-sm font-bold text-gray-700">₹{Number(team.schemeId.amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Months</p>
                    <p className="text-sm font-bold text-gray-700">{team.schemeId.durationMonths || 0} months</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Payment Frequency *</label>
                <select value={form.paymentFrequency} onChange={e => setForm({ ...form, paymentFrequency: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Monthly Amount (₹) *</label>
                <input type="number" value={form.monthlyAmount} onChange={e => setForm({ ...form, monthlyAmount: e.target.value })} placeholder="Enter monthly amount" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any notes..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold resize-none" />
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

export default FPaymentTeamDetails;
