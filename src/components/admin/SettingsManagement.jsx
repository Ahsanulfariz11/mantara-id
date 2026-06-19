import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings, Globe, Shield, CreditCard, Mail } from 'lucide-react';
import { api, subscribeToNode } from '../../lib/api';

export default function SettingsManagement({ showToast }) {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    siteName: 'MANTARA Speedboat',
    logoUrl: '',
    contactPhone: '+62 811 1234 5678',
    contactEmail: 'admin@mantara.com',
    midtransServerKey: '',
    midtransClientKey: '',
    adminName: 'Super Admin',
    adminEmail: 'admin@mantara.com'
  });

  useEffect(() => {
    const unsubscribe = subscribeToNode('settings', (data) => {
      if (data) {
        setFormData(prev => ({ ...prev, ...data }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.set('settings', formData);
      showToast('Pengaturan berhasil disimpan!', 'success');
    } catch (error) {
      showToast('Gagal menyimpan pengaturan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
      
      {/* Settings Navigation */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-3">
          <button 
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'general' ? 'bg-sky-400/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Globe className="w-5 h-5" /> Umum
          </button>
          <button 
            onClick={() => setActiveTab('payment')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition mt-1 ${activeTab === 'payment' ? 'bg-sky-400/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <CreditCard className="w-5 h-5" /> Pembayaran
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition mt-1 ${activeTab === 'account' ? 'bg-sky-400/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Shield className="w-5 h-5" /> Akun Admin
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <Settings className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-black text-slate-800">
            {activeTab === 'general' ? 'Pengaturan Umum' : activeTab === 'payment' ? 'Gateway Pembayaran' : 'Profil Akun'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="p-6 sm:p-8 max-w-2xl">
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Nama Website</label>
                <input type="text" name="siteName" value={formData.siteName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">URL Logo</label>
                <input type="text" name="logoUrl" value={formData.logoUrl} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition" placeholder="https://" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> Email Kontak</label>
                  <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Nomor Telepon</label>
                  <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition" />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payment' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-orange-800 text-sm font-medium">
                <strong>Catatan:</strong> Saat ini sistem berjalan pada Mode Sandbox menggunakan API Key Server-Side. Untuk produksi, pastikan konfigurasi di `server/server.js`.
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Midtrans Server Key</label>
                <input type="password" name="midtransServerKey" value={formData.midtransServerKey} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition" placeholder="SB-Mid-server-..." />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Midtrans Client Key</label>
                <input type="text" name="midtransClientKey" value={formData.midtransClientKey} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition" placeholder="SB-Mid-client-..." />
              </div>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Nama Admin</label>
                <input type="text" name="adminName" value={formData.adminName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Email Admin</label>
                <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition" />
              </div>
            </motion.div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-primary hover:bg-blue-900 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
