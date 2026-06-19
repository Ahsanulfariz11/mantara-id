import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Eye, UserCircle, Calendar, X } from 'lucide-react';

export default function PassengerManagement({ currentUser, bookingHistory, globalSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperator, setFilterOperator] = useState('All');
  const [viewingPassenger, setViewingPassenger] = useState(null);

  // Extract passengers from bookings
  const { passengers, operators } = useMemo(() => {
    const passList = [];
    const opSet = new Set();
    
    let userBookings = bookingHistory || [];
    if (currentUser?.role === 'operator') {
      userBookings = userBookings.filter(b => b.outboundTicket?.operator === currentUser.operatorName);
    }

    userBookings.filter(b => b.paymentStatus === 'LUNAS').forEach(b => {
      opSet.add(b.outboundTicket?.operator);
      if (b.passengers) {
        b.passengers.forEach((p, idx) => {
          passList.push({
            id: `${b.bookingId}-${idx}`,
            name: p.name,
            nik: p.nik,
            gender: p.gender || '-',
            phone: b.buyerPhone || '-',
            contactName: b.buyerName || '-',
            operator: b.outboundTicket?.operator || '-',
            bookingDate: b.outboundDate || '-',
            departTime: b.outboundTicket?.departTime || '-',
            arrivalTime: b.outboundTicket?.arrivalTime || 'Selesai',
            origin: b.origin || '-',
            destination: b.destination || '-',
            seat: p.seatOutbound || '-',
            bookingId: b.bookingId,
            status: b.paymentStatus
          });
        });
      }
    });

    return { 
      passengers: passList, 
      operators: Array.from(opSet) 
    };
  }, [bookingHistory]);

  const filteredPassengers = passengers.filter(p => {
    const activeSearch = globalSearch || searchTerm;
    const matchesSearch = p.name?.toLowerCase().includes(activeSearch.toLowerCase()) || 
                          p.nik?.includes(activeSearch);
    const matchesOperator = filterOperator === 'All' || p.operator === filterOperator;
    return matchesSearch && matchesOperator;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Header Actions */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari Nama / NIK..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all"
              />
            </div>
            
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-sm font-medium focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none appearance-none cursor-pointer"
              >
                <option value="All">Semua Operator</option>
                {operators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Nama & NIK</th>
                <th className="py-4 px-4">Kontak</th>
                <th className="py-4 px-4">Jadwal & Operator</th>
                <th className="py-4 px-4">Kursi</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredPassengers.map((p, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={p.id} 
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <UserCircle className="w-8 h-8 text-slate-300" />
                      <div>
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{p.nik}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-700">
                    {p.phone}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1"><Calendar className="w-3 h-3"/> {p.bookingDate} {p.departTime}</div>
                    <div className="text-[10px] font-semibold text-primary mt-0.5">{p.operator}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">{p.seat}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button onClick={() => setViewingPassenger(p)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition flex items-center justify-center">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredPassengers.length === 0 && (
            <div className="py-12 text-center text-slate-400 font-semibold text-sm">
              Tidak ada data penumpang (Pastikan booking berstatus LUNAS).
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingPassenger && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingPassenger(null)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto max-h-full">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="text-lg font-black text-slate-800">Detail Penumpang</h2>
                <button onClick={() => setViewingPassenger(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                  <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-3 border border-slate-200">
                    <UserCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">{viewingPassenger.name}</h3>
                  <p className="text-sm font-semibold text-slate-400">{viewingPassenger.nik}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Kode Booking</p>
                    <p className="text-sm font-black text-slate-800">{viewingPassenger.bookingId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Nomor Kursi</p>
                    <p className="text-sm font-black text-primary">{viewingPassenger.seat}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Rute Perjalanan</p>
                    <p className="text-sm font-bold text-slate-800">{viewingPassenger.origin} &rarr; {viewingPassenger.destination}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Jadwal Keberangkatan</p>
                    <p className="text-sm font-bold text-slate-800">{viewingPassenger.bookingDate}</p>
                    <p className="text-xs font-semibold text-slate-500">{viewingPassenger.departTime} - {viewingPassenger.arrivalTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Operator</p>
                    <p className="text-sm font-bold text-slate-800">{viewingPassenger.operator}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Kontak Pemesan</p>
                    <p className="text-sm font-bold text-slate-800">{viewingPassenger.contactName}</p>
                    <p className="text-xs font-semibold text-slate-500">{viewingPassenger.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status Pembayaran</p>
                    <p className="text-sm font-bold text-emerald-600 uppercase">{viewingPassenger.status}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
