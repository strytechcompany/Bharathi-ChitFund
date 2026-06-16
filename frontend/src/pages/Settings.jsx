import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiSettings, FiLock, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';
import authService from '../services/authService';

const DEFAULT_SETTINGS = {
  firmName: 'Bharathi Chit Funds',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata',
  language: 'English',
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [appSettings, setAppSettings] = useState(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  // Security Form
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    // Load defaults from local storage if any
    const saved = localStorage.getItem('bharathi_app_settings');
    if (saved) {
      try {
        setAppSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        // ignore parsing error
      }
    }
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    // Simulate network delay
    setTimeout(() => {
      localStorage.setItem('bharathi_app_settings', JSON.stringify(appSettings));
      toast.success('Settings saved successfully');
      setSavingSettings(false);
    }, 600);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) {
      return toast.error('New passwords do not match');
    }
    if (passForm.new.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setSavingPass(true);
    try {
      // Small simulated delay for realistic feel
      await new Promise(r => setTimeout(r, 600));
      authService.changePassword(passForm.current, passForm.new);
      toast.success('Password updated successfully');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSavingPass(false);
    }
  };

  const togglePass = (field) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
          <FiSettings size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <p className="text-sm text-gray-500">Manage application defaults and security</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'general' ? 'bg-gold text-white shadow-md shadow-gold/20' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <FiSettings size={16} /> App Defaults
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'security' ? 'bg-gold text-white shadow-md shadow-gold/20' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <FiLock size={16} /> Security
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          
          {/* GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Application Defaults</h3>
              <form onSubmit={handleSaveSettings} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Firm Name</label>
                  <input
                    type="text"
                    value={appSettings.firmName}
                    onChange={(e) => setAppSettings({ ...appSettings, firmName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Currency Symbol</label>
                  <input
                    type="text"
                    value={appSettings.currencySymbol}
                    onChange={(e) => setAppSettings({ ...appSettings, currencySymbol: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Timezone</label>
                  <select
                    value={appSettings.timezone}
                    onChange={(e) => setAppSettings({ ...appSettings, timezone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold focus:bg-white transition-all"
                  >
                    <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Default Language</label>
                  <select
                    value={appSettings.language}
                    onChange={(e) => setAppSettings({ ...appSettings, language: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold focus:bg-white transition-all"
                  >
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white font-semibold text-sm rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <FiSave /> {savingSettings ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY SETTINGS */}
          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Change Password</h3>
              <form onSubmit={handleSavePassword} className="space-y-5 max-w-md">
                
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPass.current ? 'text' : 'password'}
                      value={passForm.current}
                      onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
                      required
                      className="w-full pl-4 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => togglePass('current')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass.current ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input
                      type={showPass.new ? 'text' : 'password'}
                      value={passForm.new}
                      onChange={(e) => setPassForm({ ...passForm, new: e.target.value })}
                      required
                      minLength={6}
                      className="w-full pl-4 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => togglePass('new')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass.new ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPass.confirm ? 'text' : 'password'}
                      value={passForm.confirm}
                      onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                      required
                      minLength={6}
                      className="w-full pl-4 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => togglePass('confirm')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass.confirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={savingPass}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gold text-white font-semibold text-sm rounded-xl hover:bg-gold-hover transition-colors disabled:opacity-50"
                  >
                    <FiLock /> {savingPass ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
