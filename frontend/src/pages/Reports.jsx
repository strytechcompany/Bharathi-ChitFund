import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import chitService from '../services/chitService';
import teamService from '../services/teamService';
import memberService from '../services/memberService';
import paymentService from '../services/paymentService';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const genMonths = (startDate, durationMonths) => {
  if (!startDate) return [];
  const list = [];
  const start = new Date(startDate);
  for (let i = 0; i < (Number(durationMonths) || 24); i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    list.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return list;
};

const Reports = () => {
  const [schemes, setSchemes] = useState([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [paymentMap, setPaymentMap] = useState({}); // { 'memberId': { 'month_year': payment } }
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    chitService.getAll().then(setSchemes).catch(() => {});
  }, []);

  const handleSchemeChange = async (schemeId) => {
    setSelectedSchemeId(schemeId);
    setTeams([]);
    setSelectedTeam(null);
    setMembers([]);
    setPaymentMap({});
    setDescription('');
    if (!schemeId) return;
    setLoadingTeams(true);
    const t = await teamService.getAll(schemeId).catch(() => []);
    setTeams(t);
    setLoadingTeams(false);
  };

  const handleTeamChange = async (teamId) => {
    setMembers([]);
    setPaymentMap({});
    if (!teamId) { setSelectedTeam(null); setDescription(''); return; }
    const team = teams.find(t => t._id === teamId) || null;
    setSelectedTeam(team);
    setDescription(team?.description || '');
    setLoading(true);
    try {
      const [mems, allPayments] = await Promise.all([
        memberService.getAll(teamId),
        paymentService.getAll({ team: teamId }),
      ]);
      setMembers(mems);
      // Build map: { memberId: { 'month_year': payment } }
      const map = {};
      allPayments.forEach(p => {
        const mid = String(p.member?._id || p.member);
        if (!map[mid]) map[mid] = {};
        map[mid][`${p.month}_${p.year}`] = p;
      });
      setPaymentMap(map);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const saveDescription = async () => {
    if (!selectedTeam) return;
    setSavingDesc(true);
    try {
      await teamService.update(selectedTeam._id, { description });
      setSelectedTeam(prev => ({ ...prev, description }));
      toast.success('Description saved');
    } catch {
      toast.error('Failed to save description');
    } finally {
      setSavingDesc(false);
    }
  };

  const months = selectedTeam
    ? genMonths(selectedTeam.startDate, selectedTeam.chitScheme?.durationMonths)
    : [];

  // Per-month totals (paid only)
  const monthTotals = months.map(({ month, year }) =>
    members.reduce((sum, m) => {
      const p = paymentMap[String(m._id)]?.[`${month}_${year}`];
      return sum + (p?.status === 'paid' ? Number(p.amount || 0) : 0);
    }, 0)
  );

  // Per-member totals
  const memberTotals = members.map(m =>
    months.reduce((sum, { month, year }) => {
      const p = paymentMap[String(m._id)]?.[`${month}_${year}`];
      return sum + (p?.status === 'paid' ? Number(p.amount || 0) : 0);
    }, 0)
  );

  const grandTotal = monthTotals.reduce((s, v) => s + v, 0);
  const selectedSchemeName = schemes.find(s => s._id === selectedSchemeId)?.name || '';

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <p className="text-sm text-gray-500">Payment summary by chit scheme and team</p>
      </div>

      {/* Scheme + Team selectors */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Chit Scheme</label>
            <select
              value={selectedSchemeId}
              onChange={e => handleSchemeChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="">Select chit scheme</option>
              {schemes.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Team</label>
            <select
              value={selectedTeam?._id || ''}
              onChange={e => handleTeamChange(e.target.value)}
              disabled={!selectedSchemeId || loadingTeams}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold disabled:opacity-60"
            >
              <option value="">{loadingTeams ? 'Loading...' : 'Select team'}</option>
              {teams.map(t => <option key={t._id} value={t._id}>{t.teamName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-400">Loading report data...</div>
      )}

      {/* Report Table */}
      {!loading && selectedTeam && (
        <>
          {members.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center mb-6">
              <p className="text-gray-400">No members in this team yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">

              {/* Report title bar */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <p className="font-bold text-gray-800 text-base">{selectedTeam.teamName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedSchemeName}
                    {selectedTeam.startDate && ` · Started ${new Date(selectedTeam.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
                    {` · ${members.length} members`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Grand Total</p>
                  <p className="text-xl font-bold text-gold">₹{grandTotal.toLocaleString()}</p>
                </div>
              </div>

              {/* Scrollable matrix table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {/* Fixed info columns */}
                      <th className="text-left px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 sticky left-0 bg-gray-50 z-20 w-8">#</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 sticky left-8 bg-gray-50 z-20 min-w-[140px]">Name</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 min-w-[110px]">Phone</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[130px]">Address</th>
                      {/* Month columns */}
                      {months.map(({ label }) => (
                        <th key={label} className="text-center px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 min-w-[80px]">
                          {label}
                        </th>
                      ))}
                      {/* Row total */}
                      <th className="text-right px-4 py-3 text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/5 min-w-[90px]">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {members.map((m, idx) => (
                      <tr key={m._id} className={`border-b border-gray-50 hover:bg-gray-50/60 ${idx % 2 === 0 ? '' : 'bg-gray-50/20'}`}>
                        {/* # */}
                        <td className="px-3 py-3 text-gray-400 text-center border-r border-gray-200 sticky left-0 bg-white z-10">{idx + 1}</td>
                        {/* Name */}
                        <td className="px-4 py-3 font-semibold text-gray-800 border-r border-gray-100 sticky left-8 bg-white z-10 min-w-[140px]">
                          {m.fullName}
                        </td>
                        {/* Phone */}
                        <td className="px-4 py-3 text-gray-600 border-r border-gray-100">{m.mobile}</td>
                        {/* Address */}
                        <td className="px-4 py-3 text-gray-500 border-r border-gray-200 max-w-[130px] truncate">{m.address || '—'}</td>
                        {/* Month cells */}
                        {months.map(({ month, year, label }) => {
                          const p = paymentMap[String(m._id)]?.[`${month}_${year}`];
                          const paid = p?.status === 'paid';
                          const due = p?.status === 'due' || p?.status === 'unpaid';
                          return (
                            <td key={label} className="px-3 py-3 text-center border-r border-gray-50">
                              {paid ? (
                                <span className="text-green-600 font-semibold">₹{Number(p.amount).toLocaleString()}</span>
                              ) : due ? (
                                <span className="text-red-400 font-semibold text-[10px] uppercase">{p.status}</span>
                              ) : (
                                <span className="text-gray-200">—</span>
                              )}
                            </td>
                          );
                        })}
                        {/* Member total */}
                        <td className="px-4 py-3 text-right font-bold text-gray-800 bg-gold/5">
                          ₹{memberTotals[idx].toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    {/* Totals row */}
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                      <td className="px-3 py-3 border-r border-gray-200 sticky left-0 bg-gray-50 z-10" />
                      <td className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 border-r border-gray-100 sticky left-8 bg-gray-50 z-10 min-w-[140px]" colSpan={3}>
                        Monthly Total
                      </td>
                      {monthTotals.map((total, i) => (
                        <td key={i} className="px-3 py-3 text-center border-r border-gray-100">
                          {total > 0 ? (
                            <span className="text-gray-800 font-bold">₹{total.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right text-gold font-bold text-sm bg-gold/10">
                        ₹{grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Team Description Box */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-700">Team Description / Notes</p>
                <p className="text-xs text-gray-400 mt-0.5">{selectedTeam.teamName}</p>
              </div>
              <button
                onClick={saveDescription}
                disabled={savingDesc}
                className="px-4 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold-hover disabled:opacity-50"
              >
                {savingDesc ? 'Saving...' : 'Save'}
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Add notes or a description for this team..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold resize-none text-gray-700 placeholder-gray-300"
            />
          </div>
        </>
      )}

      {/* Placeholder when nothing selected */}
      {!selectedTeam && !loading && (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-sm">Select a chit scheme and team to view the payment report.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
