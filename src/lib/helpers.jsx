import { monthsId, monthsEn } from './constants';
import { QRCodeSVG } from 'qrcode.react';

// Real QR Code generator using qrcode.react
export function generateQRCodeSVG(value) {
  return (
    <QRCodeSVG
      value={value || "SEA-TICKET"}
      size={128}
      bgColor="#ffffff"
      fgColor="#1e293b"
      level="M"
      className="w-full h-full rounded-lg"
    />
  );
}

// Pseudo-random seat generator for vessel (keeps seats consistent for each speedboat + date)
export function getOccupiedSeats(ticketId, dateString) {
  const seed = ticketId + dateString.length + (dateString.charCodeAt(0) || 0);
  const occupiedCount = (seed % 10) + 8; // 8-18 occupied seats
  const occupied = [];
  const columns = ['A', 'B', 'C', 'D'];
  for (let i = 0; i < occupiedCount; i++) {
    const row = ((seed + i * 7) % 8) + 1;
    const col = columns[(seed + i * 3) % 4];
    const seat = `${col}${row}`;
    if (!occupied.includes(seat)) {
      occupied.push(seat);
    }
  }
  return occupied;
}

// Helper to generate a random booking reference
export function generateBookingRef() {
  return "MNT-" + (Math.floor(Math.random() * 90000) + 10000) + "B";
}

export function parseDateStr(str, lang) {
  if (!str) return new Date();
  const clean = str.replace(/,/g, '');
  const parts = clean.split(' ');
  if (parts.length < 3) return new Date();
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;
  
  const months = lang === 'id' ? monthsId : monthsEn;
  const monthIdx = months.indexOf(monthStr);
  return new Date(year, monthIdx >= 0 ? monthIdx : 0, day);
}

export function formatDateToStr(date, lang) {
  const day = date.getDate();
  const months = lang === 'id' ? monthsId : monthsEn;
  const monthStr = months[date.getMonth()];
  const yearShort = date.getFullYear().toString().slice(-2);
  return `${day} ${monthStr}, ${yearShort}`;
}

export function getTicketDepartureDateTime(dateStr, timeStr, lang) {
  const dateObj = parseDateStr(dateStr, lang);
  const [hours, minutes] = timeStr.split(':').map(Number);
  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
}
