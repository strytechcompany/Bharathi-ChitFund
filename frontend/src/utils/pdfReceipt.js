import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COMPANY_NAME = 'BHARATHI CHIT FUND';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

const sortedHistory = (payments) =>
  [...(payments || [])]
    .filter(p => p.status === 'paid')
    .sort((a, b) => new Date(b.paymentDate || b.paidDate || b.createdAt) - new Date(a.paymentDate || a.paidDate || a.createdAt));

const drawHeader = (doc, pageWidth) => {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, pageWidth / 2, 18, { align: 'center' });
  doc.setDrawColor(180, 150, 40);
  doc.setLineWidth(0.5);
  doc.line(14, 23, pageWidth - 14, 23);
};

export const printMemberReceipt = (member, team, payments) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, pageWidth);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Member Payment Statement', pageWidth / 2, 30, { align: 'center' });

  const history = sortedHistory(payments);
  const totalPaid = history.reduce((s, p) => s + (p.amount || 0), 0);
  const chitAmount = Number(member.chitAmount || 0);
  const remainingBalance = Math.max(chitAmount - totalPaid, 0);
  const daysCompleted = history.length;

  autoTable(doc, {
    startY: 38,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    body: [
      ['Member Name', member.fullName, 'Phone Number', member.mobile],
      ['Address', member.address || '—', 'Team', team?.teamName || '—'],
      ['Chit Amount', formatCurrency(chitAmount), 'Daily/Weekly/Monthly Amount', formatCurrency(member.monthlyPadi)],
      ['Total Paid', formatCurrency(totalPaid), 'Remaining Balance', formatCurrency(remainingBalance)],
      ['Days/Periods Completed', String(daysCompleted), 'Statement Date', formatDate(new Date())],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [90, 90, 90], cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', textColor: [90, 90, 90], cellWidth: 45 },
      3: { cellWidth: 45 },
    },
  });

  const historyStartY = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Payment History', 14, historyStartY);

  autoTable(doc, {
    startY: historyStartY + 3,
    head: [['Date', 'Amount', 'Description']],
    body: history.length
      ? history.map(p => [formatDate(p.paymentDate || p.paidDate || p.createdAt), formatCurrency(p.amount), p.notes || '—'])
      : [['—', '—', 'No payments recorded yet']],
    headStyles: { fillColor: [92, 74, 0], textColor: 255 },
    styles: { fontSize: 9 },
  });

  const sigY = Math.min(doc.lastAutoTable.finalY + 30, doc.internal.pageSize.getHeight() - 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.line(pageWidth - 70, sigY, pageWidth - 14, sigY);
  doc.text('Signature', pageWidth - 42, sigY + 5, { align: 'center' });

  doc.save(`Receipt_${member.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const printTeamReport = (team, members, memberPayments, reportMeta = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, pageWidth);

  const title = reportMeta.title || `${team?.teamName || 'Team'} Report`;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, pageWidth / 2, 30, { align: 'center' });

  const rows = members.map(m => {
    const history = sortedHistory(memberPayments[m._id] || []);
    const totalPaid = history.reduce((s, p) => s + (p.amount || 0), 0);
    const chitAmount = Number(m.chitAmount || 0);
    const pending = Math.max(chitAmount - totalPaid, 0);
    const windowPaid = reportMeta.windowPaid ? reportMeta.windowPaid(m, history) : totalPaid;
    return {
      name: m.fullName,
      windowPaid,
      totalPaid,
      pending,
      days: history.length,
    };
  });

  const totalCollection = rows.reduce((s, r) => s + r.totalPaid, 0);
  const totalPending = rows.reduce((s, r) => s + r.pending, 0);

  autoTable(doc, {
    startY: 36,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1 },
    body: [
      ['Company', COMPANY_NAME, 'Date', formatDate(new Date())],
      ['Total Members', String(members.length), 'Total Collection', formatCurrency(totalCollection)],
      ['Total Pending', formatCurrency(totalPending), '', ''],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [90, 90, 90], cellWidth: 40 },
      2: { fontStyle: 'bold', textColor: [90, 90, 90], cellWidth: 40 },
    },
  });

  const headRow = ['Member Name'];
  if (reportMeta.windowLabel) headRow.push(reportMeta.windowLabel);
  headRow.push('Total Paid', 'Pending Amount', 'Days Completed', 'Balance');

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [headRow],
    body: rows.map(r => {
      const row = [r.name];
      if (reportMeta.windowLabel) row.push(formatCurrency(r.windowPaid));
      row.push(formatCurrency(r.totalPaid), formatCurrency(r.pending), String(r.days), formatCurrency(r.pending));
      return row;
    }),
    headStyles: { fillColor: [92, 74, 0], textColor: 255 },
    styles: { fontSize: 9 },
  });

  doc.save(`${(reportMeta.fileName || title).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export default { printMemberReceipt, printTeamReport };
