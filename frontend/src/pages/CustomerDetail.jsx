import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCheck, FiAlertCircle, FiClock } from 'react-icons/fi';
import customerService from '../services/customerService';
import memberService from '../services/memberService';
import paymentService from '../services/paymentService';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const genMonths = (startDate, durationMonths) => {
  if (!startDate) return [];
  const months = [];
  const start = new Date(startDate);
  for (let i = 0; i < (durationMonths || 24); i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
  }
  return months;
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

const getDaysInMonth = (team, m, y) => {
  if (!team?.startDate) return [];
  const teamStart = new Date(team.startDate);
  teamStart.setHours(0,0,0,0);
  const teamEnd = team.endDate ? new Date(team.endDate) : new Date(new Date(team.startDate).setMonth(teamStart.getMonth() + (team.chitScheme?.durationMonths || 24)));
  teamEnd.setHours(23,59,59,999);

  const days = [];
  const date = new Date(y, m - 1, 1);
  while (date.getMonth() === m - 1) {
    const cur = new Date(date);
    if (cur >= teamStart && cur <= teamEnd) {
      days.push(cur);
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [groups, setGroups] = useState([]); // [{ scheme, teams: [{ member, team, payments }] }]
  const [loading, setLoading] = useState(true);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [expandedMonth, setExpandedMonth] = useState({});

  const toggleTeam = (teamId) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const toggleMonth = (key) => {
    setExpandedMonth(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const cust = await customerService.getOne(id);
        setCustomer(cust);

        // Find all member records matching this customer's mobile
        const members = await memberService.getByMobile(cust.mobile);
        if (members.length === 0) { setGroups([]); setLoading(false); return; }

        // For each member, load their payments in parallel
        const membersWithPayments = await Promise.all(
          members.map(async m => {
            const payments = await paymentService.getAll({ member: m._id }).catch(() => []);
            return { ...m, payments };
          })
        );

        // Group by chit scheme
        const schemeMap = {};
        membersWithPayments.forEach(m => {
          const scheme = m.team?.chitScheme;
          const schemeId = scheme?._id || 'unknown';
          if (!schemeMap[schemeId]) {
            schemeMap[schemeId] = { scheme: scheme || { name: 'Unknown Scheme' }, teams: [] };
          }
          schemeMap[schemeId].teams.push({ member: m, team: m.team, payments: m.payments });
        });

        setGroups(Object.values(schemeMap));
      } catch {
        toast.error('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>;
  if (!customer) return <div className="text-center py-16 text-red-400">Customer not found</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/customers')} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gold hover:border-gold transition-colors">
          <FiArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{customer.fullName}</h2>
          <p className="text-sm text-gray-400">Customer Profile</p>
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
          {customer.notes && (
            <div className="col-span-3">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Notes</p>
              <p className="text-sm text-gray-600">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* No enrollments */}
      {groups.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400">This customer is not enrolled in any chit fund scheme yet.</p>
        </div>
      )}

      {/* Scheme groups */}
      {groups.map(({ scheme, teams }, gi) => (
        <div key={gi} className="mb-6">
          {/* Scheme header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-bold text-gold uppercase tracking-wider px-3 py-1 bg-gold/10 rounded-full">
              {scheme.name || 'Chit Scheme'}{scheme.amount ? ` — ₹${(scheme.amount / 100000).toFixed(0)} Lakh` : ''}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Teams under this scheme */}
          {teams.map(({ member, team, payments }, ti) => {
            const months = genMonths(team?.startDate, team?.chitScheme?.durationMonths);
            const now = new Date();

            return (
              <div key={ti} className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden">
                {/* Team header */}
                <div 
                  className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleTeam(team?._id || ti)}
                >
                  <div>
                    <p className="font-bold text-gray-800">{team?.teamName || '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {team?.startDate ? `Started ${new Date(team.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ''}
                      {team?.status && <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${team.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{team.status}</span>}
                    </p>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Monthly Padi</p>
                      <p className="text-sm font-bold text-gold">₹{Number(member.monthlyPadi || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Paid</p>
                      <p className="text-sm font-bold text-green-600">
                        ₹{payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Months Paid</p>
                      <p className="text-sm font-bold text-gray-700">
                        {payments.filter(p => p.status === 'paid').length} / {team?.chitScheme?.durationMonths || member.totalMonths || 24}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Month payment table */}
                {expandedTeams[team?._id || ti] && (
                  months.length === 0 ? (
                    <p className="text-xs text-gray-400 p-5 text-center">No start date set for this team</p>
                  ) : (
                    <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                      {months.map(({ month, year, label }) => {
                        const monthDate = new Date(year, month - 1, 28);
                        const isPast = monthDate < now;
                        const isFuture = new Date(year, month - 1, 1) > now;
                        const freq = member.paymentFrequency || 'monthly';
                        const monthKey = `${team?._id || ti}_${year}_${month}`;

                        // Filter payments for this specific month/year
                        const monthPayments = payments.filter(p => p.month === month && p.year === year);
                        
                        let cumulativeAmount = 0;
                        let progressLabel = '';
                        let isPaid = false;
                        let statusEl;
                        let paidDate = null;
                        let notes = null;
                        
                        let subItems = [];

                        if (freq === 'daily') {
                          const daysInMonth = getDaysInMonth(team, month, year);
                          const totalDays = daysInMonth.length;
                          const paidDaysCount = monthPayments.filter(p => p.status === 'paid').length;
                          cumulativeAmount = monthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
                          isPaid = paidDaysCount > 0 && paidDaysCount === totalDays;
                          progressLabel = `${paidDaysCount} / ${totalDays} Days`;
                          subItems = daysInMonth.map(d => {
                            const p = monthPayments.find(pay => pay.day === d.getDate());
                            return {
                              label: `${d.getDate()} ${label.split(' ')[0]}`,
                              payment: p,
                              isPast: d < now,
                              isFuture: d > now
                            };
                          });
                        } else if (freq === 'weekly') {
                          const weeksInMonth = getCalendarWeeks(team).filter(w => w.monthKey === `${year}-${month}`);
                          const totalWeeks = weeksInMonth.length;
                          const paidWeeksCount = monthPayments.filter(p => p.status === 'paid').length;
                          cumulativeAmount = monthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
                          isPaid = paidWeeksCount > 0 && paidWeeksCount === totalWeeks;
                          progressLabel = `${paidWeeksCount} / ${totalWeeks} Weeks`;
                          subItems = weeksInMonth.map(w => {
                            const p = monthPayments.find(pay => pay.week === w.weekNum);
                            return {
                              label: `Week ${w.weekNum}`,
                              payment: p,
                              isPast: w.days[0] < now,
                              isFuture: w.days[0] > now
                            };
                          });
                        } else {
                          // Monthly
                          const payment = monthPayments[0];
                          if (payment) {
                            cumulativeAmount = payment.amount || 0;
                            isPaid = payment.status === 'paid';
                            paidDate = payment.paidDate;
                            notes = payment.notes;
                          }
                        }

                        // Determine visual status for the card
                        if (isPaid) {
                          statusEl = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-bold uppercase text-[10px]">
                              <FiCheck size={9} /> Paid
                            </span>
                          );
                        } else if (isFuture) {
                          statusEl = <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-bold uppercase text-[10px]">Upcoming</span>;
                        } else if (isPast && cumulativeAmount === 0 && freq === 'monthly') {
                          statusEl = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-500 font-bold uppercase text-[10px]">
                              <FiAlertCircle size={9} /> Missed
                            </span>
                          );
                        } else {
                          statusEl = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-500 font-bold uppercase text-[10px]">
                              <FiClock size={9} /> Current
                            </span>
                          );
                        }

                        return (
                          <div key={`${month}-${year}`} className="contents">
                            <div 
                              onClick={() => freq !== 'monthly' && toggleMonth(monthKey)}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-colors ${freq !== 'monthly' ? 'cursor-pointer hover:border-gold hover:shadow-sm' : ''} ${isPaid ? 'border-green-200 bg-green-50/40' : (isPast && cumulativeAmount === 0 && freq === 'monthly') ? 'border-orange-200 bg-orange-50/40' : 'border-gray-200 bg-gray-50/40 hover:bg-white'}`}
                            >
                              <p className="font-bold text-gray-800 text-sm">{label}</p>
                              {freq !== 'monthly' && <p className="text-[9px] text-gray-400 uppercase font-semibold">{progressLabel}</p>}
                              <div className="my-0.5">{statusEl}</div>
                              {cumulativeAmount > 0 || freq === 'monthly' ? (
                                <>
                                  <p className="text-xs font-bold text-gray-600 mt-1">₹{Number(cumulativeAmount).toLocaleString()}</p>
                                  {freq === 'monthly' && paidDate && <p className="text-[9px] text-gray-400 uppercase">{new Date(paidDate).toLocaleDateString('en-IN')}</p>}
                                  {freq === 'monthly' && notes && <p className="text-[10px] text-gray-500 truncate w-full mt-1 px-1" title={notes}>{notes}</p>}
                                </>
                              ) : (
                                <p className="text-xs font-semibold text-gray-300 mt-1">—</p>
                              )}
                            </div>
                            
                            {/* Expanded Subgrid for Daily/Weekly */}
                            {freq !== 'monthly' && expandedMonth[monthKey] && (
                              <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6 xl:col-span-8 bg-gray-50 border border-gray-200 rounded-xl p-4 my-2 flex flex-wrap gap-2 shadow-inner">
                                {subItems.length === 0 ? <p className="text-xs text-gray-400 w-full text-center">No active days/weeks in this month.</p> : null}
                                {subItems.map((item, idx) => {
                                  const p = item.payment;
                                  return (
                                    <div key={idx} className={`flex-1 min-w-[80px] flex flex-col items-center justify-center text-center p-2 rounded-lg border ${p?.status === 'paid' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                                      <p className="text-[10px] font-bold text-gray-800">{item.label}</p>
                                      {p?.status === 'paid' ? (
                                        <>
                                          <p className="text-xs font-bold text-green-600 mt-0.5">₹{Number(p.amount).toLocaleString()}</p>
                                          {p.paidDate && <p className="text-[8px] text-gray-400 mt-0.5">{new Date(p.paidDate).toLocaleDateString('en-IN')}</p>}
                                        </>
                                      ) : (
                                        <p className="text-[10px] text-gray-400 mt-1">{item.isFuture ? 'Upcoming' : 'Unpaid'}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default CustomerDetail;
