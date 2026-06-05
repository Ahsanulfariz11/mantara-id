import { useState, useEffect, useRef } from 'react';
import { Map, MapMarker, MapRoute, MapControls, MarkerContent, MarkerLabel } from "@/components/ui/map";
import CountdownTimer from './components/CountdownTimer';
import PassengerManifest from './components/PassengerManifest';
import CancellationModal from './components/CancellationModal';
import HotelRecommendations from './components/HotelRecommendations';
import Footer from './components/Footer';
// Ticket database setup
const ticketDatabase = [
  { id: 1, operator: 'Kaltara Express', type: 'Reguler', departTime: '07:30', arrivalTime: '08:45', duration: '1j 15m', durationEn: '1h 15m', basePrice: 280000, speedRank: 2, ac: true, baggage: 15, reclining: false },
  { id: 2, operator: 'Limex Lestari', type: 'VIP', departTime: '09:00', arrivalTime: '10:05', duration: '1j 05m', durationEn: '1h 05m', basePrice: 350000, speedRank: 1, ac: true, baggage: 20, reclining: true },
  { id: 3, operator: 'Harapan Baru', type: 'Reguler', departTime: '10:15', arrivalTime: '11:40', duration: '1j 25m', durationEn: '1h 25m', basePrice: 250000, speedRank: 3, ac: true, baggage: 10, reclining: false },
  { id: 4, operator: 'Sadewa Speed', type: 'VIP', departTime: '13:00', arrivalTime: '14:10', duration: '1j 10m', durationEn: '1h 10m', basePrice: 330000, speedRank: 2, ac: true, baggage: 20, reclining: true },
  { id: 5, operator: 'Borneo Marine', type: 'Carter', departTime: '15:30', arrivalTime: '16:30', duration: '1j 00m', durationEn: '1h 00m', basePrice: 1500000, speedRank: 1, ac: true, baggage: 30, reclining: true },
  { id: 6, operator: 'Menara Indah', type: 'Reguler', departTime: '16:00', arrivalTime: '17:20', duration: '1j 20m', durationEn: '1h 20m', basePrice: 260000, speedRank: 3, ac: true, baggage: 10, reclining: false }
];

const locations = ["Tarakan", "Tanjung Selor", "Nunukan", "Malinau", "Derawan"];

// Multilingual Dictionary
const translations = {
  id: {
    title: "MANTARA",
    profile: "Profil",
    searchPlaceholder: "Asal - Tujuan",
    searchRoute: "Ubah Rute & Penumpang",
    originPort: "Asal Pelabuhan",
    destPort: "Tujuan Pelabuhan",
    adults: "Penumpang Dewasa",
    kids: "Penumpang Anak (di bawah 12 tahun)",
    cancel: "Batal",
    saveRoute: "Simpan Rute",
    oneWay: "Sekali Jalan",
    roundTrip: "Pulang Pergi",
    search: "Cari Jadwal",
    routeMap: "Peta Rute Interaktif",
    priceNotification: "Pantau Harga",
    notifEnabled: "Harga dipantau! Notifikasi harga diaktifkan untuk rute ini.",
    cheapest: "Termurah",
    fastest: "Tercepat",
    filter: "Filter",
    filterSearch: "Filter Pencarian",
    resetAll: "Reset Semua",
    shipType: "Tipe Kapal",
    departHour: "Jam Keberangkatan",
    maxDepartHour: "Maksimal Jam Berangkat",
    operator: "Operator Speedboat",
    baggage: "Bagasi",
    ac: "Full AC",
    reclining: "Reclining Seat",
    selectTicket: "Pilih Tiket",
    selectOutbound: "Pilih Tiket Pergi",
    selectReturn: "Pilih Tiket Pulang",
    share: "Bagikan",
    shareToast: "Detail tiket berhasil disalin!",
    toastResetFilters: "Semua filter dikembalikan ke awal",
    toastRouteUpdated: "Pencarian berhasil diperbarui!",
    toastSamePort: "Asal dan tujuan tidak boleh sama!",
    toastContactRequired: "Kontak pemesan tidak boleh kosong!",
    toastPassengerRequired: "Harap isi nama lengkap penumpang!",
    toastPromoApplied: "Kode promo berhasil digunakan!",
    toastPromoInvalid: "Kode promo tidak valid!",
    toastSeatRequired: "Harap pilih kursi untuk seluruh penumpang!",
    bookingDetails: "Detail Pemesanan Tiket",
    totalPayment: "Total Pembayaran",
    contactData: "Data Kontak Pemesan",
    fullName: "Nama Lengkap",
    ktpPlaceholder: "Sesuai KTP/Paspor",
    phone: "Nomor Handphone",
    passengerData: "Detail Data Penumpang",
    passengerNamePlaceholder: "Nama Lengkap Penumpang",
    nikPlaceholder: "NIK KTP / Paspor / Tgl Lahir",
    selectSeatBtn: "Pilih Kursi",
    seatSelected: "Kursi Terpilih",
    seatSelectTitle: "Pilih Kursi",
    seatAisle: "Koridor",
    seatCockpit: "Kemudi Kapal",
    seatOccupied: "Terisi",
    seatAvailable: "Tersedia",
    payNow: "Bayar Sekarang",
    ticketOrdered: "Tiket Berhasil Dipesan!",
    ticketSuccessDesc: "E-Ticket dan Boarding Pass telah berhasil diterbitkan.",
    boardingPass: "BOARDING PASS",
    buyer: "Pemesan",
    date: "Tanggal",
    route: "Rute",
    ship: "Kapal",
    seats: "Kursi",
    backHome: "Kembali ke Beranda",
    promoCode: "Kode Promo / Voucher",
    applyPromo: "Terapkan",
    promoDiscount: "Potongan Promo",
    myBookings: "Tiket Saya",
    searchTickets: "Cari Tiket",
    noBookings: "Belum ada riwayat pemesanan.",
    bookingCode: "Kode Booking",
    showBoardingPass: "Lihat Boarding Pass",
    departure: "Keberangkatan",
    returnTitle: "Kepulangan",
    vesselTypeRegular: "Reguler (AC)",
    vesselTypeVip: "VIP Exclusive",
    vesselTypeCarter: "Carter Pribadi",
    outboundTicketLabel: "Tiket Pergi",
    returnTicketLabel: "Tiket Pulang",
    anyTime: "Semua Waktu",
    mapInstruction: "Klik pelabuhan di peta untuk mengubah tujuan rute."
  },
  en: {
    title: "MANTARA",
    profile: "Profile",
    searchPlaceholder: "Origin - Destination",
    searchRoute: "Change Route & Passengers",
    originPort: "Origin Port",
    destPort: "Destination Port",
    adults: "Adult Passengers",
    kids: "Child Passengers (under 12)",
    cancel: "Cancel",
    saveRoute: "Save Route",
    oneWay: "One Way",
    roundTrip: "Round Trip",
    search: "Search Schedules",
    routeMap: "Interactive Route Map",
    priceNotification: "Track Prices",
    notifEnabled: "Price monitored! Price alerts activated for this route.",
    cheapest: "Cheapest",
    fastest: "Fastest",
    filter: "Filter",
    filterSearch: "Search Filter",
    resetAll: "Reset All",
    shipType: "Vessel Type",
    departHour: "Departure Time",
    maxDepartHour: "Max Departure Time",
    operator: "Speedboat Operator",
    baggage: "Baggage",
    ac: "Full AC",
    reclining: "Reclining Seat",
    selectTicket: "Select Ticket",
    selectOutbound: "Select Outbound",
    selectReturn: "Select Return",
    share: "Share",
    shareToast: "Ticket details copied successfully!",
    toastResetFilters: "All filters reset to defaults",
    toastRouteUpdated: "Search updated successfully!",
    toastSamePort: "Origin and destination cannot be the same!",
    toastContactRequired: "Contact details cannot be empty!",
    toastPassengerRequired: "Please fill in all passenger full names!",
    toastPromoApplied: "Promo code applied successfully!",
    toastPromoInvalid: "Invalid promo code!",
    toastSeatRequired: "Please select seats for all passengers!",
    bookingDetails: "Ticket Booking Details",
    totalPayment: "Total Payment",
    contactData: "Contact Person Details",
    fullName: "Full Name",
    ktpPlaceholder: "As per ID card/Passport",
    phone: "Mobile Phone Number",
    passengerData: "Passenger Details",
    passengerNamePlaceholder: "Passenger Full Name",
    nikPlaceholder: "ID Number / Passport / DOB",
    selectSeatBtn: "Select Seat",
    seatSelected: "Selected Seat",
    seatSelectTitle: "Select Seat",
    seatAisle: "Aisle",
    seatCockpit: "Cockpit / Cabin",
    seatOccupied: "Occupied",
    seatAvailable: "Available",
    payNow: "Pay Now",
    ticketOrdered: "Ticket Booked Successfully!",
    ticketSuccessDesc: "E-Ticket and Boarding Pass have been issued.",
    boardingPass: "BOARDING PASS",
    buyer: "Buyer",
    date: "Date",
    route: "Route",
    ship: "Vessel",
    seats: "Seats",
    backHome: "Back to Home",
    promoCode: "Promo Code / Voucher",
    applyPromo: "Apply",
    promoDiscount: "Promo Discount",
    myBookings: "My Bookings",
    searchTickets: "Search Tickets",
    noBookings: "No booking history found.",
    bookingCode: "Booking Code",
    showBoardingPass: "Show Boarding Pass",
    departure: "Departure",
    returnTitle: "Return",
    vesselTypeRegular: "Regular (AC)",
    vesselTypeVip: "VIP Exclusive",
    vesselTypeCarter: "Private Charter",
    outboundTicketLabel: "Outbound Ticket",
    returnTicketLabel: "Return Ticket",
    anyTime: "Any Time",
    mapInstruction: "Click a port on the map to change route destination."
  }
};

// Pure JS SVG QR Code Generator Mockup (Renders realistic custom SVG patterns)
function generateQRCodeSVG(value) {
  const size = 25; // 25x25 grid
  const cells = [];

  // Simple custom hash function
  const getHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const seed = getHash(value || "SEA-TICKET");

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // 1. Top-left anchor
      if (r < 7 && c < 7) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells.push(isBorder || isCenter);
      }
      // 2. Top-right anchor
      else if (r < 7 && c >= size - 7) {
        const nc = c - (size - 7);
        const isBorder = r === 0 || r === 6 || nc === 0 || nc === 6;
        const isCenter = r >= 2 && r <= 4 && nc >= 2 && nc <= 4;
        cells.push(isBorder || isCenter);
      }
      // 3. Bottom-left anchor
      else if (r >= size - 7 && c < 7) {
        const nr = r - (size - 7);
        const isBorder = nr === 0 || nr === 6 || c === 0 || c === 6;
        const isCenter = nr >= 2 && nr <= 4 && c >= 2 && c <= 4;
        cells.push(isBorder || isCenter);
      }
      // 4. Alignment patterns
      else if (r === 6 || c === 6) {
        cells.push(r % 2 === 0 || c % 2 === 0);
      }
      // 5. Rest of cells (pseudo-random based on seed)
      else {
        const cellHash = getHash(`${seed}_${r}_${c}`);
        cells.push(cellHash % 3 === 0 || cellHash % 7 === 0);
      }
    }
  }

  const cellSize = 100 / size;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full bg-white p-1 rounded-lg">
      {cells.map((filled, idx) => {
        if (!filled) return null;
        const r = Math.floor(idx / size);
        const c = idx % size;
        return (
          <rect
            key={idx}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize + 0.1}
            height={cellSize + 0.1}
            fill="#1e293b"
          />
        );
      })}
    </svg>
  );
}

// Pseudo-random seat generator for vessel (keeps seats consistent for each speedboat + date)
function getOccupiedSeats(ticketId, dateString) {
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

export default function App() {
  // Localization state
  const [lang, setLang] = useState('id');
  const t = translations[lang];

  // Active view: 'landing', 'search', or 'history'
  const [activeTab, setActiveTab] = useState('landing');

  // Search States
  const [origin, setOrigin] = useState("Tarakan");
  const [destination, setDestination] = useState("Tanjung Selor");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(1);
  const [infants, setInfants] = useState(0);
  const [passengerClass, setPassengerClass] = useState('Economy');
  const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);

  // Dates Outbound / Return
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedReturnDate, setSelectedReturnDate] = useState("");
  const [dateList, setDateList] = useState([]);
  const [datePrices, setDatePrices] = useState({});

  // Dynamic booking selection states
  const [bookingFlowState, setBookingFlowState] = useState('outbound_select'); // outbound_select | return_select
  const [selectedOutboundTicket, setSelectedOutboundTicket] = useState(null);
  const [selectedReturnTicket, setSelectedReturnTicket] = useState(null);

  // Filter & Sort States
  const [activeTypes, setActiveTypes] = useState(["Reguler", "VIP"]);
  const [maxDepartureHour, setMaxDepartureHour] = useState(17);
  const [activeOperators, setActiveOperators] = useState([]);
  const [currentSort, setCurrentSort] = useState("price");

  // UI Modals & Interactive States
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [toast, setToast] = useState(null);
  const [mapSelectionStep, setMapSelectionStep] = useState('origin');
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Checkout Form States
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [passengersData, setPassengersData] = useState([]);
  
  // Seat Selector modal states
  const [isSeatSelectorOpen, setIsSeatSelectorOpen] = useState(false);
  const [activeSeatSelectingType, setActiveSeatSelectingType] = useState('outbound');
  const [activeSeatPassengerIdx, setActiveSeatPassengerIdx] = useState(0);

  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Booking Success Modal & Boarding Pass state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastBookingResult, setLastBookingResult] = useState(null);
  const [selectedManifestBooking, setSelectedManifestBooking] = useState(null);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState(null);

  // Booking history from LocalStorage
  const [bookingHistory, setBookingHistory] = useState([]);

  const dateCarouselRef = useRef(null);

  // Promo Slider state
  const [promoSlideIndex, setPromoSlideIndex] = useState(0);
  const promoSliderInterval = useRef(null);
  const promoSlideCount = 4;

  // Auto-slide promo carousel
  useEffect(() => {
    promoSliderInterval.current = setInterval(() => {
      setPromoSlideIndex(prev => (prev + 1) % promoSlideCount);
    }, 5000);
    return () => clearInterval(promoSliderInterval.current);
  }, []);

  const goToPromoSlide = (index) => {
    setPromoSlideIndex(index);
    clearInterval(promoSliderInterval.current);
    promoSliderInterval.current = setInterval(() => {
      setPromoSlideIndex(prev => (prev + 1) % promoSlideCount);
    }, 5000);
  };

  const nextPromoSlide = () => goToPromoSlide((promoSlideIndex + 1) % promoSlideCount);
  const prevPromoSlide = () => goToPromoSlide((promoSlideIndex - 1 + promoSlideCount) % promoSlideCount);

  // Load dates and history on startup
  useEffect(() => {
    // Inject FontAwesome icons CDN
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);

    const dates = [];
    const prices = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    let startDate = new Date(); 

    for (let i = 0; i < 10; i++) {
      let currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      let dayNum = currentDate.getDate();
      let monthStr = lang === 'id' ? months[currentDate.getMonth()] : monthsEn[currentDate.getMonth()];
      let yearShort = currentDate.getFullYear().toString().slice(-2);
      let dateStr = `${dayNum} ${monthStr}, ${yearShort}`;
      
      dates.push(dateStr);
      
      let multiplier = 1;
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        multiplier = 1.15; // Weekend peak
      } else if (dayOfWeek === 2 || dayOfWeek === 3) {
        multiplier = 0.9;  // Mid-week discount
      }
      prices[dateStr] = multiplier;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateList(dates);
    setDatePrices(prices);
    setSelectedDate(dates[0]);
    setSelectedReturnDate(dates[1]);

    const uniqueOperators = [...new Set(ticketDatabase.map(t => t.operator))];
    setActiveOperators(uniqueOperators);

    try {
      const saved = localStorage.getItem('sea_tickets_history');
      if (saved) {
        setBookingHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load booking history", e);
    }

    // Set map visibility based on screen size
    const handleResize = () => {
      setIsMapVisible(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [lang]);

  // Trigger skeleton loading state on date or route change
  useEffect(() => {
    setIsLoadingTickets(true);
    const timer = setTimeout(() => {
      setIsLoadingTickets(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedDate, selectedReturnDate, origin, destination]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleTypeToggle = (type) => {
    if (activeTypes.includes(type)) {
      setActiveTypes(activeTypes.filter(t => t !== type));
    } else {
      setActiveTypes([...activeTypes, type]);
    }
  };

  const handleOperatorToggle = (op) => {
    if (activeOperators.includes(op)) {
      setActiveOperators(activeOperators.filter(o => o !== op));
    } else {
      setActiveOperators([...activeOperators, op]);
    }
  };

  const clearAllFilters = () => {
    setActiveTypes(["Reguler", "VIP", "Carter"]);
    setMaxDepartureHour(17);
    setActiveOperators([...new Set(ticketDatabase.map(t => t.operator))]);
    showToast(t.toastResetFilters, "info");
  };

  const swapPorts = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    showToast(t.toastRouteUpdated, "success");
  };

  const mapPorts = {
    "Nunukan": { label: "Nunukan", code: "NNK", coord: [117.6521, 4.1417] },
    "Malinau": { label: "Malinau", code: "MLN", coord: [116.6343, 3.5852] },
    "Tarakan": { label: "Tarakan", code: "TRK", coord: [117.5855, 3.3276] },
    "Tanjung Selor": { label: "Tanjung Selor", code: "TJS", coord: [117.3625, 2.8361] }
  };

  const handleMapPortClick = (portName) => {
    if (mapSelectionStep === 'origin') {
      if (portName === destination) {
        setDestination(origin);
      }
      setOrigin(portName);
      setMapSelectionStep('destination');
      showToast(lang === 'id' ? `Asal diatur ke ${portName}. Sekarang pilih Tujuan.` : `Origin set to ${portName}. Now select Destination.`, "info");
    } else {
      if (portName === origin) {
         setMapSelectionStep('destination');
         return;
      }
      setDestination(portName);
      setMapSelectionStep('origin');
      showToast(`${t.toastRouteUpdated}: ${origin} ➔ ${portName}`, "success");
    }
  };

  const getFilteredTickets = (isReturn = false) => {
    const activeDate = isReturn ? selectedReturnDate : selectedDate;
    const multiplier = datePrices[activeDate] || 1;
    
    let result = ticketDatabase.filter(ticket => {
      if (!activeTypes.includes(ticket.type)) return false;
      
      const hour = parseInt(ticket.departTime.split(':')[0]);
      if (hour > maxDepartureHour) return false;

      if (!activeOperators.includes(ticket.operator)) return false;

      return true;
    });

    if (currentSort === "price") {
      result.sort((a, b) => (a.basePrice * multiplier) - (b.basePrice * multiplier));
    } else if (currentSort === "speed") {
      result.sort((a, b) => a.speedRank - b.speedRank);
    }

    return result;
  };

  const handleSelectTicket = (ticket) => {
    const isReturn = bookingFlowState === 'return_select';
    const activeDate = isReturn ? selectedReturnDate : selectedDate;
    const multiplier = datePrices[activeDate] || 1;
    const finalPrice = Math.round(ticket.basePrice * multiplier);

    if (!isReturn) {
      setSelectedOutboundTicket({ ...ticket, finalPrice });
      if (isRoundTrip) {
        setBookingFlowState('return_select');
        showToast(lang === 'id' ? 'Tiket pergi dipilih! Silakan pilih tiket pulang.' : 'Outbound ticket selected! Please select return ticket.', 'info');
      } else {
        setupCheckout();
      }
    } else {
      setSelectedReturnTicket({ ...ticket, finalPrice });
      setupCheckout();
    }
  };

  const setupCheckout = () => {
    const totalCount = adults + kids + infants;
    const initialPassengers = Array.from({ length: totalCount }, (_, i) => {
      let label = '';
      let age = '30';
      let isInfant = false;
      if (i < adults) {
        label = `${lang === 'id' ? 'Dewasa' : 'Adult'} ${i + 1}`;
      } else if (i < adults + kids) {
        label = `${lang === 'id' ? 'Anak' : 'Child'} ${i - adults + 1}`;
        age = '10';
      } else {
        label = `${lang === 'id' ? 'Bayi' : 'Infant'} ${i - adults - kids + 1}`;
        age = '1';
        isInfant = true;
      }
      return {
        id: i,
        label,
        name: "",
        nik: "",
        gender: "L", // default
        age,
        isInfant,
        seatOutbound: isInfant ? "INF" : "",
        seatReturn: isInfant ? "INF" : ""
      };
    });

    setPassengersData(initialPassengers);
    setAppliedPromo(null);
    setPromoCodeInput("");
    setCheckoutActive(true);
  };

  const openSeatModal = (type, passengerIdx) => {
    setActiveSeatSelectingType(type);
    setActiveSeatPassengerIdx(passengerIdx);
    setIsSeatSelectorOpen(true);
  };

  const handleSeatClick = (seatCode) => {
    const updated = [...passengersData];
    const ticketId = activeSeatSelectingType === 'outbound' ? selectedOutboundTicket.id : selectedReturnTicket.id;
    const activeDate = activeSeatSelectingType === 'outbound' ? selectedDate : selectedReturnDate;
    
    const occupied = getOccupiedSeats(ticketId, activeDate);
    if (occupied.includes(seatCode)) return;

    const seatField = activeSeatSelectingType === 'outbound' ? 'seatOutbound' : 'seatReturn';
    const isTaken = updated.some((p, idx) => idx !== activeSeatPassengerIdx && p[seatField] === seatCode);
    if (isTaken) {
      showToast(lang === 'id' ? 'Kursi sudah dipilih oleh penumpang lain!' : 'Seat already chosen by another passenger!', 'error');
      return;
    }

    updated[activeSeatPassengerIdx][seatField] = seatCode;
    setPassengersData(updated);
    setIsSeatSelectorOpen(false);
    showToast(lang === 'id' ? `Kursi ${seatCode} berhasil dipilih!` : `Seat ${seatCode} selected!`, 'success');
  };

  const applyPromoCode = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    let discountPercent = 0;
    let discountFlat = 0;
    
    if (code === 'SEATIKET10') {
      discountPercent = 0.10;
    } else if (code === 'KALTARAPROMO') {
      discountPercent = 0.15;
    } else if (code === 'LIBURANSERU') {
      discountFlat = 50000;
    } else {
      showToast(t.toastPromoInvalid, "error");
      return;
    }

    const ticketQty = adults + kids;
    let totalBase = selectedOutboundTicket.finalPrice * ticketQty;
    if (selectedReturnTicket) {
      totalBase += selectedReturnTicket.finalPrice * ticketQty;
    }

    let discountAmount = 0;
    if (discountPercent > 0) {
      discountAmount = Math.round(totalBase * discountPercent);
    } else if (discountFlat > 0) {
      discountAmount = Math.min(discountFlat, totalBase);
    }

    setAppliedPromo({
      code,
      discountAmount,
      type: discountPercent > 0 ? `${discountPercent * 100}%` : `Flat`
    });
    showToast(t.toastPromoApplied, "success");
  };

  const submitBooking = async () => {
    if (!buyerName.trim() || !buyerPhone.trim()) {
      showToast(t.toastContactRequired, "error");
      return;
    }

    const isAllPassengersFilled = passengersData.every(p => p.name.trim() !== "");
    if (!isAllPassengersFilled) {
      showToast(t.toastPassengerRequired, "error");
      return;
    }

    const outboundSeatsOk = passengersData.every(p => p.seatOutbound !== "");
    let returnSeatsOk = true;
    if (selectedReturnTicket) {
      returnSeatsOk = passengersData.every(p => p.seatReturn !== "");
    }

    if (!outboundSeatsOk || !returnSeatsOk) {
      showToast(t.toastSeatRequired, "error");
      return;
    }

    const randomBookingRef = "MNT-" + (Math.floor(Math.random() * 90000) + 10000) + "B";
    const finalPaid = getFinalPrice();
    
    const bookingDetails = {
      bookingId: randomBookingRef,
      buyerName,
      buyerPhone,
      passengers: passengersData,
      outboundTicket: selectedOutboundTicket,
      returnTicket: selectedReturnTicket,
      isRoundTrip,
      outboundDate: selectedDate,
      returnDate: selectedReturnDate,
      origin,
      destination,
      timestamp: new Date().toISOString(),
      appliedPromo,
      finalPaid,
      paymentStatus: "MENUNGGU PEMBAYARAN"
    };

    try {
      const response = await fetch('http://localhost:3001/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: randomBookingRef,
          gross_amount: finalPaid,
          first_name: buyerName,
          phone: buyerPhone
        })
      });

      if (!response.ok) throw new Error("Failed to get payment token");
      const data = await response.json();

      window.snap.pay(data.token, {
        onSuccess: function(result) {
          bookingDetails.paymentStatus = "LUNAS";
          finishBooking(bookingDetails);
        },
        onPending: function(result) {
          bookingDetails.paymentStatus = "MENUNGGU PEMBAYARAN";
          finishBooking(bookingDetails);
        },
        onError: function(result) {
          showToast("Pembayaran gagal, silakan coba lagi.", "error");
        },
        onClose: function() {
          showToast("Menunggu pembayaran...", "info");
          finishBooking(bookingDetails);
        }
      });
    } catch (err) {
      console.error(err);
      showToast("Gagal menghubungi server pembayaran.", "error");
    }
  };

  const finishBooking = (bookingDetails) => {
    const newHistory = [bookingDetails, ...bookingHistory];
    setBookingHistory(newHistory);
    try {
      localStorage.setItem('sea_tickets_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to write booking history", e);
    }
    setLastBookingResult(bookingDetails);
    setIsSuccessModalOpen(true);
  };

  const handleCancelBooking = (bookingId) => {
    const updatedHistory = bookingHistory.map(b => {
      if (b.bookingId === bookingId) {
        return { ...b, paymentStatus: "DIBATALKAN" };
      }
      return b;
    });
    setBookingHistory(updatedHistory);
    try {
      localStorage.setItem('sea_tickets_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error(e);
    }
    setSelectedCancelBooking(null);
    showToast("Tiket berhasil dibatalkan.", "success");
  };

  const getSubtotal = () => {
    const qty = adults + kids;
    let base = selectedOutboundTicket ? selectedOutboundTicket.finalPrice * qty : 0;
    if (selectedReturnTicket) {
      base += selectedReturnTicket.finalPrice * qty;
    }
    return base;
  };

  const getFinalPrice = () => {
    const subtotal = getSubtotal();
    const discount = appliedPromo ? appliedPromo.discountAmount : 0;
    return Math.max(0, subtotal - discount);
  };

  const shareTicket = (ticket, isReturnTkt = false) => {
    const activeDate = isReturnTkt ? selectedReturnDate : selectedDate;
    const multiplier = datePrices[activeDate] || 1;
    const price = Math.round((ticket.basePrice * multiplier) / 1000);
    const text = `Yuk bepergian! Speedboat ${ticket.operator} (${ticket.type}) rute ${isReturnTkt ? destination : origin} ke ${isReturnTkt ? origin : destination} tanggal ${activeDate} cuma Rp${price}k. Pesan sekarang di SEA tickets!`;
    
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    showToast(t.shareToast, "info");
  };

  const executeSearchChange = (newOrigin, newDest, isRT, newAdults, newKids, dateOut, dateRet, newInfants = infants, newClass = passengerClass) => {
    if (newOrigin === newDest) {
      showToast(t.toastSamePort, "error");
      return;
    }
    setOrigin(newOrigin);
    setDestination(newDest);
    setIsRoundTrip(isRT);
    setAdults(newAdults);
    setKids(newKids);
    setInfants(newInfants);
    setPassengerClass(newClass);
    if (dateOut) setSelectedDate(dateOut);
    if (dateRet) setSelectedReturnDate(dateRet);
    
    setIsSearchModalOpen(false);
    setBookingFlowState('outbound_select');
    setSelectedOutboundTicket(null);
    setSelectedReturnTicket(null);
    showToast(t.toastRouteUpdated, "success");
  };

  return (
    <div className="w-full min-h-[100dvh] lg:h-[100dvh] flex flex-col bg-white lg:overflow-hidden font-sans relative font-normal px-2.5 py-1.5 xs:px-3 xs:py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-4 text-slate-800">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:top-5 z-[150] animate-bounce-short">
          <div className="bg-slate-900 text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-xl flex items-center gap-2.5 sm:gap-3 border border-slate-850">
            <span className={`text-sm ${toast.type === 'error' ? 'text-rose-400' : toast.type === 'info' ? 'text-sky-400' : 'text-emerald-400'}`}>
              {toast.type === 'error' ? <i className="fa-solid fa-triangle-exclamation"></i> : <i className="fa-solid fa-circle-check"></i>}
            </span>
            <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Inner Wrapper */}
      <div className="w-full lg:h-full flex flex-col lg:overflow-hidden">
        
        {/* Header */}
        <header className="flex flex-row justify-between items-center mb-2 xs:mb-2.5 sm:mb-3 gap-2 sm:gap-4 border-b border-slate-100 pb-1.5 xs:pb-2 sm:pb-2.5 flex-shrink-0">
          
          {/* Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-primary cursor-pointer flex-shrink-0" onClick={() => { setActiveTab('landing'); setBookingFlowState('outbound_select'); setCheckoutActive(false); }}>
            <div className="text-primary p-1 rounded-lg">
              <svg className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 fill-current" viewBox="0 0 24 24"><path d="M12 2c-1.5 0-3 1.5-4 3-1.5 2.5-4 5-6 6 2 1 4.5 1.5 6 1.5 1 0 2.5.5 3.5 2.5 1-2 2.5-2.5 3.5-2.5 1.5 0 4-.5 6-1.5-2-1-4.5-3.5-6-6-1-1.5-2.5-3-4-3z"/></svg>
            </div>
            <h1 className="text-base xs:text-lg sm:text-2xl font-bold tracking-tight">MANTARA</h1>
          </div>

          {/* Navigation preferences */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-3 flex-shrink min-w-0">
            
            {/* Tab selector */}
            <div className="flex bg-slate-100 border border-slate-200 p-0.5 sm:p-1 rounded-lg xs:rounded-xl sm:rounded-2xl">
              <button 
                onClick={() => { setActiveTab('landing'); setCheckoutActive(false); }} 
                className={`px-2 xs:px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md xs:rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1 sm:gap-1.5 ${activeTab === 'search' || activeTab === 'landing' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-primary'}`}
              >
                <i className="fa-solid fa-magnifying-glass"></i>
                <span className="hidden xs:inline">{t.searchTickets}</span>
              </button>
              <button 
                onClick={() => { setActiveTab('history'); setCheckoutActive(false); }} 
                className={`px-2 xs:px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md xs:rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1 sm:gap-1.5 ${activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-primary'}`}
              >
                <i className="fa-solid fa-ticket"></i>
                <span className="hidden xs:inline">{t.myBookings}</span>
                {bookingHistory.length > 0 && (
                  <span className="ml-0.5 xs:ml-1 sm:ml-1.5 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] bg-accent text-white rounded-full font-bold">{bookingHistory.length}</span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 flex-shrink-0">
              {/* Language Switcher */}
              <div className="flex bg-slate-100 border border-slate-200 p-0.5 sm:p-1 rounded-md xs:rounded-lg sm:rounded-xl">
                <button onClick={() => setLang('id')} className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-[4px] xs:rounded-md sm:rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold transition ${lang === 'id' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}>
                  ID
                </button>
                <button onClick={() => setLang('en')} className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-[4px] xs:rounded-md sm:rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold transition ${lang === 'en' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}>
                  EN
                </button>
              </div>

              {/* Map Visibility Toggle */}
              {activeTab === 'search' && (
                <button 
                  onClick={() => setIsMapVisible(!isMapVisible)} 
                  className={`w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md xs:rounded-lg sm:rounded-xl border transition text-xs xs:text-sm sm:text-base ${isMapVisible ? 'bg-sky-50 border-primary/20 text-primary' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                  title={t.routeMap}
                >
                  <i className="fa-solid fa-map-location-dot"></i>
                </button>
              )}
            </div>

          </div>
        </header>

        {activeTab === 'landing' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-8 pr-1">
            
            {/* Hero Container with Wallpaper */}
            <div className="relative w-full rounded-[24px] sm:rounded-[32px] min-h-[460px] md:min-h-[500px] flex flex-col justify-between p-6 sm:p-8 md:p-10 shadow-lg text-white overflow-visible" 
                 style={{ backgroundImage: `url('/hero_bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-950/40 to-slate-950/80 z-0 rounded-[24px] sm:rounded-[32px] overflow-hidden"></div>



              {/* Wording / Heading */}
              <div className="relative z-10 max-w-2xl mt-8 mb-6 text-left">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-md">
                  {lang === 'id' ? 'Berlayar Lebih Jauh, Sampai Lebih Cepat.' : 'Sail Further, Arrive Faster.'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 mt-2 font-medium leading-relaxed drop-shadow-sm">
                  {lang === 'id' 
                    ? 'Cari dan pesan tiket speedboat terlengkap rute Tarakan, Tanjung Selor, Nunukan, Malinau, dan Derawan secara praktis.' 
                    : 'Search and book speedboat tickets for Tarakan, Tanjung Selor, Nunukan, Malinau, and Derawan route.'}
                </p>
              </div>

              {/* Weather Widget */}
              <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 mb-8 w-max shadow-sm">
                <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-xl">
                  <i className="fa-solid fa-cloud-sun text-yellow-300 text-xl"></i>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-wider mb-0.5">{lang === 'id' ? 'Info Cuaca & Laut Kaltara' : 'Kaltara Weather & Sea Info'}</p>
                  <p className="text-xs sm:text-sm font-medium text-white">{lang === 'id' ? 'Cerah berawan. Gelombang 0.3m - 0.8m (Aman Berlayar)' : 'Partly cloudy. Waves 0.3m - 0.8m (Safe to Sail)'}</p>
                </div>
              </div>

              {/* Float Booking Search Bar */}
              <div className="relative z-[50] w-full bg-white text-slate-800 rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 shadow-2xl border border-slate-100 flex flex-col xl:flex-row gap-4 xl:items-end">
                
                {/* Asal & Tujuan */}
                <div className="flex-1 flex flex-row items-end gap-2 relative">
                  
                  {/* Origin */}
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'id' ? 'ASAL' : 'ORIGIN'}</label>
                    <div className="relative">
                      <span className="absolute left-2.5 xs:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs xs:text-sm">
                        <i className="fa-solid fa-ship"></i>
                      </span>
                      <select 
                        value={origin} 
                        onChange={(e) => setOrigin(e.target.value)} 
                        className="w-full border border-slate-200 bg-white rounded-xl pl-8 xs:pl-10 pr-2 xs:pr-4 py-2.5 xs:py-3 text-xs xs:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                      >
                        {locations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <button 
                    onClick={swapPorts} 
                    className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-100 transition flex items-center justify-center flex-shrink-0 mb-1.5 sm:mb-2 shadow-sm"
                    style={{ transform: 'translateY(-2px)' }}
                  >
                    <i className="fa-solid fa-arrow-right-arrow-left text-xs"></i>
                  </button>

                  {/* Destination */}
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'id' ? 'TUJUAN' : 'DESTINATION'}</label>
                    <div className="relative">
                      <span className="absolute left-2.5 xs:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs xs:text-sm">
                        <i className="fa-solid fa-location-dot"></i>
                      </span>
                      <select 
                        value={destination} 
                        onChange={(e) => setDestination(e.target.value)} 
                        className="w-full border border-slate-200 bg-white rounded-xl pl-8 xs:pl-10 pr-2 xs:pr-4 py-2.5 xs:py-3 text-xs xs:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                      >
                        {locations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* Dates */}
                <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4">
                  
                  {/* Depart Date */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'id' ? 'BERANGKAT' : 'DEPART'}</label>
                    <div className="relative">
                      <span className="absolute left-2.5 xs:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs xs:text-sm">
                        <i className="fa-regular fa-calendar"></i>
                      </span>
                      <select 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="w-full border border-slate-200 bg-white rounded-xl pl-8 xs:pl-10 pr-2 xs:pr-4 py-2.5 xs:py-3 text-xs xs:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                      >
                        {dateList.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Return Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-1">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{lang === 'id' ? 'PULANG' : 'RETURN'}</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={isRoundTrip} 
                          onChange={(e) => setIsRoundTrip(e.target.checked)} 
                          className="custom-checkbox w-3.5 h-3.5" 
                        />
                        <span className="text-[9px] xs:text-[10px] font-bold text-primary">
                          {lang === 'id' ? (
                            <>
                              <span className="inline xs:hidden">PP</span>
                              <span className="hidden xs:inline">Pulang Pergi</span>
                            </>
                          ) : (
                            <>
                              <span className="inline xs:hidden">RT</span>
                              <span className="hidden xs:inline">Round Trip</span>
                            </>
                          )}
                        </span>
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 xs:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs xs:text-sm">
                        <i className="fa-solid fa-rotate-left"></i>
                      </span>
                      <select 
                        value={selectedReturnDate} 
                        disabled={!isRoundTrip} 
                        onChange={(e) => setSelectedReturnDate(e.target.value)} 
                        className="w-full border border-slate-200 bg-white rounded-xl pl-8 xs:pl-10 pr-2 xs:pr-4 py-2.5 xs:py-3 text-xs xs:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-slate-50/50 disabled:text-slate-350 disabled:cursor-not-allowed appearance-none cursor-pointer"
                      >
                        {dateList.map(d => {
                          let disabled = false;
                          const outIdx = dateList.indexOf(selectedDate);
                          const retIdx = dateList.indexOf(d);
                          if (retIdx < outIdx) disabled = true;
                          return (
                            <option key={d} value={d} disabled={disabled}>{d}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                </div>

                {/* Passengers & Search Button */}
                <div className="grid grid-cols-2 items-end gap-3 sm:gap-4 xl:w-96">
                  
                  {/* Passengers */}
                  <div className="relative z-[200]">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'id' ? 'PENUMPANG' : 'PASSENGER'}</label>
                    <div 
                      onClick={() => setIsPassengerModalOpen(!isPassengerModalOpen)}
                      className="relative cursor-pointer"
                    >
                      <span className="absolute left-2.5 xs:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs xs:text-sm">
                        <i className="fa-solid fa-users"></i>
                      </span>
                      <div className="w-full border border-slate-200 bg-white rounded-xl pl-8 xs:pl-10 pr-2 xs:pr-4 py-2.5 xs:py-3 text-xs xs:text-sm font-bold text-slate-700 flex items-center justify-between">
                        <span className="whitespace-nowrap">{adults + kids + infants} {lang === 'id' ? 'Penumpang' : 'Passenger'}</span>
                      </div>
                    </div>

                    {isPassengerModalOpen && (
                      <div className="absolute top-[calc(100%+8px)] left-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] p-4 text-left">
                        <h4 className="font-extrabold text-slate-900 text-sm mb-4">{lang === 'id' ? 'Atur Penumpang' : 'Set Passenger'}</h4>
                        
                        <div className="space-y-4 mb-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{lang === 'id' ? 'Dewasa (di atas 12 tahun)' : 'Adult (above 12 years old)'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={(e) => { e.stopPropagation(); setAdults(Math.max(1, adults - 1)); }} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary"><i className="fa-solid fa-minus"></i></button>
                              <span className="text-sm font-bold w-4 text-center">{adults}</span>
                              <button onClick={(e) => { e.stopPropagation(); setAdults(adults + 1); }} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary"><i className="fa-solid fa-plus"></i></button>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{lang === 'id' ? 'Anak (2 - 11 tahun)' : 'Children (2 - 11 years old)'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={(e) => { e.stopPropagation(); setKids(Math.max(0, kids - 1)); }} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary"><i className="fa-solid fa-minus"></i></button>
                              <span className="text-sm font-bold w-4 text-center">{kids}</span>
                              <button onClick={(e) => { e.stopPropagation(); setKids(kids + 1); }} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary"><i className="fa-solid fa-plus"></i></button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{lang === 'id' ? 'Bayi (di bawah 2 tahun)' : 'Infant (below 2 years old)'}</p>
                              <p className="text-[10px] text-emerald-500 font-bold">{lang === 'id' ? 'Tidak dikenakan biaya' : 'Free of charge'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={(e) => { e.stopPropagation(); setInfants(Math.max(0, infants - 1)); }} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary"><i className="fa-solid fa-minus"></i></button>
                              <span className="text-sm font-bold w-4 text-center">{infants}</span>
                              <button onClick={(e) => { e.stopPropagation(); setInfants(infants + 1); }} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary"><i className="fa-solid fa-plus"></i></button>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsPassengerModalOpen(false); }}
                          className="w-full bg-primary hover:bg-sky-800 text-white font-bold py-3 rounded-xl transition shadow-md shadow-sky-100"
                        >
                          {lang === 'id' ? 'Simpan' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Search Button */}
                  <button 
                    onClick={() => {
                      if (origin === destination) {
                        showToast(t.toastSamePort, "error");
                        return;
                      }
                      setActiveTab('search');
                      setBookingFlowState('outbound_select');
                      showToast(t.toastRouteUpdated, "success");
                    }} 
                    className="bg-accent hover:bg-orange-600 text-white rounded-xl py-2.5 xs:py-3 px-4 font-bold text-xs xs:text-sm tracking-wider uppercase transition shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <span>Cari</span>
                  </button>

                </div>

              </div>

            </div>


            {/* Promo & Offers Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight flex items-center gap-2">
                  <i className="fa-solid fa-tags text-primary"></i>
                  <span>{lang === 'id' ? 'Penawaran Spesial Kaltara' : 'Special Kaltara Offers'}</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Card: Derawan Tour Banner */}
                <div className="relative rounded-[20px] overflow-hidden border border-slate-100 shadow-md group cursor-pointer" onClick={() => showToast(lang === 'id' ? "Gunakan kode kupon LIBURANSERU saat checkout!" : "Use coupon code LIBURANSERU at checkout!", "info")}>
                  <img src="/promo_derawan.png" alt="Derawan Tour" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-5">
                    <div>
                      <span className="text-[9px] font-extrabold bg-accent text-white px-2 py-0.5 rounded-full uppercase tracking-wider">WISATA</span>
                      <h4 className="text-white font-extrabold text-sm md:text-base mt-1.5">{lang === 'id' ? 'Jelajahi Surga Kepulauan Derawan' : 'Explore the Paradise of Derawan Islands'}</h4>
                      <p className="text-[10px] text-slate-200 mt-0.5 font-medium">{lang === 'id' ? 'Dapatkan diskon speedboat sewa khusus liburan akhir pekan.' : 'Get special private charter discounts for weekend trips.'}</p>
                    </div>
                  </div>
                </div>

                {/* Right Card: Summer Holiday Promo Banner */}
                <div className="bg-gradient-to-r from-primary to-sky-800 rounded-[20px] p-6 shadow-md text-white flex flex-col justify-between relative overflow-hidden border border-sky-950/20 group cursor-pointer" onClick={() => { navigator.clipboard.writeText('LIBURANSERU'); showToast(lang === 'id' ? "Kupon LIBURANSERU disalin!" : "Coupon LIBURANSERU copied!", "success"); }}>
                  {/* Glowing circles */}
                  <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute -left-10 -top-10 w-36 h-36 bg-accent/20 rounded-full blur-2xl"></div>

                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-extrabold bg-sky-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">{lang === 'id' ? 'LIBURAN SERU' : 'SUMMER HOLIDAY'}</span>
                      <h4 className="font-extrabold text-lg md:text-xl mt-2 tracking-tight">{lang === 'id' ? 'Kupon Potongan Rp 50.000' : 'Rp 50.000 Coupon Discount'}</h4>
                      <p className="text-xs text-sky-200 mt-1 font-medium leading-relaxed">{lang === 'id' ? 'Nikmati perjalanan seru rute Tarakan ➔ Malinau.' : 'Enjoy exciting journeys on the Tarakan ➔ Malinau route.'}</p>
                    </div>
                    <i className="fa-solid fa-gift text-accent text-3xl animate-bounce-short"></i>
                  </div>

                  <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-white/60 font-bold block uppercase tracking-wider">KODE KUPON</span>
                      <span className="text-sm font-extrabold tracking-widest text-accent">LIBURANSERU</span>
                    </div>
                    <button className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition">
                      {lang === 'id' ? 'Salin Kode' : 'Copy Code'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Coupons Grid Section */}
            <div className="space-y-4 pt-2">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight flex items-center gap-2">
                <i className="fa-solid fa-gift text-accent"></i>
                <span>{lang === 'id' ? 'Kupon Diskon untuk Anda' : 'Discount Coupons for You'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Coupon Card 1 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-primary/30 transition group cursor-pointer" onClick={() => { navigator.clipboard.writeText('SEATIKET10'); showToast("Kupon SEATIKET10 disalin!", "success"); }}>
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-primary flex-shrink-0">
                      <i className="fa-solid fa-ticket-simple text-lg"></i>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-900 font-extrabold text-sm block truncate">SEATIKET10</span>
                      <span className="text-[10px] text-slate-500 font-semibold block">{lang === 'id' ? 'Diskon 10% Semua Rute' : '10% Off All Routes'}</span>
                    </div>
                  </div>
                  <i className="fa-regular fa-clone text-slate-400 group-hover:text-primary transition flex-shrink-0 text-sm"></i>
                </div>

                {/* Coupon Card 2 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-primary/30 transition group cursor-pointer" onClick={() => { navigator.clipboard.writeText('KALTARAPROMO'); showToast("Kupon KALTARAPROMO disalin!", "success"); }}>
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-primary flex-shrink-0">
                      <i className="fa-solid fa-percent text-lg"></i>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-900 font-extrabold text-sm block truncate">KALTARAPROMO</span>
                      <span className="text-[10px] text-slate-500 font-semibold block">{lang === 'id' ? 'Diskon 15% VIP Speedboat' : '15% Off VIP Speedboats'}</span>
                    </div>
                  </div>
                  <i className="fa-regular fa-clone text-slate-400 group-hover:text-primary transition flex-shrink-0 text-sm"></i>
                </div>

                {/* Coupon Card 3 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-primary/30 transition group cursor-pointer" onClick={() => { navigator.clipboard.writeText('LIBURANSERU'); showToast("Kupon LIBURANSERU disalin!", "success"); }}>
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-accent flex-shrink-0">
                      <i className="fa-solid fa-gift text-lg"></i>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-900 font-extrabold text-sm block truncate">LIBURANSERU</span>
                      <span className="text-[10px] text-slate-500 font-semibold block">{lang === 'id' ? 'Diskon Flat Rp 50.000' : 'Flat Rp 50.000 Off'}</span>
                    </div>
                  </div>
                  <i className="fa-regular fa-clone text-slate-400 group-hover:text-accent transition flex-shrink-0 text-sm"></i>
                </div>

              </div>
            </div>

            <Footer lang={lang} />
          </div>
        )}

        {activeTab === 'search' && !checkoutActive && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 pr-1">
            {/* Route Summary Ribbon */}
            <div className="bg-gradient-to-r from-slate-50 to-sky-50/30 rounded-xl sm:rounded-2xl p-2.5 xs:p-3 sm:p-4 mb-2.5 xs:mb-3 sm:mb-4 border border-slate-100/80 flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Left Side: Route and Date info */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 xs:gap-3 flex-1 min-w-0">
                {/* Route pill + Type */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 xs:gap-2 bg-white py-1 xs:py-1.5 px-2 xs:px-2.5 sm:px-3 rounded-lg sm:rounded-xl border border-slate-200/80 shadow-sm">
                    <span className="font-extrabold text-slate-900 text-[11px] xs:text-xs sm:text-sm truncate max-w-[80px] xs:max-w-none">{origin}</span>
                    <i className="fa-solid fa-arrow-right text-primary/60 text-[8px] xs:text-[10px]"></i>
                    <span className="font-extrabold text-slate-900 text-[11px] xs:text-xs sm:text-sm truncate max-w-[80px] xs:max-w-none">{destination}</span>
                  </div>
                  <span className="text-[9px] xs:text-[10px] sm:text-xs text-primary font-bold bg-sky-50 border border-sky-100/50 px-1.5 xs:px-2 py-0.5 rounded-md whitespace-nowrap">
                    {isRoundTrip ? t.roundTrip : t.oneWay}
                  </span>
                </div>

                {/* Meta info: date + passengers */}
                <div className="hidden xs:flex items-center gap-2.5 sm:gap-4 text-slate-500">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <i className="fa-regular fa-calendar text-primary/70 text-[10px] sm:text-xs"></i>
                    <span className="font-semibold text-[10px] sm:text-xs">{selectedDate}</span>
                    {isRoundTrip && (
                      <>
                        <span className="text-slate-300">–</span>
                        <span className="font-semibold text-[10px] sm:text-xs text-accent">{selectedReturnDate}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <i className="fa-solid fa-user text-primary/70 text-[10px] sm:text-xs"></i>
                    <span className="font-semibold text-[10px] sm:text-xs">{adults + kids} {lang === 'id' ? 'Penumpang' : 'Passengers'}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Action buttons */}
              <div className="flex items-center gap-1.5 xs:gap-2 md:flex-shrink-0">
                <button onClick={() => setIsSearchModalOpen(true)} className="flex-1 md:flex-none flex bg-primary hover:bg-sky-800 text-white rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 xs:py-2.5 items-center justify-center gap-1.5 sm:gap-2 text-[10px] xs:text-[11px] sm:text-xs font-bold transition shadow-md shadow-sky-100/50">
                  <i className="fa-solid fa-sliders text-white/80"></i>
                  <span>{t.searchRoute}</span>
                </button>
                <button onClick={() => showToast(t.notifEnabled, 'info')} className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-400 rounded-lg sm:rounded-xl flex items-center justify-center transition shadow-sm flex-shrink-0">
                  <i className="fa-regular fa-bell text-xs"></i>
                </button>
                {/* Mobile-only: show date & pax info */}
                <div className="flex xs:hidden items-center gap-1 bg-white border border-slate-200/80 rounded-lg px-2 py-1.5 shadow-sm">
                  <i className="fa-regular fa-calendar text-primary/60 text-[9px]"></i>
                  <span className="text-[9px] font-bold text-slate-600">{selectedDate.split(',')[0]}</span>
                  <span className="text-slate-300">·</span>
                  <i className="fa-solid fa-user text-primary/60 text-[9px]"></i>
                  <span className="text-[9px] font-bold text-slate-600">{adults + kids}</span>
                </div>
              </div>
            </div>

            {/* Collapsible Interactive SVG Map Section */}
            {isMapVisible && (
              <div className="grid grid-cols-1 lg:grid-cols-12 bg-slate-50 border border-slate-200/60 rounded-2xl sm:rounded-3xl p-3 sm:p-4 mb-3 sm:mb-4 flex-shrink-0 gap-3 sm:gap-4 overflow-hidden relative shadow-sm">
                <div className="lg:col-span-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2 text-primary">
                    <i className="fa-solid fa-map-location-dot text-sm"></i>
                    <h3 className="font-extrabold text-xs sm:text-sm tracking-wide uppercase">{t.routeMap}</h3>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1.5 sm:mb-2">{origin} ➔ {destination}</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4 leading-relaxed">{t.mapInstruction}</p>
                  
                  {/* Connection indicator */}
                  <div className="bg-white border border-slate-200 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block">{lang === 'id' ? 'ASAL' : 'ORIGIN'}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-700">{origin} ({mapPorts[origin]?.code})</span>
                    </div>
                    <button onClick={swapPorts} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-primary hover:text-white transition flex items-center justify-center shadow-sm flex-shrink-0 mx-2">
                      <i className="fa-solid fa-arrow-right-arrow-left text-[10px] sm:text-xs"></i>
                    </button>
                    <div className="text-right">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block">{lang === 'id' ? 'TUJUAN' : 'DESTINATION'}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-primary">{destination} ({mapPorts[destination]?.code})</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 h-48 sm:h-64 md:h-72 lg:h-64 flex justify-center bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 relative overflow-hidden shadow-inner">
                  
                  {/* Mapcn Component Map */}
                  <Map
                    viewport={{
                      center: [117.2, 3.4], // Centered in North Kalimantan
                      zoom: 6.8,
                      pitch: 20,
                    }}
                    className="w-full h-full"
                  >
                    <MapControls showZoom showCompass position="top-right" />
                    
                    <MapRoute
                      coordinates={[
                        mapPorts[origin]?.coord,
                        mapPorts[destination]?.coord,
                      ]}
                      color="#0369a1"
                      lineWidth={4}
                      animated={true}
                    />
                    
                    {Object.entries(mapPorts).map(([portName, data]) => {
                      const isOrigin = portName === origin;
                      const isDest = portName === destination;
                      const isSelected = isOrigin || isDest;
                      
                      return (
                        <MapMarker
                          key={portName}
                          longitude={data.coord[0]}
                          latitude={data.coord[1]}
                          onClick={() => handleMapPortClick(portName)}
                        >
                          <MarkerContent className="group">
                            {isSelected && (
                              <div className={`absolute -inset-2.5 rounded-full animate-ping ${isOrigin ? 'bg-sky-500/60' : 'bg-orange-500/60'}`}></div>
                            )}
                            <div className={`relative w-5 h-5 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 shadow-md ${isSelected ? (isOrigin ? 'bg-sky-600 border-white' : 'bg-orange-500 border-white') : 'bg-white border-slate-400'}`}></div>
                            <MarkerLabel position="bottom" className={`mt-2 px-1.5 py-0.5 rounded-sm backdrop-blur-xs font-bold shadow-xs transition-colors ${isSelected ? 'text-slate-900 bg-white/80' : 'text-slate-600 bg-white/50'} group-hover:text-slate-900 group-hover:bg-white`}>
                              {data.label} ({data.code})
                            </MarkerLabel>
                          </MarkerContent>
                        </MapMarker>
                      );
                    })}
                  </Map>
                  {/* Status Indicator */}
                  <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
                    {mapSelectionStep === 'origin' 
                      ? (lang === 'id' ? 'Klik pelabuhan untuk Asal' : 'Click a port for Origin')
                      : (lang === 'id' ? 'Klik pelabuhan untuk Tujuan' : 'Click a port for Destination')
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Outbound/Return step indicator */}
            {isRoundTrip && (
              <div className="flex bg-slate-100 border border-slate-200 rounded-lg xs:rounded-xl sm:rounded-2xl p-0.5 sm:p-1 mb-2.5 xs:mb-4 sm:mb-6 flex-shrink-0 max-w-md shadow-sm">
                <button 
                  onClick={() => setBookingFlowState('outbound_select')} 
                  className={`flex-1 py-1.5 xs:py-2 sm:py-2.5 rounded-md xs:rounded-lg sm:rounded-xl text-[9px] xs:text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 ${bookingFlowState === 'outbound_select' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  <i className="fa-solid fa-arrow-right"></i>
                  <span>1. {t.outboundTicketLabel}</span>
                  {selectedOutboundTicket && <span className="ml-0.5 xs:ml-1 text-[9px] xs:text-[10px] bg-emerald-500 text-white px-1 xs:px-1.5 py-0.5 rounded-full font-bold">✓</span>}
                </button>
                <button 
                  onClick={() => {
                    if (!selectedOutboundTicket) {
                      showToast(lang === 'id' ? 'Silakan pilih tiket pergi terlebih dahulu.' : 'Please select outbound ticket first.', 'error');
                      return;
                    }
                    setBookingFlowState('return_select');
                  }} 
                  className={`flex-1 py-1.5 xs:py-2 sm:py-2.5 rounded-md xs:rounded-lg sm:rounded-xl text-[9px] xs:text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 ${bookingFlowState === 'return_select' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  <span>2. {t.returnTicketLabel}</span>
                  {selectedReturnTicket && <span className="ml-0.5 xs:ml-1 text-[9px] xs:text-[10px] bg-emerald-500 text-white px-1 xs:px-1.5 py-0.5 rounded-full font-bold">✓</span>}
                </button>
              </div>
            )}

            {/* Date Selector Carousel */}
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-4 mb-2.5 xs:mb-4 sm:mb-6 flex-shrink-0">
              <button onClick={() => { if(dateCarouselRef.current) dateCarouselRef.current.scrollLeft -= 120; }} className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/80 transition shadow-sm flex-shrink-0 text-[10px] xs:text-xs sm:text-sm"><i className="fa-solid fa-chevron-left"></i></button>
              
              <div ref={dateCarouselRef} className="flex-1 overflow-x-auto flex gap-1.5 xs:gap-2 sm:gap-3 scrollbar-hide py-0.5 xs:py-1 sm:py-1.5 px-0.5 sm:px-1 scroll-smooth">
                {dateList.map((date) => {
                  const isActiveReturn = bookingFlowState === 'return_select';
                  const isSelected = isActiveReturn ? (date === selectedReturnDate) : (date === selectedDate);
                  
                  let disabled = false;
                  if (isActiveReturn && selectedDate) {
                    const outIdx = dateList.indexOf(selectedDate);
                    const retIdx = dateList.indexOf(date);
                    if (retIdx < outIdx) disabled = true;
                  }

                  const priceLabel = Math.round(280 * (datePrices[date] || 1));
                  return (
                    <button 
                      key={date} 
                      disabled={disabled}
                      onClick={() => isActiveReturn ? setSelectedReturnDate(date) : setSelectedDate(date)} 
                      className={`flex flex-col items-center justify-center min-w-[68px] xs:min-w-[80px] sm:min-w-[100px] p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200 border ${
                        disabled ? 'opacity-30 cursor-not-allowed bg-slate-50 border-slate-100 text-slate-350' :
                        isSelected ? 'bg-accent border-accent text-white shadow-lg shadow-orange-200 scale-105 font-bold' : 
                        'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <span className="text-[8px] xs:text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider opacity-85 mb-0.5">{date.split(',')[0]}</span>
                      <span className="text-[10px] xs:text-xs sm:text-sm font-extrabold">Rp {priceLabel}k</span>
                    </button>
                  );
                })}
              </div>

              <button onClick={() => { if(dateCarouselRef.current) dateCarouselRef.current.scrollLeft += 120; }} className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/80 transition shadow-sm flex-shrink-0 text-[10px] xs:text-xs sm:text-sm"><i className="fa-solid fa-chevron-right"></i></button>
            </div>

            {/* Work Area Grid */}
            <div className="flex flex-col lg:flex-row gap-2.5 xs:gap-4 sm:gap-8 w-full">
              
              {/* Sidebar Filters */}
              <aside className="hidden lg:flex w-64 flex-col bg-slate-50 rounded-3xl p-6 border border-slate-100 flex-shrink-0 shadow-sm sticky top-0 self-start max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-slate-900 tracking-tight text-base">{t.filterSearch}</h2>
                  <button onClick={clearAllFilters} className="text-xs font-semibold text-primary hover:underline">{t.resetAll}</button>
                </div>

                {/* Vessel Type */}
                <div className="mb-6 pb-6 border-b border-slate-200/80">
                  <h3 className="font-bold text-xs text-slate-700 tracking-wider uppercase mb-4">{t.shipType}</h3>
                  <div className="space-y-3">
                    {["Reguler", "VIP", "Carter"].map(type => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={activeTypes.includes(type)} onChange={() => handleTypeToggle(type)} className="custom-checkbox" />
                        <span className="text-sm text-slate-600 font-medium">
                          {type === "Reguler" ? t.vesselTypeRegular : type === "VIP" ? t.vesselTypeVip : t.vesselTypeCarter}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Hour Departure Slider */}
                <div className="mb-6 pb-6 border-b border-slate-200/80">
                  <h3 className="font-bold text-xs text-slate-700 tracking-wider uppercase mb-2">{t.departHour}</h3>
                  <div className="flex justify-between text-xs text-slate-500 mb-3 font-semibold">
                    <span>06:00 WITA</span>
                    <span>{maxDepartureHour.toString().padStart(2, '0')}:00 WITA</span>
                  </div>
                  <input type="range" min="6" max="17" value={maxDepartureHour} onChange={(e) => setMaxDepartureHour(parseInt(e.target.value))} className="w-full accent-primary cursor-pointer bg-slate-200 rounded-lg appearance-none h-1" />
                </div>

                {/* Operator Filter */}
                <div>
                  <h3 className="font-bold text-xs text-slate-700 tracking-wider uppercase mb-4">{t.operator}</h3>
                  <div className="space-y-3">
                    {[...new Set(ticketDatabase.map(t => t.operator))].map(op => (
                      <label key={op} className="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={activeOperators.includes(op)} onChange={() => handleOperatorToggle(op)} className="custom-checkbox" />
                        <span className="text-sm text-slate-600 font-medium">{op}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Ticket Listing Content */}
              <main className="flex-1 min-w-0 w-full flex flex-col relative">
                
                {/* Sorting Navigation Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 xs:pb-4 mb-3 xs:mb-4 sm:mb-6 flex-shrink-0">
                  <div className="flex gap-1 xs:gap-2 overflow-x-auto scrollbar-hide">
                    <button onClick={() => setCurrentSort("price")} className={`flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl text-[10px] xs:text-xs font-bold transition whitespace-nowrap border ${
                      currentSort === "price" ? 'text-primary border-primary/20 bg-sky-50/50' : 'text-slate-500 border-transparent hover:text-slate-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full ${currentSort === "price" ? 'bg-primary' : 'bg-slate-350'}`}></span>
                      {t.cheapest}
                    </button>
                    <button onClick={() => setCurrentSort("speed")} className={`flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl text-[10px] xs:text-xs font-bold transition whitespace-nowrap border ${
                      currentSort === "speed" ? 'text-primary border-primary/20 bg-sky-50/50' : 'text-slate-500 border-transparent hover:text-slate-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full ${currentSort === "speed" ? 'bg-primary' : 'bg-slate-350'}`}></span>
                      {t.fastest}
                    </button>
                  </div>
                  <button onClick={() => setIsMobileFilterOpen(true)} className="lg:hidden flex items-center gap-1.5 xs:gap-2 text-slate-700 font-semibold text-[10px] xs:text-xs border border-slate-200 rounded-lg xs:rounded-xl px-2.5 xs:px-4 py-1.5 xs:py-2 bg-white hover:bg-slate-50 shadow-sm">
                    <i className="fa-solid fa-filter text-slate-400"></i>
                    <span>{t.filter}</span>
                  </button>
                </div>

                {/* Ticket List Cards Container Wrapper */}
                <div className="w-full pr-0 xs:pr-0.5 sm:pr-1">
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-3 xs:pb-4 sm:pb-6 items-start">
                  {isLoadingTickets ? (
                    // Skeleton Loading Cards
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="bg-slate-50/50 border border-slate-100/80 rounded-2xl overflow-hidden shadow-xs animate-pulse">
                        <div className="bg-slate-100/70 h-9 border-b border-slate-100 flex items-center px-4 justify-between">
                          <div className="w-1/3 h-3 bg-slate-200 rounded"></div>
                          <div className="w-12 h-3 bg-slate-200 rounded"></div>
                        </div>
                        <div className="p-4 xs:p-5 space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="w-24 h-5 bg-slate-200 rounded-md"></div>
                            <div className="flex gap-2">
                              <div className="w-8 h-3.5 bg-slate-200 rounded"></div>
                              <div className="w-8 h-3.5 bg-slate-200 rounded"></div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <div className="space-y-1.5">
                              <div className="w-12 h-6 bg-slate-200 rounded"></div>
                              <div className="w-8 h-3 bg-slate-200 rounded"></div>
                            </div>
                            <div className="flex-1 px-4 space-y-2">
                              <div className="h-0.5 bg-slate-200 rounded"></div>
                              <div className="w-10 h-3 bg-slate-200 mx-auto rounded"></div>
                            </div>
                            <div className="space-y-1.5 text-right flex-shrink-0">
                              <div className="w-12 h-6 bg-slate-200 rounded"></div>
                              <div className="w-8 h-3 bg-slate-200 ml-auto rounded"></div>
                            </div>
                          </div>
                          <div className="border-t border-dashed border-slate-200 my-1"></div>
                          <div className="flex justify-between items-center pt-1">
                            <div className="w-16 h-5 bg-slate-200 rounded"></div>
                            <div className="flex gap-2">
                              <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                              <div className="w-24 h-8 bg-slate-200 rounded-xl"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {getFilteredTickets(bookingFlowState === 'return_select').map((ticket) => {
                        const isReturn = bookingFlowState === 'return_select';
                        const activeDate = isReturn ? selectedReturnDate : selectedDate;
                        const multiplier = datePrices[activeDate] || 1;
                        const finalPrice = Math.round((ticket.basePrice * multiplier) / 1000);
                        
                        return (
                          <div key={ticket.id} className="relative bg-white border border-slate-200/80 rounded-2xl hover:shadow-md transition-shadow duration-300 overflow-hidden shadow-sm group">
                            
                            {/* Outbound/Return route banner */}
                            <div className="bg-slate-50/80 text-slate-500 text-[9px] xs:text-[10px] uppercase tracking-wider font-extrabold px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <i className={`fa-solid ${isReturn ? 'fa-rotate-left text-accent' : 'fa-arrow-right text-primary'} text-[9px] xs:text-[10px]`}></i>
                                <span className="truncate">{isReturn ? `${t.returnTitle}: ${destination} ➔ ${origin}` : `${t.departure}: ${origin} ➔ ${destination}`}</span>
                              </div>
                              <span className="font-extrabold text-slate-400">{activeDate.split(',')[0]}</span>
                            </div>

                            {/* Card Content Area */}
                            <div className="p-4 xs:p-5 space-y-4">
                              
                              {/* Top Row: Operator + Amenities */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] xs:text-xs font-extrabold text-primary bg-sky-50 border border-sky-100/50 px-2 py-0.5 rounded-md truncate">
                                  {ticket.operator} · {ticket.type}
                                </span>
                                <div className="flex items-center gap-2 xs:gap-3 text-slate-400">
                                  <span className="flex items-center gap-1 text-[10px] font-semibold">
                                    <i className="fa-solid fa-briefcase"></i>{ticket.baggage}kg
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] font-semibold">
                                    <i className="fa-solid fa-snowflake"></i>AC
                                  </span>
                                  {ticket.reclining && (
                                    <span className="flex items-center gap-1 text-[10px] font-semibold">
                                      <i className="fa-solid fa-couch"></i>Seat
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Time & Route Info */}
                              <div className="flex items-center justify-between py-1">
                                {/* Departure */}
                                <div className="flex-shrink-0">
                                  <div className="text-xl xs:text-2xl font-extrabold text-slate-905 tracking-tight leading-none">{ticket.departTime}</div>
                                  <div className="text-[10px] xs:text-xs font-semibold text-slate-500 mt-1">{isReturn ? destination : origin}</div>
                                </div>

                                {/* Center Route Line */}
                                <div className="flex-1 px-3 flex flex-col items-center relative min-w-0">
                                  <div className="w-full flex items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm flex-shrink-0"></div>
                                    <div className="flex-1 h-[1.5px] bg-gradient-to-r from-primary/30 via-slate-200 to-primary/30 relative">
                                      <i className="fa-solid fa-ship text-primary text-[9px] absolute -top-[4.5px] left-[45%]"></i>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-primary bg-white flex-shrink-0"></div>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 mt-1">{lang === 'id' ? ticket.duration : ticket.durationEn}</span>
                                </div>

                                {/* Arrival */}
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xl xs:text-2xl font-extrabold text-slate-905 tracking-tight leading-none">{ticket.arrivalTime}</div>
                                  <div className="text-[10px] xs:text-xs font-semibold text-slate-500 mt-1">{isReturn ? origin : destination}</div>
                                </div>
                              </div>

                              {/* Divider Line (Dashed) */}
                              <div className="w-full border-t border-dashed border-slate-200"></div>

                              {/* Bottom Row: Price & Buttons */}
                              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 pt-1">
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-lg xs:text-xl font-extrabold text-slate-905">Rp {finalPrice}k</span>
                                  <span className="text-[9px] text-slate-400 font-semibold">/pax</span>
                                </div>
                                <div className="flex items-center gap-2 w-full xs:w-auto">
                                  <button onClick={() => shareTicket(ticket, isReturn)} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl p-2.5 text-xs font-semibold transition flex-shrink-0" title={t.share}>
                                    <i className="fa-regular fa-paper-plane"></i>
                                  </button>
                                  <button onClick={() => handleSelectTicket(ticket)} className="flex-1 xs:flex-none text-center bg-primary hover:bg-sky-800 text-white rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wide transition shadow-md shadow-sky-100/50">
                                    {isReturn ? t.selectReturn : t.selectTicket}
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}

                      {getFilteredTickets(bookingFlowState === 'return_select').length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center text-center py-14 px-6 bg-slate-50/40 border border-dashed border-slate-200 rounded-[28px] shadow-sm animate-scale-up">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 relative shadow-inner">
                            <i className="fa-solid fa-anchor text-slate-400 text-2xl animate-bounce-short"></i>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center text-white text-[8px] font-extrabold shadow-sm">?</span>
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-800 mb-1.5">{lang === 'id' ? 'Jadwal Tidak Ditemukan' : 'No Schedules Found'}</h3>
                          <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                            {lang === 'id' 
                              ? 'Tidak ada speedboat yang cocok dengan kriteria filter Anda. Coba sesuaikan jam keberangkatan atau jenis kapal.' 
                              : 'No speedboats match your active filters. Try adjusting the departure hours or vessel types.'}
                          </p>
                          <button 
                            onClick={clearAllFilters}
                            className="bg-primary hover:bg-sky-800 text-white font-extrabold text-xs uppercase tracking-wide px-5 py-2.5 rounded-xl transition shadow-md shadow-sky-100/50 flex items-center gap-2"
                          >
                            <i className="fa-solid fa-rotate-left"></i>
                            <span>{t.resetAll}</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Hotel Recommendations at the bottom of the list */}
                  <div className="col-span-full">
                    <HotelRecommendations destination={destination} />
                  </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}

        {/* BOOKINGS HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-6">
            <h2 className="text-lg font-bold border-b border-slate-100 pb-3 flex items-center gap-2 text-slate-900">
              <i className="fa-solid fa-clock-rotate-left text-primary animate-pulse"></i>
              {t.myBookings}
            </h2>

            {bookingHistory.length === 0 ? (
              <div className="text-center py-20 text-slate-400 border border-dashed border-slate-200 rounded-[24px] bg-slate-50/50 shadow-inner">
                <i className="fa-solid fa-ticket-simple text-4xl mb-4 text-slate-300"></i>
                <p className="text-sm font-bold mb-1">{t.noBookings}</p>
                <p className="text-xs text-slate-500">{lang === 'id' ? 'Lakukan transaksi pertama Anda di tab Cari Tiket.' : 'Book tickets in the Search tab to see history.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookingHistory.map((booking, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition relative flex flex-col justify-between shadow-sm">
                    
                    {/* History Header */}
                    <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <span className="text-[10px] bg-sky-50 border border-sky-100 text-primary font-bold px-2 py-0.5 rounded-full">
                            {booking.bookingId}
                          </span>
                          {booking.paymentStatus && (
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                              booking.paymentStatus === 'DIBATALKAN' ? 'bg-rose-100 text-rose-600' :
                              booking.paymentStatus === 'LUNAS' ? 'bg-emerald-100 text-emerald-600' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                              {booking.paymentStatus}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-semibold">
                          {new Date(booking.timestamp).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">{t.totalPayment}</span>
                        <span className="text-sm font-extrabold text-emerald-600">Rp {booking.finalPaid.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Booking brief details */}
                    <div className="space-y-3 mb-4">
                      {/* Outbound */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-arrow-right text-primary"></i>
                          <span className="font-bold text-slate-700">{booking.origin} ➔ {booking.destination}</span>
                        </div>
                        <div className="text-slate-550 font-semibold">{booking.outboundTicket.operator} ({booking.outboundDate})</div>
                      </div>

                      {/* Return */}
                      {booking.isRoundTrip && booking.returnTicket && (
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-rotate-left text-accent"></i>
                            <span className="font-bold text-slate-700">{booking.destination} ➔ {booking.origin}</span>
                          </div>
                          <div className="text-slate-550 font-semibold">{booking.returnTicket.operator} ({booking.returnDate})</div>
                        </div>
                      )}

                      {/* Passengers count */}
                      <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 flex justify-between">
                        <span>{booking.passengers.length} {lang === 'id' ? 'Penumpang' : 'Passengers'}</span>
                        <span className="truncate max-w-[180px] font-bold text-slate-650">
                          {booking.passengers.map(p => p.name).join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setLastBookingResult(booking); setIsSuccessModalOpen(true); }} 
                        className="flex-1 bg-slate-50 border border-slate-200 hover:bg-sky-50/50 hover:border-primary/20 text-primary py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <i className="fa-solid fa-qrcode"></i>
                        {t.showBoardingPass}
                      </button>
                      <button 
                        onClick={() => setSelectedManifestBooking(booking)} 
                        className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <i className="fa-solid fa-clipboard-list"></i>
                        Manifest
                      </button>
                    </div>

                    {booking.paymentStatus !== "DIBATALKAN" && (
                      <button 
                        onClick={() => setSelectedCancelBooking(booking)} 
                        className="w-full mt-2 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 py-2 rounded-xl font-bold text-xs uppercase transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <i className="fa-solid fa-ban"></i>
                        Batalkan Tiket
                      </button>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Mobile Filter Drawer Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-[120] flex items-end transition-opacity duration-300 backdrop-blur-sm">
          <div className="bg-white rounded-t-[32px] w-full max-h-[85vh] flex flex-col p-6 shadow-2xl transition-transform duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-extrabold text-slate-950 text-base">{t.filter}</h2>
              <button onClick={() => setIsMobileFilterOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500"><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
              <div>
                <h3 className="font-bold text-xs text-slate-400 tracking-wider uppercase mb-4">{t.shipType}</h3>
                <div className="flex flex-wrap gap-2">
                  {["Reguler", "VIP", "Carter"].map(type => {
                    const active = activeTypes.includes(type);
                    return (
                      <button key={type} onClick={() => handleTypeToggle(type)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        active ? 'border-primary bg-sky-50/50 text-primary' : 'border-slate-200 text-slate-600'
                      }`}>{type === "Reguler" ? t.vesselTypeRegular : type === "VIP" ? t.vesselTypeVip : t.vesselTypeCarter}</button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xs text-slate-400 tracking-wider uppercase mb-3">{t.operator}</h3>
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  {[...new Set(ticketDatabase.map(t => t.operator))].map(op => (
                    <label key={op} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={activeOperators.includes(op)} 
                        onChange={() => handleOperatorToggle(op)} 
                        className="custom-checkbox" 
                      />
                      <span className="text-xs font-bold text-slate-650 group-hover:text-primary transition">{op}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xs text-slate-400 tracking-wider uppercase mb-2">{t.maxDepartHour}</h3>
                <input type="range" min="6" max="17" value={maxDepartureHour} onChange={(e) => setMaxDepartureHour(parseInt(e.target.value))} className="w-full accent-primary bg-slate-200 rounded-lg appearance-none h-1.5" />
                <div className="flex justify-between text-xs text-slate-400 font-semibold mt-2">
                  <span>06:00 - {maxDepartureHour.toString().padStart(2, '0')}:00 WITA</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 flex gap-4">
              <button onClick={() => { clearAllFilters(); setIsMobileFilterOpen(false); }} className="flex-1 border border-slate-200 py-3 rounded-xl font-bold text-xs uppercase tracking-wide text-slate-500 hover:bg-slate-50">Reset</button>
              <button onClick={() => setIsMobileFilterOpen(false)} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-sky-800 shadow-lg">Terapkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Booking checkout Details Inline */}
      {checkoutActive && selectedOutboundTicket && (
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden animate-fade-in pb-4 mt-2">
            
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 lg:px-4 pb-6 lg:-mr-4 lg:pr-4">
              <div className="w-full">
                
                {/* Header / Title Area */}
                <div className="py-4 sm:py-6 flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xl sm:text-2xl tracking-tight">{t.bookingDetails}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">{origin} <i className="fa-solid fa-arrow-right mx-1 text-[10px]"></i> {destination} <span className="mx-2 text-slate-300">|</span> {adults + kids} {lang === 'id' ? 'Penumpang' : 'Passengers'}</p>
                  </div>
                  <button onClick={() => setCheckoutActive(false)} className="px-4 py-2 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition font-bold text-xs gap-2 shadow-sm"><i className="fa-solid fa-arrow-left"></i> {lang === 'id' ? 'Kembali' : 'Back'}</button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  
                  {/* LEFT COLUMN: Passenger Data & Forms (65%) */}
                  <div className="w-full lg:w-[65%] space-y-6">
                  
                  {/* Info Banner */}
                  <div className="bg-sky-50 border border-sky-100/60 rounded-2xl p-4 sm:p-5 flex gap-4 items-start shadow-inner">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary flex-shrink-0 shadow-sm border border-sky-100">
                      <i className="fa-solid fa-check text-lg"></i>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-primary text-sm mb-1">{lang === 'id' ? 'Selesaikan pesanan Anda' : 'Complete your booking'}</h4>
                      <p className="text-xs text-sky-900/70 leading-relaxed font-medium">
                        {lang === 'id' ? 'Silakan isi detail kontak dan daftar penumpang dengan benar sesuai kartu identitas. Tiket elektronik akan dikirimkan ke kontak Anda.' : 'Please fill in contact details and passenger list correctly according to ID card. E-tickets will be sent to your contact.'}
                      </p>
                    </div>
                  </div>

                  {/* Form Contact Info */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-wide mb-5">{t.contactData}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t.fullName}</label>
                        <input 
                          type="text" 
                          value={buyerName} 
                          onChange={(e) => setBuyerName(e.target.value)} 
                          placeholder={t.ktpPlaceholder} 
                          className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-medium transition shadow-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t.phone}</label>
                        <input 
                          type="tel" 
                          value={buyerPhone} 
                          onChange={(e) => setBuyerPhone(e.target.value)} 
                          placeholder="Contoh: 08123456789" 
                          className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-medium transition shadow-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Passengers details list inputs */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-wide mb-5">{t.passengerData}</h4>
                    <div className="space-y-5">
                      {passengersData.map((p, idx) => {
                        const handlePassengerChange = (field, value) => {
                          const updated = [...passengersData];
                          updated[idx][field] = value;
                          setPassengersData(updated);
                        };

                        return (
                          <div key={p.id} className="border border-slate-100 p-5 rounded-2xl space-y-4 hover:border-slate-200 transition bg-slate-50/30">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-extrabold">{idx + 1}</div>
                                <span className="text-sm font-extrabold text-slate-800">{p.label}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest bg-white border border-slate-100 px-2 py-1 rounded-md shadow-sm">ID / Passport</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="lg:col-span-2">
                                <input 
                                  type="text" 
                                  value={p.name} 
                                  onChange={(e) => handlePassengerChange('name', e.target.value)} 
                                  placeholder={t.passengerNamePlaceholder} 
                                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-medium transition shadow-sm" 
                                />
                              </div>
                              <div>
                                <input 
                                  type="text" 
                                  value={p.nik} 
                                  onChange={(e) => handlePassengerChange('nik', e.target.value)} 
                                  placeholder={t.nikPlaceholder} 
                                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-medium transition shadow-sm" 
                                />
                              </div>
                              <div className="flex gap-2">
                                <select
                                  value={p.gender || "L"}
                                  onChange={(e) => handlePassengerChange('gender', e.target.value)}
                                  className="flex-1 border border-slate-200 bg-white rounded-xl px-3 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 cursor-pointer shadow-sm font-medium"
                                >
                                  <option value="L">L</option>
                                  <option value="P">P</option>
                                </select>
                                <input 
                                  type="number" 
                                  value={p.age || ""} 
                                  onChange={(e) => handlePassengerChange('age', e.target.value)} 
                                  placeholder="Usia" 
                                  className="flex-1 w-full border border-slate-200 bg-white rounded-xl px-3 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-medium transition shadow-sm" 
                                />
                              </div>
                            </div>

                            {/* Seat assignment buttons */}
                            <div className="flex flex-wrap gap-3 pt-3">
                              {/* Outbound Seat Selector */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.outboundTicketLabel}:</span>
                                <button 
                                  onClick={() => openSeatModal('outbound', idx)} 
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                                    p.seatOutbound ? 'bg-primary border-sky-600 text-white shadow-sm hover:bg-sky-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                                  }`}
                                >
                                  <i className="fa-solid fa-chair text-xs opacity-70"></i>
                                  {p.seatOutbound ? `${p.seatOutbound}` : t.selectSeatBtn}
                                </button>
                              </div>

                              {/* Return Seat Selector */}
                              {isRoundTrip && selectedReturnTicket && (
                                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.returnTicketLabel}:</span>
                                  <button 
                                    onClick={() => openSeatModal('return', idx)} 
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                                      p.seatReturn ? 'bg-accent border-orange-600 text-white shadow-sm hover:bg-orange-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                                    }`}
                                  >
                                    <i className="fa-solid fa-chair text-xs opacity-70"></i>
                                    {p.seatReturn ? `${p.seatReturn}` : t.selectSeatBtn}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Summary & Payment (35%) */}
                <div className="w-full lg:w-[35%] lg:sticky lg:top-4 flex flex-col gap-6">
                  
                  {/* Reservation Summary */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-wide mb-5 uppercase">{lang === 'id' ? 'Ringkasan Reservasi' : 'Reservation Summary'}</h4>
                    
                    <div className="space-y-4">
                      {/* Outbound Ticket Receipt */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative">
                        <span className="absolute top-3 right-3 text-[9px] bg-primary/10 text-primary font-extrabold px-2 py-1 rounded-md uppercase tracking-widest">
                          {t.outboundTicketLabel}
                        </span>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{selectedDate}</div>
                        <div className="text-sm font-extrabold text-slate-800">{selectedOutboundTicket.operator}</div>
                        <div className="text-xs text-slate-500 font-medium mb-3">{selectedOutboundTicket.type}</div>
                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-100">
                          <span className="text-sm font-extrabold text-slate-800">{selectedOutboundTicket.departTime}</span>
                          <i className="fa-solid fa-arrow-right text-slate-300 text-[10px]"></i>
                          <span className="text-sm font-semibold text-slate-600">{selectedOutboundTicket.arrivalTime}</span>
                        </div>
                      </div>

                      {/* Return Ticket Receipt */}
                      {isRoundTrip && selectedReturnTicket ? (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative">
                          <span className="absolute top-3 right-3 text-[9px] bg-accent/10 text-accent font-extrabold px-2 py-1 rounded-md uppercase tracking-widest">
                            {t.returnTicketLabel}
                          </span>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{selectedReturnDate}</div>
                          <div className="text-sm font-extrabold text-slate-800">{selectedReturnTicket.operator}</div>
                          <div className="text-xs text-slate-500 font-medium mb-3">{selectedReturnTicket.type}</div>
                          <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-100">
                            <span className="text-sm font-extrabold text-slate-800">{selectedReturnTicket.departTime}</span>
                            <i className="fa-solid fa-arrow-right text-slate-300 text-[10px]"></i>
                            <span className="text-sm font-semibold text-slate-600">{selectedReturnTicket.arrivalTime}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 py-6">
                          <i className="fa-solid fa-ban text-lg mb-2 text-slate-300 opacity-50"></i>
                          <span className="text-[11px] font-bold uppercase tracking-wider">{lang === 'id' ? 'Tanpa Tiket Pulang' : 'No Return Ticket'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price & Promo */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-wide mb-5 uppercase">{lang === 'id' ? 'Ringkasan Harga' : 'Your Price Summary'}</h4>
                    
                    {/* Promo Code Fields */}
                    <div className="mb-5 bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex gap-1.5">
                      <input 
                        type="text" 
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder={t.promoCode} 
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 uppercase font-medium shadow-sm"
                      />
                      <button 
                        onClick={applyPromoCode}
                        className="bg-primary hover:bg-sky-800 text-white font-bold text-[11px] uppercase px-5 py-2.5 rounded-xl transition shadow-sm"
                      >
                        {t.applyPromo}
                      </button>
                    </div>

                    {/* Pricing Summary List */}
                    <div className="text-xs space-y-3.5 font-medium text-slate-600 mb-6 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{t.outboundTicketLabel} (x{adults + kids})</span>
                        <span className="font-bold text-slate-800">Rp {(selectedOutboundTicket.finalPrice * (adults + kids)).toLocaleString('id-ID')}</span>
                      </div>

                      {isRoundTrip && selectedReturnTicket && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">{t.returnTicketLabel} (x{adults + kids})</span>
                          <span className="font-bold text-slate-800">Rp {(selectedReturnTicket.finalPrice * (adults + kids)).toLocaleString('id-ID')}</span>
                        </div>
                      )}

                      {appliedPromo && (
                        <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded border border-emerald-100 font-bold">
                          <span>{t.promoDiscount} ({appliedPromo.code})</span>
                          <span>- Rp {appliedPromo.discountAmount.toLocaleString('id-ID')}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-4 mt-2">
                        <span className="font-extrabold text-slate-800 uppercase tracking-wide">{lang === 'id' ? 'Total Harga' : 'Total Price'}</span>
                        <span className="text-emerald-600 text-xl font-black">Rp {getFinalPrice().toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="hidden lg:flex flex-col gap-3">
                      <button onClick={submitBooking} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-extrabold text-sm uppercase tracking-widest transition shadow-lg shadow-emerald-100">
                        {lang === 'id' ? 'BAYAR SEKARANG' : 'PAY NOW'}
                      </button>
                      <p className="text-[9px] text-center text-slate-400 font-semibold mt-1">
                        {lang === 'id' ? 'Pembayaran aman dengan Midtrans' : 'Secure payment via Midtrans'}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            {/* Sticky Bottom Bar for Mobile Checkout */}
            <div className="lg:hidden bg-white border-t border-slate-150/60 p-4 flex items-center justify-between gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] rounded-b-[24px] z-20">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">{lang === 'id' ? 'TOTAL HARGA' : 'TOTAL PRICE'}</span>
                <span className="text-emerald-650 text-base xs:text-lg font-black">Rp {getFinalPrice().toLocaleString('id-ID')}</span>
              </div>
              <button 
                onClick={submitBooking} 
                className="flex-1 max-w-[180px] bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-widest transition shadow-md shadow-emerald-100/50 text-center"
              >
                {lang === 'id' ? 'BAYAR' : 'PAY'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Visual Seat Selection Modal */}
      {isSeatSelectorOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[130] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-[24px] w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  {t.seatSelectTitle} ({passengersData[activeSeatPassengerIdx]?.label})
                </h3>
                <p className="text-[10px] text-primary font-semibold">
                  {activeSeatSelectingType === 'outbound' ? selectedOutboundTicket?.operator : selectedReturnTicket?.operator}
                </p>
              </div>
              <button onClick={() => setIsSeatSelectorOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-550"><i className="fa-solid fa-xmark"></i></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col items-center">
              
              {/* Boat Front/Cockpit */}
              <div className="w-56 h-12 bg-slate-50 border-t-2 border-l-2 border-r-2 border-slate-200 rounded-t-[100px] flex items-center justify-center relative shadow-inner mb-6">
                <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">{t.seatCockpit}</span>
                <div className="absolute top-1 w-2.5 h-2.5 bg-orange-500/80 rounded-full animate-pulse"></div>
              </div>

              {/* Grid layout */}
              <div className="w-full max-w-[280px] space-y-2">
                
                {/* Visual Legend */}
                <div className="flex justify-between items-center border border-slate-100 bg-slate-50 p-2.5 rounded-xl text-[9px] font-extrabold text-slate-400 uppercase mb-4 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-primary block"></span>
                    <span>{lang === 'id' ? 'Pilih' : 'Selected'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-white border border-slate-200 block"></span>
                    <span>{t.seatAvailable}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 opacity-50 block relative overflow-hidden">
                      <span className="absolute inset-0 bg-rose-500/10"></span>
                    </span>
                    <span>{t.seatOccupied}</span>
                  </div>
                </div>

                {Array.from({ length: 8 }, (_, rIdx) => {
                  const rowNum = rIdx + 1;
                  const seatCols = [['A', 'B'], ['C', 'D']];
                  const ticketId = activeSeatSelectingType === 'outbound' ? selectedOutboundTicket.id : selectedReturnTicket.id;
                  const activeDate = activeSeatSelectingType === 'outbound' ? selectedDate : selectedReturnDate;
                  
                  const occupiedList = getOccupiedSeats(ticketId, activeDate);
                  const seatField = activeSeatSelectingType === 'outbound' ? 'seatOutbound' : 'seatReturn';
                  const activePassengerSeat = passengersData[activeSeatPassengerIdx]?.[seatField];

                  return (
                    <div key={rowNum} className="flex justify-between items-center">
                      
                      {/* Left Group */}
                      <div className="flex gap-2">
                        {seatCols[0].map(col => {
                          const seatCode = `${col}${rowNum}`;
                          const isOccupied = occupiedList.includes(seatCode);
                          const isSelected = activePassengerSeat === seatCode;
                          const isTaken = passengersData.some((p, pIdx) => pIdx !== activeSeatPassengerIdx && p[seatField] === seatCode);

                          return (
                            <button
                              key={seatCode}
                              disabled={isOccupied || isTaken}
                              onClick={() => handleSeatClick(seatCode)}
                              className={`w-9 h-9 rounded-lg border text-[10px] font-bold flex items-center justify-center transition-all ${
                                isSelected ? 'bg-primary border-sky-500 text-white shadow-md' :
                                (isOccupied || isTaken) ? 'opacity-55 bg-slate-100 border-slate-200 text-slate-350 relative overflow-hidden' :
                                'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                              }`}
                            >
                              {(isOccupied || isTaken) && <span className="absolute inset-0 bg-rose-500/5 pointer-events-none"></span>}
                              {seatCode}
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-[10px] font-bold text-slate-400 select-none">{rowNum}</div>

                      {/* Right Group */}
                      <div className="flex gap-2">
                        {seatCols[1].map(col => {
                          const seatCode = `${col}${rowNum}`;
                          const isOccupied = occupiedList.includes(seatCode);
                          const isSelected = activePassengerSeat === seatCode;
                          const isTaken = passengersData.some((p, pIdx) => pIdx !== activeSeatPassengerIdx && p[seatField] === seatCode);

                          return (
                            <button
                              key={seatCode}
                              disabled={isOccupied || isTaken}
                              onClick={() => handleSeatClick(seatCode)}
                              className={`w-9 h-9 rounded-lg border text-[10px] font-bold flex items-center justify-center transition-all ${
                                isSelected ? 'bg-primary border-sky-500 text-white shadow-md' :
                                (isOccupied || isTaken) ? 'opacity-55 bg-slate-100 border-slate-200 text-slate-350 relative overflow-hidden' :
                                'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                              }`}
                            >
                              {(isOccupied || isTaken) && <span className="absolute inset-0 bg-rose-500/5 pointer-events-none"></span>}
                              {seatCode}
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}

              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
              <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">{t.seatAisle}</span>
            </div>

          </div>
        </div>
      )}

      {/* Search Route Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[120] flex justify-center items-center p-4 backdrop-blur-sm">
          <SearchConfigModal 
            origin={origin} 
            destination={destination} 
            isRT={isRoundTrip}
            adults={adults} 
            kids={kids} 
            dateOut={selectedDate}
            dateRet={selectedReturnDate}
            dateList={dateList}
            onClose={() => setIsSearchModalOpen(false)}
            onSave={executeSearchChange}
            t={t}
            lang={lang}
          />
        </div>
      )}

      {/* Success Modal & Boarding Pass */}
      {isSuccessModalOpen && lastBookingResult && (
        <div className="fixed inset-0 bg-slate-900/60 z-[140] flex justify-center items-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl p-6 text-center animate-scale-up my-8">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">{t.ticketOrdered}</h3>
            <p className="text-xs text-slate-500 mb-6">{t.ticketSuccessDesc}</p>

            {/* Countdown Timer */}
            <div className="mb-6 text-left">
              <CountdownTimer 
                departureDate={lastBookingResult.outboundDate} 
                departureTime={lastBookingResult.outboundTicket.departTime}
                routeLabel={`${lastBookingResult.origin} ➔ ${lastBookingResult.destination}`}
                vesselName={lastBookingResult.outboundTicket.operator}
              />
            </div>

            {/* Passes Wrapper */}
            <div className="space-y-6 max-h-[55dvh] overflow-y-auto pr-1 scrollbar-hide py-1">
              
              {/* Outbound Ticket Boarding Pass */}
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-5 text-left relative shadow-inner border-t-4 border-t-primary">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-4">
                  <span>{t.boardingPass} ({t.outboundTicketLabel})</span>
                  <span className="text-primary font-bold">{lastBookingResult.bookingId}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">{t.buyer}</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">{lastBookingResult.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">{t.date}</span>
                    <span className="text-xs font-bold text-slate-800">{lastBookingResult.outboundDate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 mt-3">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">{t.route}</span>
                    <span className="text-xs font-bold text-slate-800">{lastBookingResult.origin} ➔ {lastBookingResult.destination}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">{t.ship}</span>
                    <span className="text-xs font-bold text-slate-800">{lastBookingResult.outboundTicket.operator}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">{t.seats}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lastBookingResult.passengers.map((p, idx) => (
                        <span key={idx} className="bg-sky-50 border border-sky-100 text-primary text-[10px] font-bold px-2 py-0.5 rounded-lg block">
                          {p.name.split(' ')[0]}: {p.seatOutbound}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-slate-100">
                    {generateQRCodeSVG(`${lastBookingResult.bookingId}_OUTBOUND_${lastBookingResult.passengers.map(p=>p.seatOutbound).join('_')}`)}
                  </div>
                </div>
              </div>

              {/* Return Ticket Boarding Pass */}
              {lastBookingResult.isRoundTrip && lastBookingResult.returnTicket && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-5 text-left relative shadow-inner border-t-4 border-t-accent">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-4">
                    <span>{t.boardingPass} ({t.returnTicketLabel})</span>
                    <span className="text-accent font-bold">{lastBookingResult.bookingId}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">{t.buyer}</span>
                      <span className="text-xs font-bold text-slate-800 truncate block">{lastBookingResult.buyerName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">{t.date}</span>
                      <span className="text-xs font-bold text-slate-800">{lastBookingResult.returnDate}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 mt-3">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">{t.route}</span>
                      <span className="text-xs font-bold text-slate-800">{lastBookingResult.destination} ➔ {lastBookingResult.origin}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">{t.ship}</span>
                      <span className="text-xs font-bold text-slate-800">{lastBookingResult.returnTicket.operator}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">{t.seats}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lastBookingResult.passengers.map((p, idx) => (
                          <span key={idx} className="bg-orange-50 border border-orange-100 text-accent text-[10px] font-bold px-2 py-0.5 rounded-lg block">
                            {p.name.split(' ')[0]}: {p.seatReturn}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-slate-100">
                      {generateQRCodeSVG(`${lastBookingResult.bookingId}_RETURN_${lastBookingResult.passengers.map(p=>p.seatReturn).join('_')}`)}
                    </div>
                  </div>
                </div>
              )}

            </div>

            <button 
              onClick={() => {
                setIsSuccessModalOpen(false);
                setLastBookingResult(null);
                setCheckoutActive(false);
                setSelectedOutboundTicket(null);
                setSelectedReturnTicket(null);
                setBookingFlowState('outbound_select');
                setBuyerName("");
                setBuyerPhone("");
              }} 
              className="w-full bg-primary hover:bg-sky-800 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wide transition shadow-md shadow-sky-100 mt-6"
            >
              {t.backHome}
            </button>
          </div>
        </div>
      )}

      <PassengerManifest booking={selectedManifestBooking} onClose={() => setSelectedManifestBooking(null)} />
      <CancellationModal booking={selectedCancelBooking} onClose={() => setSelectedCancelBooking(null)} onConfirm={handleCancelBooking} />
    </div>
  );
}

/* Sub Component SearchConfigModal helper to maintain cleaner DOM flow */
function SearchConfigModal({ origin, destination, isRT, adults, kids, dateOut, dateRet, dateList, onClose, onSave, t, lang }) {
  const [lclOrigin, setLclOrigin] = useState(origin);
  const [lclDestination, setLclDestination] = useState(destination);
  const [lclIsRT, setLclIsRT] = useState(isRT);
  const [lclAdults, setLclAdults] = useState(adults);
  const [lclKids, setLclKids] = useState(kids);
  const [lclDateOut, setLclDateOut] = useState(dateOut);
  const [lclDateRet, setLclDateRet] = useState(dateRet);

  const handleDateOutChange = (val) => {
    setLclDateOut(val);
    const outIdx = dateList.indexOf(val);
    const retIdx = dateList.indexOf(lclDateRet);
    if (retIdx < outIdx && outIdx < dateList.length - 1) {
      setLclDateRet(dateList[outIdx + 1]);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] w-full max-w-lg shadow-2xl transition-all duration-300 transform scale-100 flex flex-col overflow-hidden animate-scale-up">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wide">{t.searchRoute}</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 transition"><i className="fa-solid fa-xmark"></i></button>
      </div>
      
      <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Toggle Trip Type */}
        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-2xl mb-2">
          <button 
            onClick={() => setLclIsRT(false)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${!lclIsRT ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            {t.oneWay}
          </button>
          <button 
            onClick={() => setLclIsRT(true)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${lclIsRT ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            {t.roundTrip}
          </button>
        </div>

        {/* Ports selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t.originPort}</label>
            <select value={lclOrigin} onChange={(e) => setLclOrigin(e.target.value)} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-slate-800">
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t.destPort}</label>
            <select value={lclDestination} onChange={(e) => setLclDestination(e.target.value)} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-slate-800">
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Dates Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{lang === 'id' ? 'Tanggal Pergi' : 'Departure Date'}</label>
            <select value={lclDateOut} onChange={(e) => handleDateOutChange(e.target.value)} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-slate-800">
              {dateList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-bold text-slate-500 mb-1.5 ${!lclIsRT ? 'opacity-40' : ''}`}>{lang === 'id' ? 'Tanggal Pulang' : 'Return Date'}</label>
            <select 
              disabled={!lclIsRT}
              value={lclDateRet} 
              onChange={(e) => setLclDateRet(e.target.value)} 
              className={`w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 transition ${!lclIsRT ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {dateList.map((d) => {
                const outIdx = dateList.indexOf(lclDateOut);
                const currentIdx = dateList.indexOf(d);
                const disabled = currentIdx < outIdx;
                return <option key={d} value={d} disabled={disabled}>{d}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Passengers quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">{t.adults}</label>
            <div className="flex items-center justify-between border border-slate-200 rounded-xl p-1 bg-white h-10">
              <button 
                type="button"
                onClick={() => setLclAdults(Math.max(1, lclAdults - 1))} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary active:bg-slate-50 transition"
              >
                <i className="fa-solid fa-minus text-[10px]"></i>
              </button>
              <span className="text-xs font-extrabold text-slate-800 w-6 text-center">{lclAdults}</span>
              <button 
                type="button"
                onClick={() => setLclAdults(lclAdults + 1)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary active:bg-slate-50 transition"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">{t.kids}</label>
            <div className="flex items-center justify-between border border-slate-200 rounded-xl p-1 bg-white h-10">
              <button 
                type="button"
                onClick={() => setLclKids(Math.max(0, lclKids - 1))} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary active:bg-slate-50 transition"
              >
                <i className="fa-solid fa-minus text-[10px]"></i>
              </button>
              <span className="text-xs font-extrabold text-slate-800 w-6 text-center">{lclKids}</span>
              <button 
                type="button"
                onClick={() => setLclKids(lclKids + 1)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary active:bg-slate-50 transition"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4 rounded-b-[24px]">
        <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-650 bg-white hover:bg-slate-100 transition">{t.cancel}</button>
        <button onClick={() => onSave(lclOrigin, lclDestination, lclIsRT, lclAdults, lclKids, lclDateOut, lclDateRet)} className="flex-1 bg-primary hover:bg-sky-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md shadow-sky-100">{t.saveRoute}</button>
      </div>
    </div>
  );
}
