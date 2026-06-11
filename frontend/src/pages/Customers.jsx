import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import customerService from '../services/customerService';

const EMPTY = { fullName: '', mobile: '', email: '', address: '', aadhaarNumber: '', status: 'active', notes: '' };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => customerService.getAll().then(setCustomers).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (c) => { setEditing(c._id); setForm({ fullName: c.fullName, mobile: c.mobile, email: c.email || '', address: c.address || '', aadhaarNumber: c.aadhaarNumber || '', status: c.status, notes: c.notes || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile) return toast.error('Full name and mobile are required');
    setSaving(true);
    try {
      if (editing) { await customerService.update(editing, form); toast.success('Customer updated'); }
      else { await customerService.create(form); toast.success('Customer created'); }
      setModal(false); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try { await customerService.remove(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const filtered = customers.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
          <p className="text-sm text-gray-500">Manage your customer database</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover">
          <FiPlus size={14} /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold" />
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 mb-3">{search ? 'No results found.' : 'No customers yet.'}</p>
            {!search && <button onClick={openCreate} className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold">Add First Customer</button>}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Customer', 'Mobile', 'Email', 'Address', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold flex-shrink-0">{initials(c.fullName)}</div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{c.fullName}</p>
                          {c.aadhaarNumber && <p className="text-xs text-gray-400">XXXX {c.aadhaarNumber.slice(-4)}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.mobile}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.email || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-[180px] truncate">{c.address || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${c.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-gold p-1"><FiEdit2 size={14} /></button>
                        <button onClick={() => handleDelete(c._id)} className="text-gray-400 hover:text-red-500 p-1"><FiTrash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Full Name *</label>
                  <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Mobile *</label>
                  <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Aadhaar</label>
                  <input value={form.aadhaarNumber} onChange={e => setForm({...form, aadhaarNumber: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                    <option>active</option><option>inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold-hover disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
