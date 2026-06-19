import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Calendar as CalendarIcon, TrendingUp, Users, Ticket, Crown } from 'lucide-react';

export default function ReportManagement({ currentUser, bookingHistory, showToast }) {
  const [reportType, setReportType] = useState('monthly'); // daily, weekly, monthly

  const reports = useMemo(() => {
    let sales = 0;
    let tickets = 0;
    let passengers = 0;
    const ops = {};

    const now = new Date();
    
    let userBookings = bookingHistory || [];
    if (currentUser?.role === 'operator') {
      userBookings = userBookings.filter(b => b.outboundTicket?.operator === currentUser.operatorName);
    }
    
    userBookings.filter(b => b.paymentStatus === 'LUNAS').forEach(b => {
      const bDate = new Date(b.outboundDate || Date.now());
      
      let include = false;
      if (reportType === 'daily') {
        include = bDate.toDateString() === now.toDateString();
      } else if (reportType === 'weekly') {
        const diff = (now - bDate) / (1000 * 60 * 60 * 24);
        include = diff <= 7;
      } else {
        include = bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
      }

      if (include) {
        sales += b.finalPaid || 0;
        tickets += 1;
        passengers += b.passengers ? b.passengers.length : 1;
        
        const operatorName = b.outboundTicket?.operator || 'Unknown';
        if (!ops[operatorName]) ops[operatorName] = 0;
        ops[operatorName] += b.passengers ? b.passengers.length : 1;
      }
    });

    let topOp = '-';
    let max = 0;
    for (const [op, count] of Object.entries(ops)) {
      if (count > max && op && op !== 'undefined' && op !== 'Unknown') {
        max = count;
        topOp = op;
      }
    }

    return { sales, tickets, passengers, topOperator: topOp };
  }, [bookingHistory, reportType]);

  const handleExport = (type) => {
    const validBookings = (bookingHistory || []).filter(b => b.paymentStatus === 'LUNAS');
    if (validBookings.length === 0) {
      if (window.showToast) window.showToast('Tidak ada data untuk diekspor pada periode ini.', 'error');
      else showToast('Tidak ada data untuk diekspor pada periode ini.', 'error');
      return;
    }

    if (type === 'excel') {
      // Basic CSV export
      const headers = ['Kode Booking', 'Operator', 'Rute', 'Tanggal', 'Pemesan', 'Total (Rp)'];
      const rows = validBookings.map(b => [
        b.bookingId, b.operator, `${b.origin} - ${b.destination}`, b.bookingDate, b.contact?.name, b.finalPaid || 0
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laporan_Penjualan_${reportType}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (window.showToast) window.showToast('Laporan Excel berhasil diunduh.', 'success');
    } else if (type === 'pdf') {
      window.print();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-400/10 flex items-center justify-center text-primary">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800">Periode Laporan</h2>
            <div className="flex bg-slate-100 p-1 rounded-lg mt-1">
              <button onClick={() => setReportType('daily')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${reportType === 'daily' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Harian</button>
              <button onClick={() => setReportType('weekly')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${reportType === 'weekly' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Mingguan</button>
              <button onClick={() => setReportType('monthly')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${reportType === 'monthly' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Bulanan</button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-bold transition">
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={() => handleExport('excel')} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-xl text-xs font-bold transition">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Penjualan</p>
          <h3 className="text-2xl font-black text-slate-800">Rp {(reports.sales).toLocaleString('id-ID')}</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
            <Ticket className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Tiket</p>
          <h3 className="text-2xl font-black text-slate-800">{reports.tickets}</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4 border border-purple-100">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Penumpang</p>
          <h3 className="text-2xl font-black text-slate-800">{reports.passengers}</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-4 border border-orange-100">
            <Crown className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Operator Terlaris</p>
          <h3 className="text-lg font-black text-slate-800 leading-tight">{reports.topOperator}</h3>
        </motion.div>

      </div>

      <div className="bg-slate-50 p-8 rounded-[24px] border border-slate-200 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
          <FileText className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-black text-slate-700">Preview Laporan Detail</h3>
        <p className="text-sm text-slate-500 max-w-md mt-2">Gunakan tombol Export di atas untuk mengunduh laporan penjualan terperinci lengkap dengan daftar transaksi dan penumpang dalam format PDF atau Excel.</p>
      </div>

    </div>
  );
}
