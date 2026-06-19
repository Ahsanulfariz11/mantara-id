import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AdminDashboard from './AdminDashboard';
import ScheduleManagement from './ScheduleManagement';
import ScheduleDrawer from './ScheduleDrawer';
import OperatorManagement from './OperatorManagement';
import BookingManagement from './BookingManagement';
import PassengerManagement from './PassengerManagement';
import PaymentManagement from './PaymentManagement';
import ReportManagement from './ReportManagement';
import SettingsManagement from './SettingsManagement';
import { api } from '../../lib/api';
import ConfirmModal from '../ui/ConfirmModal';

export default function AdminLayout({ currentUser, tickets, saveTickets, bookingHistory, showToast, handleLogout, lang, setLang, setActiveTab }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  
  // State for Schedule Drawer inside AdminLayout since it was moved out of AdminDashboard
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [drawerMode, setDrawerMode] = useState('edit');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const handleLogoutAction = () => {
    handleLogout();
  };

  const handleAddSchedule = () => {
    setEditingTicket(null);
    setDrawerMode('add');
    setIsDrawerOpen(true);
  };

  const handleEditSchedule = (ticket) => {
    setEditingTicket(ticket);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const handleViewSchedule = (ticket) => {
    setEditingTicket(ticket);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const handleConfigSeats = (ticket) => {
    setEditingTicket(ticket);
    setDrawerMode('config_seats');
    setIsDrawerOpen(true);
  };

  const confirmDeleteSchedule = async () => {
    try {
      const updated = tickets.filter(tk => tk.id !== confirmModal.id);
      await saveTickets(updated);
      showToast('Jadwal berhasil dihapus.', 'info');
      setConfirmModal({ isOpen: false, id: null });
    } catch (e) {
      showToast('Gagal menghapus jadwal.', 'error');
    }
  };

  const handleDeleteSchedule = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const handleSaveSchedule = async (formData) => {
    let updated;
    if (editingTicket) {
      updated = tickets.map(tk => 
        tk.id === editingTicket.id ? { ...tk, ...formData, basePrice: Number(formData.basePrice), baggage: Number(formData.baggage) } : tk
      );
    } else {
      const newId = tickets.length > 0 ? Math.max(...tickets.map(tk => tk.id)) + 1 : 1;
      const newTicket = {
        id: newId,
        ...formData,
        basePrice: Number(formData.basePrice),
        baggage: Number(formData.baggage),
        speedRank: formData.type === 'VIP' ? 1 : formData.type === 'Carter' ? 1 : 2,
      };
      updated = [...tickets, newTicket];
    }
    
    try {
      await saveTickets(updated);
      showToast(editingTicket ? 'Jadwal berhasil diperbarui!' : 'Jadwal baru berhasil ditambahkan!', 'success');
      setIsDrawerOpen(false);
    } catch (e) {
      showToast('Gagal menyimpan jadwal.', 'error');
    }
  };

  const titleMap = {
    dashboard: 'Dashboard Utama',
    schedules: 'Jadwal Speedboat',
    operators: 'Operator Speedboat',
    bookings: 'Manajemen Pemesanan',
    passengers: 'Data Penumpang',
    payments: 'Riwayat Pembayaran',
    reports: 'Laporan Penjualan',
    settings: 'Pengaturan Sistem'
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans fixed inset-0 z-[9999]">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} currentUser={currentUser} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar 
          currentUser={currentUser}
          title={titleMap[activeMenu]} 
          breadcrumbs={titleMap[activeMenu]} 
          onLogout={handleLogoutAction}
          lang={lang}
          setLang={setLang}
          setActiveMenu={setActiveMenu}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          setActiveTab={setActiveTab}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeMenu === 'dashboard' && (
            <AdminDashboard 
              currentUser={currentUser}
              tickets={tickets} 
              bookingHistory={bookingHistory} 
              showToast={showToast} 
            />
          )}

          {activeMenu === 'schedules' && (
            <>
              <ScheduleManagement 
                currentUser={currentUser}
                tickets={tickets} 
                onAdd={handleAddSchedule}
                onEdit={handleEditSchedule}
                onView={handleViewSchedule}
                onConfigSeats={handleConfigSeats}
                onDelete={handleDeleteSchedule}
                globalSearch={globalSearch}
              />
              <ScheduleDrawer 
                currentUser={currentUser}
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
                editingTicket={editingTicket}
                mode={drawerMode}
                onSave={handleSaveSchedule}
              />
            </>
          )}

          {activeMenu === 'operators' && (
            <OperatorManagement showToast={showToast} globalSearch={globalSearch} />
          )}

          {activeMenu === 'bookings' && (
            <BookingManagement currentUser={currentUser} bookingHistory={bookingHistory} showToast={showToast} globalSearch={globalSearch} />
          )}

          {activeMenu === 'passengers' && (
            <PassengerManagement currentUser={currentUser} bookingHistory={bookingHistory} globalSearch={globalSearch} />
          )}

          {activeMenu === 'payments' && (
            <PaymentManagement currentUser={currentUser} bookingHistory={bookingHistory} showToast={showToast} globalSearch={globalSearch} />
          )}

          {activeMenu === 'reports' && (
            <ReportManagement currentUser={currentUser} bookingHistory={bookingHistory} showToast={showToast} />
          )}

          {activeMenu === 'settings' && (
            <SettingsManagement showToast={showToast} />
          )}
        </main>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDeleteSchedule}
        title="Hapus Jadwal"
        message="Apakah Anda yakin ingin menghapus jadwal ini?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDestructive={true}
      />
    </div>
  );
}
