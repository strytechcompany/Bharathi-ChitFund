import { toast } from 'react-toastify';
import teamService from './teamService';
import memberService from './memberService';
import paymentService from './paymentService';

export const checkCompletedTeams = async () => {
  try {
    // 1. Get all active teams
    const teams = await teamService.getAll().catch(() => []);
    const activeTeams = teams.filter(t => t.status !== 'completed');

    for (const team of activeTeams) {
      if (!team.chitScheme) continue;

      // 2. Fetch members and payments
      const members = await memberService.getAll(team._id).catch(() => []);
      if (members.length === 0) continue; // no members yet

      const payments = await paymentService.getAll({ team: team._id }).catch(() => []);
      
      const memberPayments = {};
      payments.forEach(p => {
        const mid = typeof p.member === 'object' ? p.member._id : p.member;
        if (!memberPayments[mid]) memberPayments[mid] = [];
        memberPayments[mid].push(p);
      });

      // 3. Check if all members are fully paid
      let allFullyPaid = true;

      for (const m of members) {
        const memberPays = memberPayments[m._id] || [];
        const paidCount = memberPays.filter(p => p.status === 'paid').length;

        let isMemberFullyPaid = false;
        
        // Calculate fully paid months based on logic used in TeamDetails
        if (m.paymentFrequency === 'daily') {
          const monthsPaidMap = {};
          memberPays.filter(p => p.status === 'paid').forEach(p => {
            const k = `${p.year}-${p.month}`;
            monthsPaidMap[k] = (monthsPaidMap[k] || 0) + 1;
          });
          const fullyPaidMonths = Object.keys(monthsPaidMap).filter(k => {
            const [year, month] = k.split('-');
            const daysInMonth = new Date(year, month, 0).getDate();
            return monthsPaidMap[k] >= daysInMonth;
          }).length;
          
          if (fullyPaidMonths >= (m.totalMonths || team.chitScheme.durationMonths || 24)) {
            isMemberFullyPaid = true;
          }
        } else if (m.paymentFrequency === 'weekly') {
          const fullyPaidMonths = Math.floor(paidCount / 4);
          if (fullyPaidMonths >= (m.totalMonths || team.chitScheme.durationMonths || 24)) {
            isMemberFullyPaid = true;
          }
        } else {
          // monthly
          if (paidCount >= (m.totalMonths || team.chitScheme.durationMonths || 24)) {
            isMemberFullyPaid = true;
          }
        }

        if (!isMemberFullyPaid) {
          allFullyPaid = false;
          break;
        }
      }

      // 4. If everyone is paid, show toast
      if (allFullyPaid) {
        const schemeName = team.chitScheme?.name || `₹${(team.chitScheme.amount/100000).toFixed(0)} Lakh Scheme`;
        toast.info(
          `Team ${team.teamName} in chit scheme ${schemeName} is completed. Please mark it as completed.`,
          {
            position: 'top-right',
            autoClose: false, // Make it persistent until dismissed manually, or could autoClose
          }
        );
      }
    }
  } catch (err) {
    console.error('Failed to check team completions:', err);
  }
};
