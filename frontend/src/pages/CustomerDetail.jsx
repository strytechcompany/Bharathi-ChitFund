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

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [groups, setGroups] = useState([]); // [{ scheme, teams: [{ member, team, payments }] }]
  const [loading, setLoading] = useState(true);

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
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
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
                {months.length === 0 ? (
                  <p className="text-xs text-gray-400 p-5 text-center">No start date set for this team</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky left-0 bg-white w-28">Month</th>
                          <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Paid Date</th>
                          <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {months.map(({ month, year, label }) => {
                          const payment = payments.find(p => p.month === month && p.year === year);
                          const monthDate = new Date(year, month - 1, 28);
                          const isPast = monthDate < now;
                          const isFuture = new Date(year, month - 1, 1) > now;

                          let statusEl;
                          if (payment?.status === 'paid') {
                            statusEl = (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-bold uppercase text-[10px]">
                                <FiCheck size={9} /> Paid
                              </span>
                            );
                          } else if (payment?.status === 'due') {
                            statusEl = <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-bold uppercase text-[10px]">Due</span>;
                          } else if (payment?.status === 'unpaid') {
                            statusEl = <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold uppercase text-[10px]">Unpaid</span>;
                          } else if (isFuture) {
                            statusEl = <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-bold uppercase text-[10px]">Upcoming</span>;
                          } else if (isPast) {
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
                            <tr key={`${month}-${year}`} className={`border-b border-gray-50 last:border-0 ${payment?.status === 'paid' ? 'bg-green-50/30' : isPast && !payment ? 'bg-orange-50/30' : ''}`}>
                              <td className="px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-inherit w-28">{label}</td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                                {payment ? `₹${Number(payment.amount).toLocaleString()}` : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">{statusEl}</td>
                              <td className="px-4 py-3 text-gray-500">
                                {payment?.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-IN') : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-400 max-w-[160px] truncate">
                                {payment?.notes || <span className="text-gray-200">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
