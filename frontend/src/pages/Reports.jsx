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
  const [teams, setTeams] = useState([]);
  const [membersMap, setMembersMap] = useState({}); // { teamId: [members] }
  const [paymentMap, setPaymentMap] = useState({}); // { teamId: { memberId: { 'month_year': [payments] } } }
  
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [allSchemes, allTeams, allMembers, allPayments] = await Promise.all([
        chitService.getAll().catch(() => []),
        teamService.getAll().catch(() => []),
        memberService.getAll().catch(() => []), // memberService.getAll without args should fetch all? 
        // Wait, does memberService.getAll() without args fetch all members? Let's check. If not, we might have to fetch per team.
        // Actually, backend memberController.getAll() without args returns all members.
        paymentService.getAll().catch(() => []) // Gets all payments
      ]);

      setSchemes(allSchemes);
      setTeams(allTeams);

      // Group members by team
      const memsByTeam = {};
      allMembers.forEach(m => {
        const tid = String(m.team?._id || m.team);
        if (!memsByTeam[tid]) memsByTeam[tid] = [];
        memsByTeam[tid].push(m);
      });
      setMembersMap(memsByTeam);

      // Group payments by team -> member -> month_year
      const payMap = {};
      allPayments.forEach(p => {
        const tid = String(p.team?._id || p.team);
        const mid = String(p.member?._id || p.member);
        const key = `${p.month}_${p.year}`;
        
        if (!payMap[tid]) payMap[tid] = {};
        if (!payMap[tid][mid]) payMap[tid][mid] = {};
        if (!payMap[tid][mid][key]) payMap[tid][mid][key] = [];
        
        payMap[tid][mid][key].push(p);
      });
      setPaymentMap(payMap);

    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Filter the teams based on dropdown selection
  const visibleTeams = teams.filter(t => {
    if (selectedTeamId && t._id !== selectedTeamId) return false;
    const schemeId = String(t.chitScheme?._id || t.chitScheme);
    if (selectedSchemeId && schemeId !== selectedSchemeId) return false;
    return t.status !== 'completed'; // Optionally hide completed teams, or keep them? We'll keep them but usually it's better to show active. We'll show all active by default.
  }).filter(t => t.status !== 'completed'); // Only show active teams

  const handleSchemeChange = (schemeId) => {
    setSelectedSchemeId(schemeId);
    setSelectedTeamId('');
  };

  // Render individual team report table
  const renderTeamReport = (team) => {
    const teamMembers = membersMap[String(team._id)] || [];
    const teamPayments = paymentMap[String(team._id)] || {};
    const months = genMonths(team.startDate, team.chitScheme?.durationMonths);
    const schemeName = schemes.find(s => String(s._id) === String(team.chitScheme?._id || team.chitScheme))?.name || '';

    // Per-month totals (paid only)
    const monthTotals = months.map(({ month, year }) =>
      teamMembers.reduce((sum, m) => {
        const pArr = teamPayments[String(m._id)]?.[`${month}_${year}`] || [];
        const mSum = pArr.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);
        return sum + mSum;
      }, 0)
    );

    // Per-member totals
    const memberTotals = teamMembers.map(m =>
      months.reduce((sum, { month, year }) => {
        const pArr = teamPayments[String(m._id)]?.[`${month}_${year}`] || [];
        const mSum = pArr.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);
        return sum + mSum;
      }, 0)
    );

    const grandTotal = monthTotals.reduce((s, v) => s + v, 0);

    return (
      <div key={team._id} className="bg-white rounded-xl border border-gray-100 mb-8 overflow-hidden shadow-sm">
        {/* Report title bar */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <p className="font-bold text-gray-800 text-base">{team.teamName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {schemeName}
              {team.startDate && ` · Started ${new Date(team.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
              {` · ${teamMembers.length} members`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Grand Total</p>
            <p className="text-xl font-bold text-gold">₹{grandTotal.toLocaleString()}</p>
          </div>
        </div>

        {teamMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No members in this team yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 sticky left-0 bg-gray-50 z-20 w-8">#</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 sticky left-8 bg-gray-50 z-20 min-w-[140px]">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 min-w-[110px]">Phone</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[130px]">Address</th>
                  {months.map(({ label }) => (
                    <th key={label} className="text-center px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 min-w-[80px]">
                      {label}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/5 min-w-[90px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m, idx) => (
                  <tr key={m._id} className={`border-b border-gray-50 hover:bg-gray-50/60 ${idx % 2 === 0 ? '' : 'bg-gray-50/20'}`}>
                    <td className="px-3 py-3 text-gray-400 text-center border-r border-gray-200 sticky left-0 bg-white z-10">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 border-r border-gray-100 sticky left-8 bg-white z-10 min-w-[140px]">{m.fullName}</td>
                    <td className="px-4 py-3 text-gray-600 border-r border-gray-100">{m.mobile}</td>
                    <td className="px-4 py-3 text-gray-500 border-r border-gray-200 max-w-[130px] truncate">{m.address || '—'}</td>
                    {months.map(({ month, year, label }) => {
                      const pArr = teamPayments[String(m._id)]?.[`${month}_${year}`] || [];
                      const paidSum = pArr.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);
                      const hasDue = pArr.some(p => p.status === 'due' || p.status === 'unpaid');
                      const hasPaid = paidSum > 0;
                      return (
                        <td key={label} className="px-3 py-3 text-center border-r border-gray-50">
                          {hasPaid ? (
                            <span className="text-green-600 font-semibold">₹{paidSum.toLocaleString()}</span>
                          ) : hasDue ? (
                            <span className="text-red-400 font-semibold text-[10px] uppercase">DUE</span>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-bold text-gray-800 bg-gold/5">₹{memberTotals[idx].toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="px-3 py-3 border-r border-gray-200 sticky left-0 bg-gray-50 z-10" />
                  <td className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 border-r border-gray-100 sticky left-8 bg-gray-50 z-10 min-w-[140px]" colSpan={3}>
                    Monthly Total
                  </td>
                  {monthTotals.map((total, i) => (
                    <td key={i} className="px-3 py-3 text-center border-r border-gray-100">
                      {total > 0 ? <span className="text-gray-800 font-bold">₹{total.toLocaleString()}</span> : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right text-gold font-bold text-sm bg-gold/10">₹{grandTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports Dashboard</h2>
        <p className="text-sm text-gray-500">Comprehensive overview of all active teams and payments.</p>
      </div>

      {/* Scheme + Team selectors (now act as filters) */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Filter by Scheme</label>
            <select
              value={selectedSchemeId}
              onChange={e => handleSchemeChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="">All Chit Schemes</option>
              {schemes.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Filter by Team</label>
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              disabled={teams.length === 0}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold disabled:opacity-60"
            >
              <option value="">All Teams</option>
              {teams.filter(t => !selectedSchemeId || String(t.chitScheme?._id || t.chitScheme) === selectedSchemeId).map(t => (
                <option key={t._id} value={t._id}>{t.teamName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading comprehensive report data...</div>
      ) : visibleTeams.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-sm">No teams found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTeams.map(team => renderTeamReport(team))}
        </div>
      )}
    </div>
  );
};

export default Reports;
