import { motion } from 'framer-motion';
import { Ticket, Banknote, CalendarClock, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function DashboardOverview({ stats }) {
  const cards = [
    {
      title: 'Total Tiket Terjual',
      value: stats.ticketsSold || 0,
      growth: '+12.5%',
      trend: 'up',
      icon: Ticket,
      color: 'from-blue-500 to-ocean',
      shadow: 'shadow-blue-500/20'
    },
    {
      title: 'Pendapatan (Sukses)',
      value: `Rp ${(stats.revenue || 0).toLocaleString('id-ID')}`,
      growth: '+8.2%',
      trend: 'up',
      icon: Banknote,
      color: 'from-emerald-400 to-emerald-600',
      shadow: 'shadow-emerald-500/20'
    },
    {
      title: 'Jadwal Aktif',
      value: stats.activeSchedules || 0,
      growth: '-2.1%',
      trend: 'down',
      icon: CalendarClock,
      color: 'from-orange-400 to-orange-600',
      shadow: 'shadow-orange-500/20'
    },
    {
      title: 'Total Transaksi',
      value: stats.bookingsCount || 0,
      growth: '+24.5%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-indigo-600',
      shadow: 'shadow-indigo-500/20'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isUp = card.trend === 'up';
        
        return (
          <motion.div
            key={index}
            variants={item}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer"
          >
            {/* Top row */}
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.growth}
              </div>
            </div>

            {/* Bottom row */}
            <div>
              <p className="text-sm font-bold text-slate-400 mb-1">{card.title || 'Operator'}</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{card.value}</h3>
            </div>

            {/* Decorative background element */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br ${card.color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
