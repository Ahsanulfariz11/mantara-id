import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

export default function PaymentManagement({ bookingHistory, showToast, globalSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract payment records from bookings
  const payments = useMemo(() => {
    return (bookingHistory || []).map(b => ({
      transactionId: b.transactionId || `TRX-${b.bookingId}`, // Fallback for mock/old data
      bookingId: b.bookingId,
      amount: b.finalPaid || 0,
      type: b.paymentType || 'qris',
      status: b.paymentStatus,
      date: b.bookingDate,
      userId: b.userId
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bookingHistory]);

  const filteredPayments = payments.filter(p => {
    const activeSearch = globalSearch || searchTerm;
    const matchesSearch = p.transactionId?.toLowerCase().includes(activeSearch.toLowerCase()) || 
                          p.bookingId?.toLowerCase().includes(activeSearch.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleVerifyPayment = async (payment) => {
    // Only verify payments that have an actual midtrans order_id (which we map as bookingId in this app's architecture)
    setIsRefreshing(true);
    try {
      // Assuming server is running on localhost:3001 as defined in App.jsx
      const response = await fetch(`http://localhost:3001/api/payment/status/${payment.bookingId}`);
      const data = await response.json();

      if (data.transaction_status) {
        let newStatus = payment.status;
        if (['settlement', 'capture'].includes(data.transaction_status)) {
          newStatus = 'LUNAS';
        } else if (['cancel', 'deny', 'expire'].includes(data.transaction_status)) {
          newStatus = 'DIBATALKAN';
        }

        if (newStatus !== payment.status) {
          // Update database
          await api.set(`bookings/${payment.bookingId}/paymentStatus`, newStatus);
          if (payment.userId) {
            await api.set(`users/${payment.userId}/bookings/${payment.bookingId}/paymentStatus`, newStatus);
          }
          showToast(`Status pembayaran ${payment.bookingId} diperbarui menjadi ${newStatus}`, 'success');
        } else {
          showToast(`Status pembayaran ${payment.bookingId} tidak berubah (${newStatus})`, 'info');
        }
      } else {
        showToast('Transaksi tidak ditemukan di Midtrans', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Gagal memverifikasi status pembayaran dengan Midtrans', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshAll = async () => {
    // Refresh all pending payments
    const pendingPayments = payments.filter(p => p.status === 'MENUNGGU PEMBAYARAN');
    if (pendingPayments.length === 0) {
      showToast('Tidak ada transaksi pending untuk diverifikasi', 'info');
      return;
    }
    
    setIsRefreshing(true);
    let updatedCount = 0;

    for (const payment of pendingPayments) {
      try {
        const response = await fetch(`http://localhost:3001/api/payment/status/${payment.bookingId}`);
        if (response.ok) {
          const data = await response.json();
          let newStatus = payment.status;
          if (['settlement', 'capture'].includes(data.transaction_status)) newStatus = 'LUNAS';
          else if (['cancel', 'deny', 'expire'].includes(data.transaction_status)) newStatus = 'DIBATALKAN';

          if (newStatus !== payment.status) {
            await api.set(`bookings/${payment.bookingId}/paymentStatus`, newStatus);
            if (payment.userId) {
              await api.set(`users/${payment.userId}/bookings/${payment.bookingId}/paymentStatus`, newStatus);
            }
            updatedCount++;
          }
        }
      } catch (e) {
        // Silently skip on bulk refresh failure
      }
    }

    setIsRefreshing(false);
    showToast(`Selesai memverifikasi. ${updatedCount} transaksi diperbarui.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Midtrans Status Box */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-[24px] shadow-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Midtrans Payment Gateway</h2>
            <p className="text-xs font-medium text-slate-300">Sistem terhubung ke mode Sandbox Midtrans.</p>
          </div>
        </div>
        <button 
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Sinkronisasi Otomatis
        </button>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Header Actions */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari Transaksi / Booking..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-72 bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all"
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
                <option value="LUNAS">Berhasil (LUNAS)</option>
                <option value="MENUNGGU PEMBAYARAN">Pending (MENUNGGU)</option>
                <option value="DIBATALKAN">Gagal (DIBATALKAN)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">ID Transaksi & Booking</th>
                <th className="py-4 px-4">Tanggal</th>
                <th className="py-4 px-4">Metode</th>
                <th className="py-4 px-4">Nominal</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredPayments.map((p, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx} 
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800">{p.transactionId}</p>
                    <p className="text-[10px] font-bold text-primary mt-0.5 uppercase">Booking: {p.bookingId}</p>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-600">
                    {p.date}
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wider">{p.type}</span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-black text-slate-900">Rp {p.amount.toLocaleString('id-ID')}</p>
                  </td>
                  <td className="py-4 px-4">
                    {p.status === 'LUNAS' ? (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-extrabold px-2 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sukses
                      </span>
                    ) : p.status === 'DIBATALKAN' ? (
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-extrabold px-2 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Gagal
                      </span>
                    ) : (
                      <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-extrabold px-2 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => handleVerifyPayment(p)}
                      disabled={isRefreshing}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 hover:text-primary transition disabled:opacity-50 shadow-sm"
                    >
                      Cek Status
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredPayments.length === 0 && (
            <div className="py-12 text-center text-slate-400 font-semibold text-sm">
              Tidak ada data pembayaran.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
