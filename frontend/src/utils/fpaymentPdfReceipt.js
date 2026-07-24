import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COMPANY_NAME = 'BHARATHI CHIT FUND';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

const sortedHistory = (payments) =>
  [...(payments || [])]
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));

export const printFPaymentMemberReceipt = (member, team, payments) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, pageWidth / 2, 18, { align: 'center' });
  doc.setDrawColor(180, 150, 40);
  doc.setLineWidth(0.5);
  doc.line(14, 23, pageWidth - 14, 23);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('FPayment Member Statement', pageWidth / 2, 30, { align: 'center' });

  const history = sortedHistory(payments);
  const totalPaid = history.reduce((s, p) => s + (p.amount || 0), 0);
  const chitAmount = Number(member.chitAmount || 0);
  const remainingBalance = Math.max(chitAmount - totalPaid, 0);
  const periodsCompleted = history.length;

  autoTable(doc, {
    startY: 38,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    body: [
      ['Member Name', member.fullName, 'Mobile Number', member.mobile],
      ['Address', member.address || '—', 'Team', team?.teamName || '—'],
      ['Payment Scheme Amount', formatCurrency(chitAmount), 'Installment Amount', formatCurrency(member.monthlyAmount)],
      ['Total Paid', formatCurrency(totalPaid), 'Remaining Balance', formatCurrency(remainingBalance)],
      ['Periods Completed', String(periodsCompleted), 'Statement Date', formatDate(new Date())],
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
      ? history.map(p => [formatDate(p.paymentDate || p.createdAt), formatCurrency(p.amount), p.description || '—'])
      : [['—', '—', 'No payments recorded yet']],
    headStyles: { fillColor: [92, 74, 0], textColor: 255 },
    styles: { fontSize: 9 },
  });

  const sigY = Math.min(doc.lastAutoTable.finalY + 30, doc.internal.pageSize.getHeight() - 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.line(pageWidth - 70, sigY, pageWidth - 14, sigY);
  doc.text('Signature', pageWidth - 42, sigY + 5, { align: 'center' });

  doc.save(`FPayment_Receipt_${member.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export default { printFPaymentMemberReceipt };
