import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import fpaymentService from '../services/fpaymentService';

const STATUS_COLOR = {
  completed: 'bg-green-100 text-green-600',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-500',
  cancelled: 'bg-gray-100 text-gray-500',
};

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const FPaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fpaymentService.getFPaymentById(id)
      .then(setPayment)
      .catch(() => toast.error('Failed to load payment'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this payment record?')) return;
    try {
      await fpaymentService.deleteFPayment(id);
      toast.success('Deleted');
      navigate('/fpayment/payments');
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>;
  if (!payment) return <div className="text-center py-16 text-red-400">Payment not found</div>;

  return (
    <div>
      {/* Breadcrumb + header */}
      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        <button onClick={() => navigate('/fpayment/payments')} className="hover:text-gold">FPayment Ledger</button>
        <span>/</span>
        <span className="text-gray-600">{payment.paymentId}</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/fpayment/payments')} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gold hover:border-gold transition-colors">
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{payment.memberName}</h2>
            <p className="text-sm text-gray-400">{payment.paymentId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/fpayment/payments/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <FiEdit2 size={14} /> Edit
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-100 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50">
            <FiTrash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-[#5C4A00] text-white rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-gold uppercase font-semibold mb-1">Amount Paid</p>
          <p className="text-3xl font-bold">{formatCurrency(payment.amount)}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${STATUS_COLOR[payment.status] || STATUS_COLOR.completed}`}>{payment.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Payment Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Information</p>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <div><p className="text-xs text-gray-400">Payment Method</p><p className="font-medium text-gray-800 capitalize">{(payment.paymentMethod || '').replace('_', ' ')}</p></div>
            <div><p className="text-xs text-gray-400">Reference Number</p><p className="font-medium text-gray-800">{payment.referenceNumber || '—'}</p></div>
            <div><p className="text-xs text-gray-400">Installment No</p><p className="font-medium text-gray-800">#{payment.installmentNo}</p></div>
            <div><p className="text-xs text-gray-400">Installment Type</p><p className="font-medium text-gray-800 capitalize">{payment.installmentType}</p></div>
            <div><p className="text-xs text-gray-400">Payment Date</p><p className="font-medium text-gray-800">{formatDate(payment.paymentDate)}</p></div>
            <div><p className="text-xs text-gray-400">Created By</p><p className="font-medium text-gray-800">{payment.createdBy || '—'}</p></div>
            {payment.description && (
              <div className="col-span-2"><p className="text-xs text-gray-400">Description</p><p className="font-medium text-gray-800">{payment.description}</p></div>
            )}
          </div>
        </div>

        {/* Member Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Member Information</p>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <div><p className="text-xs text-gray-400">Member Name</p><p className="font-medium text-gray-800">{payment.memberName}</p></div>
            <div><p className="text-xs text-gray-400">Chit Scheme</p><p className="font-medium text-gray-800">{payment.schemeName || '—'}</p></div>
            <div><p className="text-xs text-gray-400">Team</p><p className="font-medium text-gray-800">{payment.teamName || '—'}</p></div>
          </div>
        </div>
      </div>

      {/* Timeline placeholder */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mt-6">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Timeline</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <FiClock size={14} className="text-gray-400" />
            <span className="text-gray-600">Record created</span>
            <span className="text-gray-400 text-xs ml-auto">{formatDateTime(payment.createdAt)}</span>
          </div>
          {payment.updatedAt && payment.updatedAt !== payment.createdAt && (
            <div className="flex items-center gap-3 text-sm">
              <FiClock size={14} className="text-gray-400" />
              <span className="text-gray-600">Last updated</span>
              <span className="text-gray-400 text-xs ml-auto">{formatDateTime(payment.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FPaymentDetails;
