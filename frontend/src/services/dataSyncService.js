import * as XLSX from 'xlsx';

export const syncTeamToLocal = (teamData) => {
  try {
    const { team, members, memberPayments } = teamData;
    const teamId = team._id;
    localStorage.setItem(`teamData_${teamId}`, JSON.stringify({ team, members, memberPayments, syncedAt: new Date().toISOString() }));
    console.log(`Team ${team.teamName} synced to local storage successfully.`);
    return true;
  } catch (error) {
    console.error('Error syncing team data to local storage:', error);
    return false;
  }
};

export const downloadTeamReport = (teamData) => {
  try {
    const { team, members, memberPayments } = teamData;
    
    // Calculate total collection for the team
    const totalCollection = Object.values(memberPayments)
      .flat()
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const schemeName = team.chitScheme?.name || 'Premium Chit';
    const schemeAmount = team.chitScheme?.amount ? `₹${(team.chitScheme.amount / 100000).toFixed(0)} Lakh` : 'N/A';
    
    // First, add some metadata rows at the top
    const reportData = [
      { 'Member Name': `Scheme: ${schemeName}` },
      { 'Member Name': `Scheme Amount: ${schemeAmount}` },
      { 'Member Name': `Team: ${team.teamName}` },
      { 'Member Name': `Total Members: ${members.length}` },
      { 'Member Name': `Total Collection: ₹${totalCollection.toLocaleString()}` },
      { 'Member Name': '' }, // Empty row for spacing
    ];

    // Build each member's data
    members.forEach(m => {
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
        fullyPaidMonths = Math.floor(paidCount / 4);
      } else {
        fullyPaidMonths = paidCount;
        fullyPaidWeeks = fullyPaidMonths * 4;
        fullyPaidDays = fullyPaidMonths * 30;
      }

      let paidProgress = '';
      if (m.paymentFrequency === 'daily') {
        paidProgress = `${fullyPaidDays} Days`;
      } else if (m.paymentFrequency === 'weekly') {
        paidProgress = `${fullyPaidWeeks} Weeks`;
      } else {
        paidProgress = `${fullyPaidMonths} Months`;
      }

      reportData.push({
        'Member Name': m.fullName,
        'Mobile': m.mobile,
        'Address': m.address || '',
        'Premium (Chit Amount)': `₹${Number(m.chitAmount || 0).toLocaleString()}`,
        'Payment Frequency': m.paymentFrequency ? m.paymentFrequency.charAt(0).toUpperCase() + m.paymentFrequency.slice(1) : 'Monthly',
        'Padi (Installment)': `₹${Number(m.monthlyPadi || 0).toLocaleString()}`,
        'Total Paid': `₹${totalPaid.toLocaleString()}`,
        'Paid Progress': paidProgress,
        'Status': m.status || 'Active',
        'Notes': m.notes || ''
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);

    // Make columns wider
    ws['!cols'] = [
      { wch: 25 }, // Member Name / Metadata
      { wch: 15 }, // Mobile
      { wch: 30 }, // Address
      { wch: 20 }, // Premium
      { wch: 18 }, // Payment Frequency
      { wch: 15 }, // Padi
      { wch: 15 }, // Total Paid
      { wch: 18 }, // Paid Progress
      { wch: 10 }, // Status
      { wch: 30 }, // Notes
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Team Report');

    XLSX.writeFile(wb, `Team_${team.teamName}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return false;
  }
};

export default { syncTeamToLocal, downloadTeamReport };
