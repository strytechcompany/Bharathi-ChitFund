import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArchive, FiArrowRight, FiCheckCircle, FiDownload, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import chitService from '../services/chitService';
import teamService from '../services/teamService';
import memberService from '../services/memberService';
import paymentService from '../services/paymentService';
import { downloadTeamReport } from '../services/dataSyncService';

const Completed = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        chitService.getAll().catch(() => []),
        teamService.getAll().catch(() => [])
      ]);
      setSchemes(s.filter(scheme => scheme.status === 'completed'));
      setTeams(t.filter(team => team.status === 'completed'));
    } catch (err) {
      toast.error('Failed to load completed records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDeleteTeam = async (id) => {
    if (!confirm('Delete this completed team?')) return;
    try {
      await teamService.remove(id);
      toast.success('Team deleted');
      load();
    } catch {
      toast.error('Failed to delete team');
    }
  };

  const handleDownloadTeam = async (team) => {
    toast.info('Preparing download...');
    try {
      const members = await memberService.getAll(team._id).catch(() => []);
      const payments = await paymentService.getAll({ team: team._id }).catch(() => []);
      const memberPayments = {};
      payments.forEach(p => {
        const mid = typeof p.member === 'object' ? p.member._id : p.member;
        if (!memberPayments[mid]) memberPayments[mid] = [];
        memberPayments[mid].push(p);
      });
      const success = downloadTeamReport({ team, members, memberPayments });
      if (success) toast.success('Downloaded successfully!');
      else toast.error('Failed to generate report');
    } catch {
      toast.error('Failed to prepare download data');
    }
  };

  const handleRestoreScheme = async (id) => {
    if (!confirm('Restore this scheme to active?')) return;
    try {
      await chitService.update(id, { status: 'active' });
      toast.success('Scheme restored to active');
      load();
    } catch {
      toast.error('Failed to restore scheme');
    }
  };

  const TIER_COLOR = { BRONZE: 'bg-amber-100 text-amber-700', SILVER: 'bg-slate-100 text-slate-600', GOLD: 'bg-yellow-100 text-yellow-700', PLATINUM: 'bg-gold text-white' };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <FiArchive size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Completed Records</h2>
          <p className="text-sm text-gray-500">Archive of successfully finished teams and chit schemes.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading completed records...</div>
      ) : (
        <div className="space-y-8">
          
          {/* Completed Teams Section */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiCheckCircle className="text-green-500" /> Completed Teams ({teams.length})
            </h3>
            {teams.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                No completed teams yet.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-5">
                {teams.map(t => (
                  <div key={t._id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col opacity-80 hover:opacity-100">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-800">{t.teamName}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-green-100 text-green-700">Finished</span>
                    </div>
                    <div className="flex-grow space-y-1 mt-2">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Scheme ID</p>
                      <p className="text-sm font-semibold text-gray-700 truncate">{typeof t.chitScheme === 'object' ? t.chitScheme.name : t.chitScheme}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <button onClick={() => navigate(`/teams/${t._id}`)} className="flex items-center gap-1 text-gold text-xs font-semibold hover:underline">
                        <span>View Details</span> <FiArrowRight size={12} />
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => handleDownloadTeam(t)} className="p-1.5 text-gray-400 hover:text-green-600 border border-transparent hover:border-green-200 rounded" title="Download Excel">
                          <FiDownload size={14} />
                        </button>
                        <button onClick={() => handleDeleteTeam(t._id)} className="p-1.5 text-gray-400 hover:text-red-600 border border-transparent hover:border-red-200 rounded" title="Delete Team">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed Schemes Section */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiCheckCircle className="text-blue-500" /> Completed Schemes ({schemes.length})
            </h3>
            {schemes.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                No completed chit schemes yet.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-5">
                {schemes.map(s => (
                  <div key={s._id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all opacity-80 hover:opacity-100">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${TIER_COLOR[s.tier] || TIER_COLOR.BRONZE}`}>{s.tier} TIER</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-700">Finished</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{s.name}</h3>
                    <p className="text-2xl font-bold text-gray-400 mb-4">₹{Number(s.amount).toLocaleString()}</p>
                    <div className="pt-3 border-t border-gray-100 flex justify-end">
                      <button onClick={() => handleRestoreScheme(s._id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        <FiRefreshCw size={12} /> Restore to Active
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
};

export default Completed;
