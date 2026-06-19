import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  CalendarClock, 
  Users, 
  Ticket, 
  UserSquare2, 
  CreditCard, 
  LineChart, 
  Settings,
  Ship,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'schedules', label: 'Jadwal Speedboat', icon: CalendarClock },
  { id: 'operators', label: 'Operator', icon: Ship },
  { id: 'bookings', label: 'Pemesanan', icon: Ticket },
  { id: 'passengers', label: 'Penumpang', icon: Users },
  { id: 'payments', label: 'Pembayaran', icon: CreditCard },
  { id: 'reports', label: 'Laporan Penjualan', icon: LineChart },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

export default function Sidebar({ activeMenu, setActiveMenu, currentUser }) {
  const [collapsed, setCollapsed] = useState(false);

  const filteredMenuItems = menuItems.filter(item => {
    if (currentUser?.role === 'operator') {
      return ['dashboard', 'schedules', 'bookings', 'passengers', 'reports'].includes(item.id);
    }
    return true;
  });

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="h-screen bg-blue-900 text-white flex flex-col flex-shrink-0 relative transition-all duration-300 z-50 border-r border-white/10"
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="text-white p-1 flex-shrink-0 flex items-center justify-center">
            <svg className="w-8 h-8 fill-current translate-y-[2px]" viewBox="0 0 24 24"><path d="M12 2c-1.5 0-3 1.5-4 3-1.5 2.5-4 5-6 6 2 1 4.5 1.5 6 1.5 1 0 2.5.5 3.5 2.5 1-2 2.5-2.5 3.5-2.5 1.5 0 4-.5 6-1.5-2-1-4.5-3.5-6-6-1-1.5-2.5-3-4-3z" /></svg>
          </div>
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-xl tracking-tight text-white"
            >
              MANTARA
            </motion.span>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-24 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-4 border-slate-50 text-white hover:bg-sky-400 transition-colors z-50"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = activeMenu === item.id;
            const Icon = item.icon;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeMenu"
                      className="absolute inset-0 bg-gradient-to-r from-ocean to-ocean/50 border-l-4 border-sky-400 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <div className={`relative z-10 flex items-center justify-center ${collapsed ? 'w-full' : ''}`}>
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-sky-500' : 'group-hover:text-sky-500/70'}`} />
                  </div>
                  
                  {!collapsed && (
                    <span className="relative z-10 font-medium text-sm whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Summary Bottom */}
      <div className="p-4 border-t border-white/10">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
            <UserSquare2 className="w-5 h-5 text-slate-300" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Admin MANTARA</p>
              <p className="text-xs text-sky-500 truncate">Super Administrator</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
