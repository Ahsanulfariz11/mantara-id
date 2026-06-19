import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Clock, Users, Briefcase, MapPin } from 'lucide-react';

import { subscribeToNode } from '../../lib/api';

export default function ScheduleDrawer({ currentUser, isOpen, onClose, editingTicket, mode = 'edit', onSave }) {
  const [operators, setOperators] = useState([]);
  const [formData, setFormData] = useState({
    operator: '',
    type: 'Reguler',
    departTime: '08:00',
    arrivalTime: '09:15',
    basePrice: 250000,
    duration: '1j 15m',
    baggage: 15,
    ac: true,
    reclining: false,
    seatRows: 8,
    seatCols: 4
  });

  useEffect(() => {
    const unsubscribe = subscribeToNode('operators', (data) => {
      if (data) {
        const opsArray = Object.keys(data).map(key => data[key]);
        setOperators(opsArray);
        if (opsArray.length > 0 && !formData.operator) {
          setFormData(prev => ({...prev, operator: opsArray[0].name}));
        }
      } else {
        setOperators([{ name: 'Kaltara Express' }]); // fallback
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (editingTicket) {
      setFormData({
        operator: currentUser?.role === 'operator' ? currentUser.operatorName : (editingTicket.operator || (operators.length > 0 ? operators[0].name : 'Kaltara Express')),
        type: editingTicket.type || 'Reguler',
        departTime: editingTicket.departTime || '08:00',
        arrivalTime: editingTicket.arrivalTime || '09:15',
        basePrice: editingTicket.basePrice || 250000,
        duration: editingTicket.duration || '1j 15m',
        baggage: editingTicket.baggage || 15,
        ac: editingTicket.ac !== undefined ? editingTicket.ac : true,
        reclining: editingTicket.reclining || false,
        seatRows: editingTicket.seatRows || 8,
        seatCols: editingTicket.seatCols || 4
      });
    } else {
      setFormData({
        operator: currentUser?.role === 'operator' ? currentUser.operatorName : (operators.length > 0 ? operators[0].name : 'Kaltara Express'), 
        type: 'Reguler', departTime: '08:00', arrivalTime: '09:15',
        basePrice: 250000, duration: '1j 15m', baggage: 15, ac: true, reclining: false, seatRows: 8, seatCols: 4
      });
    }
  }, [editingTicket, isOpen, operators]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      basePrice: rawValue ? parseInt(rawValue, 10) : 0
    }));
  };

  const handleSeatConfigChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(numValue) ? '' : numValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isReadOnly = mode === 'view';
  const isConfigSeats = mode === 'config_seats';

  const getHeaderTitle = () => {
    if (isReadOnly) return 'Detail Jadwal Speedboat';
    if (isConfigSeats) return 'Konfigurasi Kursi Speedboat';
    return editingTicket ? 'Edit Jadwal Speedboat' : 'Tambah Jadwal Baru';
  };

  const getHeaderDesc = () => {
    if (isReadOnly) return 'Detail lengkap jadwal dan kapasitas speedboat.';
    if (isConfigSeats) return `Atur tata letak kursi untuk ${formData.operator || 'Speedboat'}.`;
    return 'Lengkapi form untuk manajemen jadwal.';
  };

  const previewRows = Math.min(Math.max(Number(formData.seatRows) || 0, 0), 20);
  const previewCols = Math.min(Math.max(Number(formData.seatCols) || 0, 0), 10);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col border-l border-slate-100"
          >
            {/* Header */}
            <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  {getHeaderTitle()}
                </h2>
                <p className="text-xs font-semibold text-slate-400">
                  {getHeaderDesc()}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <form id="schedule-form" onSubmit={handleSubmit} className="space-y-5">
                
                {!isConfigSeats && (
                  <>
                    {/* Operator & Class */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Operator</label>
                        <div className="relative">
                          <select 
                            name="operator" 
                            value={formData.operator} 
                            onChange={handleChange} 
                            disabled={currentUser?.role === 'operator' || isReadOnly}
                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none appearance-none cursor-pointer ${(currentUser?.role === 'operator' || isReadOnly) ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                          >
                            {operators.map((op, i) => (
                              <option key={i} value={op.name}>{op.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Kelas</label>
                        <select 
                          name="type" 
                          value={formData.type} 
                          onChange={handleChange} 
                          disabled={isReadOnly}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <option>Reguler</option>
                          <option>VIP</option>
                          <option>Carter</option>
                        </select>
                      </div>
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3"/> Berangkat</label>
                        <input 
                          type="time" 
                          name="departTime" 
                          value={formData.departTime} 
                          onChange={handleChange} 
                          required 
                          disabled={isReadOnly}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3"/> Tiba</label>
                        <input 
                          type="time" 
                          name="arrivalTime" 
                          value={formData.arrivalTime} 
                          onChange={handleChange} 
                          required 
                          disabled={isReadOnly}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                        />
                      </div>
                    </div>

                    {/* Price & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Harga Dasar (Rp)</label>
                        <input 
                          type="text" 
                          name="basePrice" 
                          value={formData.basePrice ? formData.basePrice.toLocaleString('id-ID') : ''} 
                          onChange={handlePriceChange} 
                          required 
                          disabled={isReadOnly}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-black text-slate-800 focus:ring-2 focus:ring-sky-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                          placeholder="0" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Durasi</label>
                        <input 
                          type="text" 
                          name="duration" 
                          value={formData.duration} 
                          onChange={handleChange} 
                          required 
                          disabled={isReadOnly}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                          placeholder="1j 15m" 
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Users className="w-3 h-3"/> Status</label>
                      <select 
                        disabled={isReadOnly}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <option>Active</option>
                        <option>Full</option>
                        <option>Cancelled</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Konfigurasi Kursi Speedboat */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Jumlah Baris</label>
                    <input 
                      type="number" 
                      name="seatRows" 
                      value={formData.seatRows} 
                      onChange={handleSeatConfigChange} 
                      required 
                      disabled={isReadOnly}
                      min="1" 
                      max="20" 
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                      placeholder="8" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Jumlah Kolom (Huruf)</label>
                    <input 
                      type="number" 
                      name="seatCols" 
                      value={formData.seatCols} 
                      onChange={handleSeatConfigChange} 
                      required 
                      disabled={isReadOnly}
                      min="1" 
                      max="10" 
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                      placeholder="4" 
                    />
                  </div>
                </div>

                {/* Seat Map Visual Preview */}
                {(isConfigSeats || isReadOnly) && (
                  <div className="mt-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Pratinjau Tata Letak Kursi</p>
                    <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-inner max-h-[260px] overflow-y-auto custom-scrollbar">
                      <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <span>Bagian Depan / Operator</span>
                        <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs">☸️</span>
                      </div>
                      
                      {previewRows > 0 && previewCols > 0 ? (
                        <div className="flex flex-col gap-2 items-center justify-center">
                          <div 
                            className="grid gap-2 justify-center" 
                            style={{ 
                              gridTemplateColumns: `repeat(${previewCols}, minmax(0, 1fr))` 
                            }}
                          >
                            {Array.from({ length: previewRows }).map((_, rIdx) => {
                              const rowNum = rIdx + 1;
                              return Array.from({ length: previewCols }).map((_, cIdx) => {
                                const colLetter = String.fromCharCode(65 + cIdx);
                                const seatId = `${rowNum}${colLetter}`;
                                return (
                                  <div 
                                    key={seatId} 
                                    className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/70 text-[9px] font-black text-primary flex items-center justify-center shadow-sm select-none"
                                    title={`Kursi ${seatId}`}
                                  >
                                    {seatId}
                                  </div>
                                );
                              });
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-center text-slate-400 py-4 font-medium">Tentukan baris & kolom untuk melihat pratinjau kursi</p>
                      )}
                    </div>
                  </div>
                )}

                {!isConfigSeats && (
                  /* Facilities */
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Fasilitas Tambahan</label>
                    <div className="flex gap-4">
                      <label className={`flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-100 transition ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        <input 
                          type="checkbox" 
                          name="ac" 
                          checked={formData.ac} 
                          onChange={handleChange} 
                          disabled={isReadOnly}
                          className="w-4 h-4 accent-primary rounded disabled:cursor-not-allowed" 
                        />
                        <span className="text-sm font-bold text-slate-700">Full AC</span>
                      </label>
                      <label className={`flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-100 transition ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        <input 
                          type="checkbox" 
                          name="reclining" 
                          checked={formData.reclining} 
                          onChange={handleChange} 
                          disabled={isReadOnly}
                          className="w-4 h-4 accent-primary rounded disabled:cursor-not-allowed" 
                        />
                        <span className="text-sm font-bold text-slate-700">Reclining Seat</span>
                      </label>
                    </div>
                  </div>
                )}

              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
              {isReadOnly ? (
                <button 
                  type="button" 
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  Tutup
                </button>
              ) : (
                <>
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    form="schedule-form"
                    className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-blue-900 text-white text-sm font-bold shadow-lg shadow-primary/20 transition flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isConfigSeats ? 'Simpan Kursi' : 'Simpan'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
