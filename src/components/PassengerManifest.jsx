

export default function PassengerManifest({ booking, onClose }) {
  if (!booking) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('manifest-print-area').innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React state bindings after print overwrites body
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[160] flex justify-center items-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header Actions */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h2 className="font-extrabold text-slate-900 text-lg uppercase tracking-wide">Manifest Penumpang</h2>
          <div className="flex gap-2 sm:gap-4">
            <button 
              onClick={handlePrint} 
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2"
            >
              <i className="fa-solid fa-print"></i>
              <span className="hidden sm:inline">Cetak Manifest</span>
            </button>
            <button 
              onClick={onClose} 
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar" id="manifest-print-area">
          <div className="manifest-container bg-white">
            
            {/* Branding Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-2 text-sky-600">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M12 2c-1.5 0-3 1.5-4 3-1.5 2.5-4 5-6 6 2 1 4.5 1.5 6 1.5 1 0 2.5.5 3.5 2.5 1-2 2.5-2.5 3.5-2.5 1.5 0 4-.5 6-1.5-2-1-4.5-3.5-6-6-1-1.5-2.5-3-4-3z"/></svg>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">MANTARA</h1>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Official Passenger Manifest</h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">Kode Booking: <span className="text-slate-900">{booking.bookingId}</span></p>
              </div>
            </div>

            {/* Trip Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Rute</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800">{booking.origin} ➔ {booking.destination}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Tanggal Keberangkatan</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800">{booking.outboundDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Jam Berangkat</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800">{booking.outboundTicket?.departTime} WITA</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nama Kapal</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800">{booking.outboundTicket?.operator} ({booking.outboundTicket?.type})</span>
              </div>
            </div>

            {/* Passenger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-100 border-y-2 border-slate-300">
                    <th className="py-3 px-4 text-[10px] font-extrabold text-slate-600 uppercase w-12 text-center">No</th>
                    <th className="py-3 px-4 text-[10px] font-extrabold text-slate-600 uppercase">Nama Penumpang</th>
                    <th className="py-3 px-4 text-[10px] font-extrabold text-slate-600 uppercase text-center">L/P</th>
                    <th className="py-3 px-4 text-[10px] font-extrabold text-slate-600 uppercase text-center">Usia</th>
                    <th className="py-3 px-4 text-[10px] font-extrabold text-slate-600 uppercase text-center">Kursi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-b-2 border-slate-300">
                  {booking.passengers.map((p, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">{index + 1}</td>
                      <td className="py-3 px-4 text-xs font-bold text-slate-800">{p.name}</td>
                      <td className="py-3 px-4 text-xs font-bold text-slate-800 text-center">{p.gender || '-'}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600 text-center">{p.age || '-'}</td>
                      <td className="py-3 px-4 text-xs font-extrabold text-sky-600 text-center bg-sky-50/50">{p.seatOutbound}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Return Ticket Section (if round trip) */}
            {booking.isRoundTrip && booking.returnTicket && (
              <div className="mt-12">
                <div className="flex items-center gap-2 mb-4">
                  <i className="fa-solid fa-arrow-rotate-left text-orange-500"></i>
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase">Kepulangan</h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <div>
                    <span className="text-[10px] text-orange-400 font-bold uppercase block mb-1">Rute</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800">{booking.destination} ➔ {booking.origin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-orange-400 font-bold uppercase block mb-1">Tanggal Keberangkatan</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800">{booking.returnDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-orange-400 font-bold uppercase block mb-1">Jam Berangkat</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800">{booking.returnTicket?.departTime} WITA</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-orange-400 font-bold uppercase block mb-1">Nama Kapal</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800">{booking.returnTicket?.operator} ({booking.returnTicket?.type})</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-100 border-y-2 border-slate-300">
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-600 uppercase w-12 text-center">No</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-600 uppercase">Nama Penumpang</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-600 uppercase text-center">L/P</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-600 uppercase text-center">Usia</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-slate-600 uppercase text-center">Kursi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 border-b-2 border-slate-300">
                      {booking.passengers.map((p, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">{index + 1}</td>
                          <td className="py-3 px-4 text-xs font-bold text-slate-800">{p.name}</td>
                          <td className="py-3 px-4 text-xs font-bold text-slate-800 text-center">{p.gender || '-'}</td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-600 text-center">{p.age || '-'}</td>
                          <td className="py-3 px-4 text-xs font-extrabold text-orange-600 text-center bg-orange-50/50">{p.seatReturn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Signature */}
            <div className="mt-16 flex justify-end">
              <div className="text-center w-48">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-12">Petugas Kapal</p>
                <div className="border-b border-slate-400 w-full mb-1"></div>
                <p className="text-[9px] text-slate-500">(Tanda Tangan & Nama Terang)</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
