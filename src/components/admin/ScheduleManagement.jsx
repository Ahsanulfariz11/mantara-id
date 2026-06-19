import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Edit2, Trash2, Eye, MoreVertical, LayoutGrid } from 'lucide-react';

export default function ScheduleManagement({ currentUser, tickets, onAdd, onEdit, onView, onConfigSeats, onDelete, globalSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');

  let userTickets = tickets || [];
  if (currentUser?.role === 'operator') {
    userTickets = userTickets.filter(tk => tk.operator === currentUser.operatorName);
  }

  const filteredTickets = userTickets.filter(tk => {
    const activeSearch = globalSearch || searchTerm;
    const matchesSearch = tk.operator.toLowerCase().includes(activeSearch.toLowerCase());
    const matchesClass = filterClass === 'All' || tk.type === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="mt-6 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
      
      {/* Header Actions */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari operator..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all"
            />
          </div>
          
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-sm font-medium focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none appearance-none cursor-pointer"
            >
              <option value="All">Semua Kelas</option>
              <option value="Reguler">Reguler</option>
              <option value="VIP">VIP</option>
              <option value="Carter">Carter</option>
            </select>
          </div>
        </div>

        <button 
          onClick={onAdd}
          className="bg-primary hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Jadwal
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th className="py-4 px-6">Operator & Kelas</th>
              <th className="py-4 px-4">Waktu</th>
              <th className="py-4 px-4">Harga</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {filteredTickets.map((tk, idx) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={tk.id} 
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-800">{tk.operator}</p>
                  <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded uppercase mt-1 border ${
                    tk.type === 'VIP' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                    tk.type === 'Carter' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                    'bg-sky-400/10 text-primary border-sky-400/20'
                  }`}>
                    {tk.type}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-700">{tk.departTime} - {tk.arrivalTime}</div>
                  <div className="text-xs font-semibold text-slate-400 mt-0.5">{tk.duration}</div>
                </td>
                <td className="py-4 px-4">
                  <p className="font-black text-slate-900">Rp {(tk.basePrice || 0).toLocaleString('id-ID')}</p>
                </td>
                <td className="py-4 px-4">
                  {/* Dummy status logic based on id for visual variety */}
                  {tk.id % 4 === 0 ? (
                    <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-extrabold px-2 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Cancelled
                    </span>
                  ) : tk.id % 3 === 0 ? (
                    <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-extrabold px-2 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Full
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-extrabold px-2 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2 transition-opacity">
                    <button 
                      onClick={() => onConfigSeats(tk)}
                      title="Konfigurasi Kursi"
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-sky-500 hover:border-sky-500 transition flex items-center justify-center"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onView(tk)}
                      title="Lihat Detail"
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onEdit(tk)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition flex items-center justify-center"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(tk.id)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-500 transition flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 transition flex items-center justify-center lg:hidden absolute right-4 top-1/2 -translate-y-1/2">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {filteredTickets.length === 0 && (
          <div className="py-12 text-center text-slate-400 font-semibold text-sm">
            Tidak ada jadwal yang ditemukan.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs font-bold text-slate-500">
        <span>Menampilkan 1 hingga {filteredTickets.length} dari {filteredTickets.length} data</span>
        <div className="flex gap-1">
          <button className="px-3 py-1.5 rounded bg-white border border-slate-200 hover:bg-slate-50">Prev</button>
          <button className="px-3 py-1.5 rounded bg-primary text-white border border-primary">1</button>
          <button className="px-3 py-1.5 rounded bg-white border border-slate-200 hover:bg-slate-50">Next</button>
        </div>
      </div>
      
    </div>
  );
}
