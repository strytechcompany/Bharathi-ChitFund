import { useContext, useState } from 'react';
import fpaymentService from '../services/fpaymentService';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const FPaymentTracker = ({ member, team, calendarWeeks, teamMonths, onPaymentChange, memberPayments }) => {
  const { user } = useContext(AuthContext);
  const [saving, setSaving] = useState({});
  const [editing, setEditing] = useState({});
  const [inputs, setInputs] = useState({});
  const [expandedWeek, setExpandedWeek] = useState(null);

  const getInput = (key, payment) => inputs[key] || { amount: payment?.amount ?? member.monthlyAmount ?? '', description: payment?.description || '' };
  const setField = (key, field, value) => setInputs(prev => ({ ...prev, [key]: { ...getInput(key), [field]: value } }));

  const startEdit = (key, payment) => {
    setInputs(prev => ({ ...prev, [key]: { amount: payment.amount, description: payment.description || '' } }));
    setEditing(prev => ({ ...prev, [key]: true }));
  };
  const cancelEdit = (key) => setEditing(prev => ({ ...prev, [key]: false }));

  const handleSave = async (key, period) => {
    const input = getInput(key, null);
    const amount = Number(input.amount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await fpaymentService.createFPayment({
        memberId: member._id,
        memberName: member.fullName,
        teamId: team._id,
        teamName: team.teamName,
        schemeId: team.schemeId?._id,
        schemeName: team.schemeName,
        month: period.month,
        year: period.year,
        week: period.week || undefined,
        day: period.day || undefined,
        amount,
        description: input.description || '',
        status: 'completed',
        paymentDate: period.paymentDate,
        createdBy: user?.name || user?.username || '',
      });
      toast.success('Payment recorded');
      if (onPaymentChange) onPaymentChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleUpdate = async (key, payment) => {
    const input = getInput(key, payment);
    const amount = Number(input.amount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await fpaymentService.updateFPayment(payment._id, { amount, description: input.description || '' });
      toast.success('Payment updated');
      setEditing(prev => ({ ...prev, [key]: false }));
      if (onPaymentChange) onPaymentChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const PeriodEntry = ({ payment, period, dateLabel, compact }) => {
    const key = period.key;
    const isSaving = !!saving[key];
    const isEditing = !!editing[key];
    const showForm = !payment || isEditing;
    const input = getInput(key, payment);

    return (
      <div className="flex flex-col gap-1.5">
        {!compact && <p className="text-[10px] text-gray-400 uppercase font-semibold">{dateLabel}</p>}
        {showForm ? (
          <>
            <input
              type="number"
              value={input.amount}
              onChange={e => setField(key, 'amount', e.target.value)}
              placeholder="Amount"
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-gold"
            />
            <input
              type="text"
              value={input.description}
              onChange={e => setField(key, 'description', e.target.value)}
              placeholder="Description (optional)"
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-gold text-gray-600 placeholder-gray-400"
            />
            <div className="flex gap-2">
              <button
                disabled={isSaving}
                onClick={() => payment ? handleUpdate(key, payment) : handleSave(key, period)}
                className="flex-1 py-1 bg-gold text-white text-[10px] font-bold rounded hover:bg-gold-hover disabled:opacity-50"
              >
                {isSaving ? '...' : payment ? 'Update' : 'Save'}
              </button>
              {payment && (
                <button onClick={() => cancelEdit(key)} className="px-2 text-[10px] font-semibold text-gray-400 hover:text-gray-600">
                  Cancel
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-green-50 border border-green-200">
            <div className="min-w-0">
              <p className="text-xs font-bold text-green-700">₹{Number(payment.amount).toLocaleString()}</p>
              {payment.description && <p className="text-[10px] text-gray-500 truncate">{payment.description}</p>}
            </div>
            <button onClick={() => startEdit(key, payment)} className="text-[10px] font-bold text-gold hover:text-gold-hover whitespace-nowrap">
              Edit
            </button>
          </div>
        )}
      </div>
    );
  };

  const history = [...(memberPayments || [])]
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));

  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">FPayment Tracker ({member.paymentFrequency || 'monthly'})</p>
      <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
        {teamMonths.length === 0 && (
          <p className="text-xs text-gray-400 py-4 text-center">No months available — set a start date for this team.</p>
        )}
        {teamMonths.map(({ month, year, label }) => {
          const monthKey = `${year}-${month}`;

          if (member.paymentFrequency === 'daily') {
            const weeksForMonth = calendarWeeks.filter(w => w.monthKey === monthKey);
            if (weeksForMonth.length === 0) return null;

            return (
              <div key={monthKey} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <p className="font-bold text-gray-800">{label}</p>
                </div>

                <div className="flex bg-gray-50 border-b border-gray-200 overflow-x-auto">
                  {weeksForMonth.map(w => {
                    const currentExpanded = expandedWeek || `${member._id}_${monthKey}_${weeksForMonth[0].weekNum}`;
                    const isSelected = currentExpanded === `${member._id}_${monthKey}_${w.weekNum}`;

                    return (
                      <button
                        key={w.weekNum}
                        onClick={() => setExpandedWeek(`${member._id}_${monthKey}_${w.weekNum}`)}
                        className={`flex-1 min-w-[80px] py-2 text-xs font-semibold text-center border-r border-gray-200 last:border-0 ${isSelected ? 'bg-white text-gold border-b-2 border-b-gold' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        Week {w.weekNum}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 bg-white">
                  <div className="grid grid-cols-2 gap-3">
                    {weeksForMonth.map(w => {
                       const currentExpanded = expandedWeek || `${member._id}_${monthKey}_${weeksForMonth[0].weekNum}`;
                       if (currentExpanded !== `${member._id}_${monthKey}_${w.weekNum}`) return null;

                       return w.days.map(dateObj => {
                         const dMonth = dateObj.getMonth() + 1;
                         const dYear = dateObj.getFullYear();
                         const dDay = dateObj.getDate();
                         const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                         const payment = memberPayments.find(p => p.month === dMonth && p.year === dYear && p.week === w.weekNum && p.day === dDay && p.status === 'completed');
                         const key = `${member._id}_${dMonth}_${dYear}_${w.weekNum}_${dDay}`;

                         return (
                           <div key={key} className={`p-2 rounded-lg border ${payment ? 'border-green-200 bg-green-50/40' : 'border-gray-100'}`}>
                             <p className="text-xs font-bold text-gray-800 mb-1">Day {dDay} <span className="text-gray-400 font-normal">({dayName})</span></p>
                             <PeriodEntry
                               payment={payment}
                               period={{ key, month: dMonth, year: dYear, week: w.weekNum, day: dDay, paymentDate: dateObj }}
                               dateLabel={formatDate(dateObj)}
                               compact
                             />
                           </div>
                         );
                       });
                    })}
                  </div>
                </div>
              </div>
            );
          }

          if (member.paymentFrequency === 'weekly') {
            const weeksForMonth = calendarWeeks.filter(w => w.monthKey === monthKey);
            if (weeksForMonth.length === 0) return null;

            return (
              <div key={monthKey} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <p className="font-bold text-gray-800">{label}</p>
                </div>

                <div className="flex bg-gray-50 border-b border-gray-200 overflow-x-auto">
                  {weeksForMonth.map(w => {
                    const currentExpanded = expandedWeek || `${member._id}_${monthKey}_${weeksForMonth[0].weekNum}`;
                    const isSelected = currentExpanded === `${member._id}_${monthKey}_${w.weekNum}`;

                    return (
                      <button
                        key={w.weekNum}
                        onClick={() => setExpandedWeek(`${member._id}_${monthKey}_${w.weekNum}`)}
                        className={`flex-1 min-w-[80px] py-2 text-xs font-semibold text-center border-r border-gray-200 last:border-0 ${isSelected ? 'bg-white text-gold border-b-2 border-b-gold' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        Week {w.weekNum}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 bg-white">
                  {weeksForMonth.map(w => {
                    const currentExpanded = expandedWeek || `${member._id}_${monthKey}_${weeksForMonth[0].weekNum}`;
                    if (currentExpanded !== `${member._id}_${monthKey}_${w.weekNum}`) return null;

                    const dMonth = w.days[0].getMonth() + 1;
                    const dYear = w.days[0].getFullYear();

                    const payment = memberPayments.find(p => p.month === dMonth && p.year === dYear && p.week === w.weekNum && p.status === 'completed');
                    const key = `${member._id}_${dMonth}_${dYear}_${w.weekNum}`;

                    return (
                      <div key={key} className={`p-3 rounded-lg border ${payment ? 'border-green-200 bg-green-50/40' : 'border-gray-100'}`}>
                        <p className="text-sm font-bold text-gray-800">Week {w.weekNum}</p>
                        <p className="text-xs text-gray-500 mb-2">{w.label}</p>
                        <PeriodEntry
                          payment={payment}
                          period={{ key, month: dMonth, year: dYear, week: w.weekNum, paymentDate: w.days[0] }}
                          dateLabel={formatDate(w.days[0])}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Monthly
          const payment = memberPayments.find(p => p.month === month && p.year === year && p.status === 'completed');
          const key = `${member._id}_${month}_${year}`;

          return (
            <div key={monthKey} className={`p-3 mb-2 rounded-lg border ${payment ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-white'}`}>
              <p className="font-bold text-gray-800 text-sm mb-2">{label}</p>
              <PeriodEntry
                payment={payment}
                period={{ key, month, year, paymentDate: new Date(year, month - 1, 1) }}
                dateLabel={label}
              />
            </div>
          );
        })}
      </div>

      {/* Payment History */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment History</p>
        {history.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No payments recorded yet.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-1.5 font-bold text-gray-500 uppercase text-[10px]">Date</th>
                  <th className="text-left px-3 py-1.5 font-bold text-gray-500 uppercase text-[10px]">Amount</th>
                  <th className="text-left px-3 py-1.5 font-bold text-gray-500 uppercase text-[10px]">Description</th>
                </tr>
              </thead>
              <tbody>
                {history.map(p => (
                  <tr key={p._id} className="border-t border-gray-50">
                    <td className="px-3 py-1.5 text-gray-600">{formatDate(p.paymentDate || p.createdAt)}</td>
                    <td className="px-3 py-1.5 font-semibold text-gray-800">₹{Number(p.amount).toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-gray-500 truncate max-w-[120px]">{p.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FPaymentTracker;
