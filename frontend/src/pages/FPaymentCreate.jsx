import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import fpaymentService from '../services/fpaymentService';
import memberService from '../services/memberService';
import chitService from '../services/chitService';
import teamService from '../services/teamService';

const EMPTY = {
  memberId: '', memberName: '',
  schemeId: '', schemeName: '',
  teamId: '', teamName: '',
  installmentNo: 1,
  installmentType: 'monthly',
  amount: '',
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'cash',
  referenceNumber: '',
  description: '',
  status: 'completed',
};

const FPaymentCreate = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState(EMPTY);
  const [members, setMembers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    memberService.getAll().then(setMembers).catch(() => []);
    chitService.getAll().then(setSchemes).catch(() => []);
    teamService.getAll().then(setTeams).catch(() => []);
  }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const selectMember = (id) => {
    const m = members.find(mm => mm._id === id);
    set('memberId', id);
    set('memberName', m?.fullName || '');
  };
  const selectScheme = (id) => {
    const s = schemes.find(ss => ss._id === id);
    set('schemeId', id);
    set('schemeName', s?.name || '');
  };
  const selectTeam = (id) => {
    const t = teams.find(tt => tt._id === id);
    set('teamId', id);
    set('teamName', t?.teamName || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.memberName || !form.amount || Number(form.amount) <= 0) {
      return toast.error('Member name and a valid amount are required');
    }
    setSaving(true);
    try {
      const payload = { ...form, createdBy: user?.name || user?.username || '' };
      if (!payload.memberId) delete payload.memberId;
      if (!payload.schemeId) delete payload.schemeId;
      if (!payload.teamId) delete payload.teamId;
      await fpaymentService.createFPayment(payload);
      toast.success('Payment created');
      navigate('/fpayment/payments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/fpayment/payments')} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gold hover:border-gold transition-colors">
          <FiArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Add Payment</h2>
          <p className="text-sm text-gray-500">Create a new FPayment record</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Member</label>
              <select value={form.memberId} onChange={e => selectMember(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                <option value="">Select member (optional)</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.fullName} — {m.mobile}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Member Name *</label>
              <input value={form.memberName} onChange={e => set('memberName', e.target.value)} placeholder="Member name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Chit Scheme</label>
              <select value={form.schemeId} onChange={e => selectScheme(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                <option value="">Select scheme (optional)</option>
                {schemes.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Team</label>
              <select value={form.teamId} onChange={e => selectTeam(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                <option value="">Select team (optional)</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.teamName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="1000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Installment No</label>
              <input type="number" value={form.installmentNo} onChange={e => set('installmentNo', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Installment Type</label>
              <select value={form.installmentType} onChange={e => set('installmentType', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Payment Date</label>
              <input type="date" value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Payment Method</label>
              <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Reference Number</label>
              <input value={form.referenceNumber} onChange={e => set('referenceNumber', e.target.value)} placeholder="UPI/Txn ref (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold resize-none" placeholder="Notes (optional)" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/fpayment/payments')} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FPaymentCreate;
