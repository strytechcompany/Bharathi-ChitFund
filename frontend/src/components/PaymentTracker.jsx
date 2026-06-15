import { useState } from 'react';
import paymentService from '../services/paymentService';
import { toast } from 'react-toastify';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PaymentTracker = ({ member, team, calendarWeeks, teamMonths, onPaymentChange, memberPayments }) => {
  const [savingMonth, setSavingMonth] = useState({});
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [monthInputs, setMonthInputs] = useState({});

  const setMonthInput = (key, field, value) => {
    setMonthInputs(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const savePayment = async (dMonth, dYear, dWeek, dDay, amount, description, existingId, explicitKey) => {
    const key = explicitKey || `${member._id}_${dMonth}_${dYear}_${dWeek}_${dDay}`;
    setSavingMonth(prev => ({ ...prev, [key]: true }));
    try {
      if (existingId) {
        // Delete payment
        await paymentService.remove(existingId);
        toast.success('Payment un-recorded');
      } else {
        // Create payment
        await paymentService.create({
          member: member._id,
          team: team._id,
          month: dMonth,
          year: dYear,
          week: dWeek || undefined,
          day: dDay || undefined,
          amount: Number(amount) || 0,
          notes: description || '',
          status: 'paid'
        });
        toast.success('Payment recorded');
      }
      if (onPaymentChange) onPaymentChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSavingMonth(prev => ({ ...prev, [key]: false }));
    }
  };

  const Switch = ({ isPaid, isSaving, onToggle }) => (
    <div className="flex items-center gap-2">
      <label className={`relative inline-flex items-center cursor-pointer ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={isPaid}
          onChange={onToggle}
        />
        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
      </label>
      <span className={`text-[10px] font-bold ${isPaid ? 'text-green-600' : 'text-gray-400'}`}>{isPaid ? 'PAID' : 'UNPAID'}</span>
    </div>
  );

  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payments Tracker ({member.paymentFrequency || 'monthly'})</p>
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
                         
                         const payment = memberPayments.find(p => p.month === dMonth && p.year === dYear && p.week === w.weekNum && p.day === dDay && p.status === 'paid');
                         const isPaid = !!payment;
                         const key = `${member._id}_${dMonth}_${dYear}_${w.weekNum}_${dDay}`;
                         const isSaving = !!savingMonth[key];
                         const input = monthInputs[key] || { amount: member.monthlyPadi, description: payment?.notes || '' };
                         const amountToSave = input.amount || member.monthlyPadi;
                         
                         return (
                           <div key={key} className={`flex flex-col gap-1 p-2 rounded-lg border ${isPaid ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
                             <div className="flex items-center justify-between">
                               <div>
                                  <p className="text-xs font-bold text-gray-800">Day {dDay} <span className="text-gray-400 font-normal">({dayName})</span></p>
                                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">₹{amountToSave}</p>
                               </div>
                               <Switch 
                                 isPaid={isPaid} 
                                 isSaving={isSaving} 
                                 onToggle={() => savePayment(dMonth, dYear, w.weekNum, dDay, amountToSave, input.description, payment?._id, key)} 
                               />
                             </div>
                             <textarea
                               value={input.description || ''}
                               onChange={e => setMonthInput(key, 'description', e.target.value)}
                               placeholder="Description (optional)"
                               rows={1}
                               className="mt-1 w-full border border-gray-200 rounded px-2 py-1 text-[10px] outline-none focus:border-gold resize-none text-gray-600 placeholder-gray-400 bg-white"
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
                    
                    const payment = memberPayments.find(p => p.month === dMonth && p.year === dYear && p.week === w.weekNum && p.status === 'paid');
                    const isPaid = !!payment;
                    const key = `${member._id}_${dMonth}_${dYear}_${w.weekNum}`;
                    const isSaving = !!savingMonth[key];
                    const input = monthInputs[key] || { amount: member.monthlyPadi, description: payment?.notes || '' };
                    const amountToSave = input.amount || member.monthlyPadi;

                    return (
                      <div key={key} className={`flex flex-col gap-2 p-3 rounded-lg border ${isPaid ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-800">Week {w.weekNum}</p>
                            <p className="text-xs text-gray-500">{w.label}</p>
                            <p className="text-xs font-semibold mt-1">₹{amountToSave}</p>
                          </div>
                          <Switch 
                            isPaid={isPaid} 
                            isSaving={isSaving} 
                            onToggle={() => savePayment(dMonth, dYear, w.weekNum, null, amountToSave, input.description, payment?._id, key)} 
                          />
                        </div>
                        <textarea
                          value={input.description || ''}
                          onChange={e => setMonthInput(key, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          rows={1}
                          className="mt-2 w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-gold resize-none text-gray-600 placeholder-gray-400 bg-white"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Monthly
          const payment = memberPayments.find(p => p.month === month && p.year === year && p.status === 'paid');
          const isPaid = !!payment;
          const key = `${member._id}_${month}_${year}`;
          const isSaving = !!savingMonth[key];
          const input = monthInputs[key] || { amount: member.monthlyPadi, description: payment?.notes || '' };
          const amountToSave = input.amount || member.monthlyPadi;

          return (
            <div key={monthKey} className={`flex flex-col gap-2 p-3 mb-2 rounded-lg border ${isPaid ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{label}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">₹{amountToSave}</p>
                </div>
                <Switch 
                  isPaid={isPaid} 
                  isSaving={isSaving} 
                  onToggle={() => savePayment(month, year, null, null, amountToSave, input.description, payment?._id, key)} 
                />
              </div>
              <textarea
                value={input.description || ''}
                onChange={e => setMonthInput(key, 'description', e.target.value)}
                placeholder="Description (optional)"
                rows={1}
                className="mt-2 w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-gold resize-none text-gray-600 placeholder-gray-400 bg-white"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentTracker;
