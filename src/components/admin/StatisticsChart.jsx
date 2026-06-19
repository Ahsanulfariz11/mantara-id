import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0F4C81', '#00C2FF', '#082032', '#10b981', '#f59e0b', '#8b5cf6'];

export default function StatisticsChart({ bookingHistory = [], currentUser }) {
  
  const { revenueData, pieData } = useMemo(() => {
    // Generate Revenue Data
    const revenueMap = {};
    const opMap = {};

    let userBookings = bookingHistory;
    if (currentUser?.role === 'operator') {
      userBookings = bookingHistory.filter(b => b.outboundTicket?.operator === currentUser.operatorName);
    }

    // Only count LUNAS (Paid) bookings for revenue
    const paidBookings = userBookings.filter(b => b.paymentStatus === 'LUNAS');

    paidBookings.forEach(b => {
      // Group by month
      const date = new Date(b.outboundDate || Date.now());
      const monthYear = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      
      if (!revenueMap[monthYear]) {
        revenueMap[monthYear] = 0;
      }
      revenueMap[monthYear] += b.finalPaid || 0;

      // Group by operator for Pie chart
      const op = b.outboundTicket?.operator || 'Unknown';
      if (!opMap[op]) {
        opMap[op] = 0;
      }
      opMap[op] += b.passengers ? b.passengers.length : 1;
    });

    let revArray = Object.keys(revenueMap).map(name => ({
      name,
      Pendapatan: revenueMap[name]
    })).sort((a, b) => new Date('1 ' + a.name) - new Date('1 ' + b.name));

    // Fallback if empty so the chart doesn't look completely broken
    if (revArray.length === 0) {
      revArray = [
        { name: 'Jan 2024', Pendapatan: 0 },
        { name: 'Feb 2024', Pendapatan: 0 },
        { name: 'Mar 2024', Pendapatan: 0 }
      ];
    }

    const pieArray = Object.keys(opMap).map(name => ({
      name,
      value: opMap[name]
    }));

    return { revenueData: revArray, pieData: pieArray.length > 0 ? pieArray : [{ name: 'Belum Ada Data', value: 1 }] };
  }, [bookingHistory]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Revenue Area Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-sky-400/10 transition-colors duration-700"></div>
        <div className="mb-6 relative">
          <h2 className="text-lg font-black text-slate-800">Tren Pendapatan</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Akumulasi pendapatan per bulan</p>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0F4C81" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
              />
              <Area 
                type="monotone" 
                dataKey="Pendapatan" 
                stroke="#0F4C81" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#00C2FF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operator Distribution Pie Chart */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -ml-20 -mb-20 group-hover:bg-primary/10 transition-colors duration-700"></div>
        <div className="mb-6 relative">
          <h2 className="text-lg font-black text-slate-800">Distribusi Operator</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Berdasarkan tiket terjual</p>
        </div>
        
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 mt-2 relative z-10">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
