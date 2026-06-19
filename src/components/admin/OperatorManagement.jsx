import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Eye, MoreVertical, Building2, Phone, Mail, MapPin, X, Save, Ship } from 'lucide-react';
import { api, subscribeToNode } from '../../lib/api';
import ConfirmModal from '../ui/ConfirmModal';

export default function OperatorManagement({ showToast, globalSearch }) {
  const [operators, setOperators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    const unsubscribe = subscribeToNode('operators', (data) => {
      if (data) {
        const opsArray = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setOperators(opsArray);
      } else {
        setOperators([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const filteredOperators = operators.filter(op => {
    const activeSearch = globalSearch || searchTerm;
    const matchesSearch = op.name?.toLowerCase().includes(activeSearch.toLowerCase()) || 
                          op.email?.toLowerCase().includes(activeSearch.toLowerCase());
    const matchesStatus = filterStatus === 'All' || op.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const confirmDelete = async () => {
    try {
      await api.deleteItem('operators', confirmModal.id);
      showToast('Operator berhasil dihapus.', 'info');
    } catch (error) {
      showToast('Gagal menghapus operator.', 'error');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const handleAdd = () => {
    setEditingOperator(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (op) => {
    setEditingOperator(op);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Header Actions */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari operator..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all"
            />
          </div>

          <button 
            onClick={handleAdd}
            className="bg-primary hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Operator
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Nama Operator</th>
                <th className="py-4 px-4">Kontak</th>
                <th className="py-4 px-4">Alamat</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredOperators.map((op, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={op.id} 
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {op.logo ? (
                          <img src={op.logo} alt={op.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <span className="font-bold text-slate-800">{op.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400"/> {op.phone || '-'}</span>
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400"/> {op.email || '-'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-xs font-medium text-slate-500 max-w-[200px] truncate">{op.address || '-'}</p>
                  </td>
                  <td className="py-4 px-4">
                    {op.status === 'Active' ? (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-extrabold px-2 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-extrabold px-2 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button onClick={() => handleEdit(op)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition flex items-center justify-center">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(op.id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-500 transition flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredOperators.length === 0 && (
            <div className="py-12 text-center text-slate-400 font-semibold text-sm">
              Tidak ada data operator.
            </div>
          )}
        </div>
      </div>

      <OperatorDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        editingOperator={editingOperator}
        showToast={showToast}
      />
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Hapus Operator"
        message="Apakah Anda yakin ingin menghapus operator ini? Semua data terkait juga dapat terpengaruh."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDestructive={true}
      />
    </div>
  );
}

function OperatorDrawer({ isOpen, onClose, editingOperator, showToast }) {
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    phone: '',
    email: '',
    address: '',
    status: 'Active',
    loginEmail: '',
    loginPassword: ''
  });

  useEffect(() => {
    if (editingOperator) {
      setFormData(editingOperator);
    } else {
      setFormData({ name: '', logo: '', phone: '', email: '', address: '', status: 'Active', loginUsername: '', loginPassword: '' });
    }
  }, [editingOperator, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const id = editingOperator ? editingOperator.id : `op_${Date.now()}`;
      await api.saveItem('operators', id, formData);
      showToast('Data operator berhasil disimpan.', 'success');
      onClose();
    } catch (error) {
      showToast('Gagal menyimpan data.', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col border-l border-slate-100">
            <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-800">{editingOperator ? 'Edit Operator' : 'Tambah Operator'}</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <form id="operator-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Nama Operator</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Profil Operator (Logo)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Ship className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, logo: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-sky-50 file:text-primary hover:file:bg-sky-100 transition cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">No. Telepon</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Email Kontak</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Alamat Lengkap</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none resize-none"></textarea>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none appearance-none cursor-pointer">
                    <option value="Active">Aktif</option>
                    <option value="Inactive">Nonaktif</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Akses Login Admin Speedboat</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                      <input type="text" name="loginUsername" value={formData.loginUsername || ''} onChange={handleChange} placeholder="Contoh: menaraindah" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Password Login</label>
                      <input type="text" name="loginPassword" value={formData.loginPassword || ''} onChange={handleChange} placeholder="Minimal 6 karakter" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-2 gap-4">
              <button type="button" onClick={onClose} className="py-3 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">Batal</button>
              <button type="submit" form="operator-form" className="py-3 px-4 rounded-xl bg-primary hover:bg-blue-900 text-white text-sm font-bold shadow-lg shadow-primary/20 transition flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
