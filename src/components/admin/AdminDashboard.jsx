import { useState, useMemo } from 'react';
import DashboardOverview from './DashboardOverview';
import StatisticsChart from './StatisticsChart';
import ScheduleManagement from './ScheduleManagement';
import ScheduleDrawer from './ScheduleDrawer';

export default function AdminDashboard({ currentUser, tickets, saveTickets, bookingHistory, showToast }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  const stats = useMemo(() => {
    if (!bookingHistory) return {};
    
    // Filter by Operator if role is operator
    let userBookings = bookingHistory;
    let userTickets = tickets || [];
    if (currentUser?.role === 'operator') {
      userBookings = bookingHistory.filter(b => b.outboundTicket?.operator === currentUser.operatorName);
      userTickets = userTickets.filter(t => t.operator === currentUser.operatorName);
    }

    const validBookings = userBookings.filter(b => b.paymentStatus === 'LUNAS');
    const totalTransactions = validBookings.length;
    
    let ticketsSold = 0;
    let revenue = 0;
    
    validBookings.forEach(b => {
      revenue += (b.finalPaid || 0);
      ticketsSold += (b.passengers ? b.passengers.length : 0);
    });

    const activeSchedules = userTickets.length;

    return {
      ticketsSold,
      revenue,
      activeSchedules,
      bookingsCount: totalTransactions
    };
  }, [bookingHistory, tickets, currentUser]);

  const handleAddSchedule = () => {
    setEditingTicket(null);
    setIsDrawerOpen(true);
  };

  const handleEditSchedule = (ticket) => {
    setEditingTicket(ticket);
    setIsDrawerOpen(true);
  };

  const handleDeleteSchedule = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      const updated = tickets.filter(tk => tk.id !== id);
      saveTickets(updated);
      showToast('Jadwal berhasil dihapus.', 'info');
    }
  };

  const handleSaveSchedule = (formData) => {
    let updated;
    if (editingTicket) {
      updated = tickets.map(tk => 
        tk.id === editingTicket.id ? { ...tk, ...formData, basePrice: Number(formData.basePrice), baggage: Number(formData.baggage) } : tk
      );
      showToast('Jadwal berhasil diperbarui!', 'success');
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
      showToast('Jadwal baru berhasil ditambahkan!', 'success');
    }
    saveTickets(updated);
    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardOverview stats={stats} />
      <StatisticsChart bookingHistory={bookingHistory} currentUser={currentUser} />
    </div>
  );
}
