import { Bell, Search, Globe, ChevronDown, User, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Topbar({ currentUser, title, breadcrumbs, onLogout, lang, setLang, setActiveMenu, globalSearch, setGlobalSearch, setActiveTab }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      
      {/* Left: Title & Breadcrumbs */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
          <span>Admin</span>
          <span className="text-slate-300">/</span>
          <span className="text-primary">{breadcrumbs}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        
        {/* Lihat Website Button */}
        <button 
          onClick={() => setActiveTab && setActiveTab('landing')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{lang === 'id' ? 'Lihat Website' : 'View Website'}</span>
        </button>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={globalSearch}
            onChange={(e) => setGlobalSearch && setGlobalSearch(e.target.value)}
            placeholder="Cari data..." 
            className="w-64 bg-slate-100 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-sky-400 focus:bg-white transition-all outline-none text-slate-700"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 text-slate-400 hover:text-primary transition-colors">
            <Bell className="w-5 h-5" />
            {hasUnread && <span className="absolute top-1 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>}
          </button>
          
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-scale-up z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Notifikasi</span>
                <span onClick={() => setHasUnread(false)} className="text-[10px] text-primary font-bold cursor-pointer hover:underline">Tandai dibaca</span>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                <div className={`p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 ${hasUnread ? 'bg-sky-50/30' : ''}`}>
                  <p className="text-xs font-bold text-slate-700">Booking Baru Diterima</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Booking ID: TRX-12345 berhasil dibayar.</p>
                  <p className="text-[9px] text-slate-400 mt-1">2 menit yang lalu</p>
                </div>
                <div className="p-3 hover:bg-slate-50 cursor-pointer">
                  <p className="text-xs font-bold text-slate-700">Peringatan Sistem</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Jadwal Harapan Baru hampir penuh.</p>
                  <p className="text-[9px] text-slate-400 mt-1">1 jam yang lalu</p>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <span onClick={() => setNotifOpen(false)} className="text-xs text-primary font-bold cursor-pointer hover:underline">Lihat Semua Data Booking</span>
              </div>
            </div>
          )}
        </div>

        {/* Language Switch */}
        <button 
          onClick={() => setLang && setLang(lang === 'id' ? 'en' : 'id')}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span className="uppercase">{lang || 'ID'}</span>
        </button>

        <div className="w-px h-8 bg-slate-200"></div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-full transition-colors pr-3"
          >
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {currentUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-bold text-slate-700 leading-tight">{currentUser?.name || 'Admin'}</p>
              <p className="text-[10px] font-semibold text-slate-400 capitalize">{currentUser?.role === 'operator' ? 'Operator' : 'Superadmin'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-scale-up z-50">
              <button 
                onClick={() => {
                  if(setActiveMenu) setActiveMenu('settings');
                  setProfileOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profil Saya
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              <button 
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
