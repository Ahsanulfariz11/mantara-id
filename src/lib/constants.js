export const initialTicketDatabase = [
  { id: 1, operator: 'Kaltara Express', type: 'Reguler', departTime: '07:30', arrivalTime: '08:45', duration: '1j 15m', durationEn: '1h 15m', basePrice: 280000, speedRank: 2, ac: true, baggage: 15, reclining: false, seatRows: 8, seatCols: 4 },
  { id: 2, operator: 'Limex Lestari', type: 'VIP', departTime: '09:00', arrivalTime: '10:05', duration: '1j 05m', durationEn: '1h 05m', basePrice: 350000, speedRank: 1, ac: true, baggage: 20, reclining: true, seatRows: 6, seatCols: 4 },
  { id: 3, operator: 'Harapan Baru', type: 'Reguler', departTime: '10:15', arrivalTime: '11:40', duration: '1j 25m', durationEn: '1h 25m', basePrice: 250000, speedRank: 3, ac: true, baggage: 10, reclining: false, seatRows: 8, seatCols: 4 },
  { id: 4, operator: 'Sadewa Speed', type: 'VIP', departTime: '13:00', arrivalTime: '14:10', duration: '1j 10m', durationEn: '1h 10m', basePrice: 330000, speedRank: 2, ac: true, baggage: 20, reclining: true, seatRows: 7, seatCols: 4 },
  { id: 5, operator: 'Borneo Marine', type: 'Carter', departTime: '15:30', arrivalTime: '16:30', duration: '1j 00m', durationEn: '1h 00m', basePrice: 1500000, speedRank: 1, ac: true, baggage: 30, reclining: true, seatRows: 5, seatCols: 2 },
  { id: 6, operator: 'Menara Indah', type: 'Reguler', departTime: '16:00', arrivalTime: '17:20', duration: '1j 20m', durationEn: '1h 20m', basePrice: 260000, speedRank: 3, ac: true, baggage: 10, reclining: false, seatRows: 8, seatCols: 4 }
];

export const locations = ["Tarakan", "Tanjung Selor", "Nunukan", "Malinau", "Derawan"];

export const monthsId = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
export const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const mapPorts = {
  "Nunukan": { label: "Nunukan", code: "NNK", coord: [117.6521, 4.1417] },
  "Malinau": { label: "Malinau", code: "MLN", coord: [116.6343, 3.5852] },
  "Tarakan": { label: "Tarakan", code: "TRK", coord: [117.5855, 3.3276] },
  "Tanjung Selor": { label: "Tanjung Selor", code: "TJS", coord: [117.3625, 2.8361] }
};
