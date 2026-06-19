import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Eye, Printer, XCircle, X } from 'lucide-react';
import ConfirmModal from '../ui/ConfirmModal';
import { api } from '../../lib/api';

export default function BookingManagement({ currentUser, bookingHistory, showToast, globalSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewingBooking, setViewingBooking] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  let bookings = bookingHistory || [];
  if (currentUser?.role === 'operator') {
    bookings = bookings.filter(b => b.outboundTicket?.operator === currentUser.operatorName);
  }

  const filteredBookings = bookings.filter(b => {
    const activeSearch = globalSearch || searchTerm;
    const matchesSearch = b.bookingId?.toLowerCase().includes(activeSearch.toLowerCase()) || 
                          b.contact?.name?.toLowerCase().includes(activeSearch.toLowerCase());
    const matchesStatus = filterStatus === 'All' || b.paymentStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const confirmCancel = async () => {
    if (!confirmModal.booking) return;
    try {
      const bookingId = confirmModal.booking.bookingId;
      await api.set(`bookings/${bookingId}/paymentStatus`, 'DIBATALKAN');
      if (confirmModal.booking.userId) {
        await api.set(`users/${confirmModal.booking.userId}/bookings/${bookingId}/paymentStatus`, 'DIBATALKAN');
      }
      showToast('Booking berhasil dibatalkan', 'success');
      setConfirmModal({ isOpen: false, booking: null });
      setViewingBooking(null);
    } catch (error) {
      showToast('Gagal membatalkan booking', 'error');
    }
  };

  const handleCancelBooking = (booking) => {
    setConfirmModal({ isOpen: true, booking });
  };

  const handlePrint = (booking) => {
    // Generate a simple print view
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Ticket - ${booking.bookingId}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; }
          .ticket { border: 2px dashed #ccc; padding: 20px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h2>MANTARA Speedboat Ticket</h2>
            <p>Kode Booking: <strong>${booking.bookingId}</strong></p>
          </div>
          <div class="row"><span>Operator:</span> <span class="bold">${booking.operator}</span></div>
          <div class="row"><span>Rute:</span> <span class="bold">${booking.origin} &rarr; ${booking.destination}</span></div>
          <div class="row"><span>Jadwal:</span> <span class="bold">${booking.bookingDate} | ${booking.departTime}</span></div>
          <div class="row"><span>Status:</span> <span class="bold">${booking.paymentStatus}</span></div>
          <hr/>
          <h3>Daftar Penumpang</h3>
          <ul>
            ${booking.passengers ? booking.passengers.map(p => `<li>${p.name} (Kursi: ${p.seat || '-'})</li>`).join('') : '<li>-</li>'}
          </ul>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
          
          {/* Header Actions */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari Kode / Nama..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all"
                />
              </div>
              
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-sm font-medium focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none appearance-none cursor-pointer"
                >
                  <option value="All">Semua Status</option>
                  <option value="LUNAS">LUNAS</option>
                  <option value="MENUNGGU PEMBAYARAN">MENUNGGU PEMBAYARAN</option>
                  <option value="DIBATALKAN">DIBATALKAN</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Kode & Info</th>
                  <th className="py-4 px-4">Operator</th>
                  <th className="py-4 px-4">Jadwal & Kursi</th>
                  <th className="py-4 px-4">Total & Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredBookings.map((b, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={b.bookingId} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">{b.bookingId}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{b.buyerName || '-'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs font-bold text-slate-700">{b.outboundTicket?.operator || '-'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-700">{b.outboundDate} | {b.outboundTicket?.departTime}</div>
                      <div className="text-xs font-semibold text-slate-400 mt-0.5">{b.passengers?.length || 0} Penumpang</div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-black text-slate-900 mb-1">Rp {(b.finalPaid || 0).toLocaleString('id-ID')}</p>
                      {b.paymentStatus === 'LUNAS' ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Lunas</span>
                      ) : b.paymentStatus === 'DIBATALKAN' ? (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Dibatalkan</span>
                      ) : (
                        <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Pending</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button onClick={() => setViewingBooking(b)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition flex items-center justify-center">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePrint(b)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition flex items-center justify-center">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleCancelBooking(b)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-500 transition flex items-center justify-center">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            
            {filteredBookings.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-semibold text-sm">
                Tidak ada data pemesanan.
              </div>
            )}
          </div>
        </div>

        <ConfirmModal 
          isOpen={confirmModal.isOpen} 
          onClose={() => setConfirmModal({ isOpen: false, id: null })}
          onConfirm={confirmCancel}
          title="Batalkan Booking"
          message="Apakah Anda yakin ingin membatalkan booking ini? Aksi ini tidak dapat dibatalkan."
          confirmText="Ya, Batalkan"
          cancelText="Tutup"
          isDestructive={true}
        />
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingBooking && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingBooking(null)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto max-h-full">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h2 className="text-lg font-black text-slate-800">Detail Pemesanan</h2>
                  <button onClick={() => setViewingBooking(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 max-h-[70vh]">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400">Kode Booking</p>
                      <p className="text-sm font-black text-slate-800">{viewingBooking.bookingId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400">Status</p>
                      <p className="text-sm font-black text-slate-800">{viewingBooking.paymentStatus}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400">Rute</p>
                      <p className="text-sm font-bold text-slate-800">{viewingBooking.origin} &rarr; {viewingBooking.destination}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400">Operator</p>
                      <p className="text-sm font-bold text-slate-800">{viewingBooking.outboundTicket?.operator}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400">Jadwal</p>
                      <p className="text-sm font-bold text-slate-800">{viewingBooking.outboundDate} | {viewingBooking.outboundTicket?.departTime} - {viewingBooking.outboundTicket?.arrivalTime || 'Selesai'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400">Batas Pembayaran</p>
                      <p className="text-sm font-bold text-rose-500">-</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400">Pemesan</p>
                      <p className="text-sm font-bold text-slate-800">{viewingBooking.buyerName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400">No. Telepon</p>
                      <p className="text-sm font-bold text-slate-800">{viewingBooking.buyerPhone}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Daftar Penumpang & Kursi</h3>
                    <div className="space-y-2">
                      {viewingBooking.passengers?.map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-sm font-bold text-slate-700">{p.name}</p>
                            <p className="text-[10px] font-semibold text-slate-500">
                              Gender: {String(p.gender || '').toUpperCase() === 'L' ? 'Laki-laki' : String(p.gender || '').toUpperCase() === 'P' ? 'Perempuan' : p.gender || '-'}
                            </p>
                          </div>
                          <span className="text-xs font-black text-primary bg-sky-400/10 px-3 py-1.5 rounded border border-sky-400/20">Kursi: {p.seatOutbound || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
