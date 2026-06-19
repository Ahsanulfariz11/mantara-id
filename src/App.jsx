import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import CountdownTimer from './components/CountdownTimer';
import PassengerManifest from './components/PassengerManifest';
import CancellationModal from './components/CancellationModal';
import HotelRecommendations from './components/HotelRecommendations';
import Footer from './components/Footer';
import AdminLayout from './components/admin/AdminLayout';
import ConfirmModal from './components/ui/ConfirmModal';
import { api, subscribeToNode } from './lib/api';
import { auth, db, ref as dbRef, set as dbSet, get as dbGet, child as dbChild, onValue as dbOnValue } from './lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

// Modularized imports
import { translations } from './lib/translations';
import { initialTicketDatabase, locations, mapPorts } from './lib/constants';
import {
  generateQRCodeSVG,
  getOccupiedSeats,
  generateBookingRef,
  parseDateStr,
  formatDateToStr,
  getTicketDepartureDateTime
} from './lib/helpers';

import CustomSelect from './components/ui/CustomSelect';
import CalendarSelect from './components/ui/CalendarSelect';
import SearchConfigModal from './components/SearchConfigModal';
import LoginPage from './components/LoginPage';

const InteractiveMap = lazy(() => import('./components/InteractiveMap'));


export default function App() {
  // Localization state
  const [lang, setLang] = useState('id');
  const t = translations[lang];

  // Active view: 'landing', 'search', 'history', or 'admin_dashboard'
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('sea_tickets_user');
      if (saved) {
        const user = JSON.parse(saved);
        if (user && (user.role === 'admin' || user.role === 'operator')) {
          return 'admin_dashboard';
        }
      }
    } catch (e) {}
    return 'landing';
  });

  const [confirmPurchaseModal, setConfirmPurchaseModal] = useState({ isOpen: false, ticket: null, isReturn: false, activeDate: null });

  const [tickets, setTickets] = useState(initialTicketDatabase);
  
  useEffect(() => {
    const unsubscribe = subscribeToNode('tickets', (data) => {
      if (data) {
        // Convert object to array if needed, but assuming api.js usage handles format or we store as array-like object.
        // Actually, initialTicketDatabase is an array. When saved to Firebase RTDB with numeric keys, it acts like an array.
        const ticketsArray = Array.isArray(data) ? data.filter(Boolean) : Object.keys(data).map(k => data[k]);
        setTickets(ticketsArray);
      } else {
        // If empty, initialize with default
        api.set('tickets', initialTicketDatabase);
        setTickets(initialTicketDatabase);
      }
    });
    return () => unsubscribe();
  }, []);

  const ticketDatabase = tickets;

  const saveTicketsDatabase = async (newTickets) => {
    try {
      await api.set('tickets', newTickets);
    } catch (e) {
      console.error(e);
      showToast('Gagal menyimpan jadwal ke database', 'error');
    }
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sea_tickets_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Search States
  const [origin, setOrigin] = useState("Tarakan");
  const [destination, setDestination] = useState("Tanjung Selor");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAge, setProfileAge] = useState('');

  const openProfileModal = () => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
      setProfileAge(currentUser.age || '');
      setIsProfileModalOpen(true);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = {
        ...currentUser,
        name: profileName,
        phone: profilePhone,
        age: profileAge
      };
      
      await dbSet(dbRef(db, `users/${currentUser.uid}`), {
        name: profileName,
        email: currentUser.email,
        phone: profilePhone,
        age: profileAge,
        role: currentUser.role
      });

      setCurrentUser(updatedUser);
      localStorage.setItem('sea_tickets_user', JSON.stringify(updatedUser));
      
      // Auto-update checkout values if they are active
      setBuyerName(profileName);
      setBuyerPhone(profilePhone);
      setPassengersData(prev => {
        if (!prev.length) return prev;
        const updated = [...prev];
        updated[0].name = profileName;
        updated[0].age = profileAge;
        return updated;
      });

      setIsProfileModalOpen(false);
      showToast(lang === 'id' ? 'Profil berhasil diperbarui!' : 'Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal memperbarui profil', 'error');
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('sea_tickets_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    showToast(lang === 'id' ? `Selamat datang kembali, ${user.name}!` : `Welcome back, ${user.name}!`, "success");
    
    // Autofill data diri ke pembelian
    setBuyerName(user.name || "");
    setBuyerPhone(user.phone || "");

    if (user.role === 'admin' || user.role === 'operator') {
      setActiveTab('admin_dashboard');
    } else {
      setActiveTab('landing');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('sea_tickets_user');
      showToast(lang === 'id' ? 'Anda telah berhasil keluar.' : 'You have logged out successfully.', "info");
      setActiveTab('landing');
      setCheckoutActive(false);
      setBuyerName("");
      setBuyerPhone("");
    } catch (e) {
      console.error(e);
      showToast("Gagal keluar", "error");
    }
  };

  // Listen to Firebase Auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userSnapshot = await dbGet(dbChild(dbRef(db), `users/${firebaseUser.uid}`));
          if (userSnapshot.exists()) {
            const profile = userSnapshot.val();
            const fullUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: profile.name || 'User',
              phone: profile.phone || '',
              age: profile.age || '30',
              role: profile.role || 'user'
            };
            setCurrentUser(fullUser);
            localStorage.setItem('sea_tickets_user', JSON.stringify(fullUser));
            
            // Auto fill data diri ke pembelian
            setBuyerName(fullUser.name);
            setBuyerPhone(fullUser.phone);
          } else {
            const defaultUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: 'User',
              phone: '',
              age: '30',
              role: (firebaseUser.email === 'admin@email.com' || firebaseUser.email === 'admin@mantara.com') ? 'admin' : 'user'
            };
            setCurrentUser(defaultUser);
            localStorage.setItem('sea_tickets_user', JSON.stringify(defaultUser));
            
            // Auto fill data diri ke pembelian
            setBuyerName(defaultUser.name);
            setBuyerPhone(defaultUser.phone);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('sea_tickets_user');
        setBookingHistory([]);
      }
    });

    return () => unsubscribe();
  }, [lang]);

  // Synchronize dynamic bookings list from database in real-time
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        const allBookingsRef = dbRef(db, 'bookings');
        const unsubscribeAllBookings = dbOnValue(allBookingsRef, (snapshot) => {
          if (snapshot.exists()) {
            const bookingsVal = snapshot.val();
            const list = Object.values(bookingsVal).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setBookingHistory(list);
          }
        });
        return () => unsubscribeAllBookings();
      } else {
        const bookingsRef = dbRef(db, `users/${currentUser.uid}/bookings`);
        const unsubscribeUserBookings = dbOnValue(bookingsRef, (snapshot) => {
          if (snapshot.exists()) {
            const bookingsVal = snapshot.val();
            const list = Object.values(bookingsVal).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setBookingHistory(list);
          } else {
            setBookingHistory([]);
          }
        });
        return () => unsubscribeUserBookings();
      }
    } else {
      setTimeout(() => {
        setBookingHistory([]);
      }, 0);
    }
  }, [currentUser]);
  // (States and showToast moved to the top of App component)

  // Simulation countdown timer removed

  const dateCarouselRef = useRef(null);



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

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [lang, ticketDatabase]);

  // Trigger skeleton loading state on date or route change
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsLoadingTickets(true);
    }, 0);
    const timer = setTimeout(() => {
      setIsLoadingTickets(false);
    }, 400);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(timer);
    };
  }, [selectedDate, selectedReturnDate, origin, destination]);

  const handleSelectedDateChange = (dateStr) => {
    setSelectedDate(dateStr);
    const dateOutParsed = parseDateStr(dateStr, lang);
    let newReturnDate = selectedReturnDate;

    if (isRoundTrip && selectedReturnDate) {
      const dateRetParsed = parseDateStr(selectedReturnDate, lang);
      if (dateRetParsed < dateOutParsed) {
        newReturnDate = dateStr;
        setSelectedReturnDate(dateStr);
      }
    }

    setDateList(prev => {
      let updated = [...prev];
      if (dateStr && !updated.includes(dateStr)) {
        updated.push(dateStr);
      }
      if (isRoundTrip && newReturnDate && !updated.includes(newReturnDate)) {
        updated.push(newReturnDate);
      }
      return updated.sort((a, b) => parseDateStr(a, lang) - parseDateStr(b, lang));
    });
  };

  const handleSelectedReturnDateChange = (dateStr) => {
    setSelectedReturnDate(dateStr);
    if (dateStr) {
      setDateList(prev => {
        if (prev.includes(dateStr)) return prev;
        const updated = [...prev, dateStr];
        return updated.sort((a, b) => parseDateStr(a, lang) - parseDateStr(b, lang));
      });
    }
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
    let multiplier = datePrices[activeDate];
    if (multiplier === undefined) {
      const parsed = parseDateStr(activeDate, lang);
      const dayOfWeek = parsed.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        multiplier = 1.15; // Weekend peak
      } else if (dayOfWeek === 2 || dayOfWeek === 3) {
        multiplier = 0.9;  // Mid-week discount
      } else {
        multiplier = 1.0;
      }
    }

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
    if (!currentUser) {
      setActiveTab('login');
      showToast(lang === 'id' ? 'Silakan masuk terlebih dahulu untuk memesan tiket.' : 'Please log in first to book tickets.', 'info');
      return;
    }
    if (currentUser.role === 'admin' || currentUser.role === 'operator') {
      showToast(lang === 'id' ? 'Admin dan Operator tidak dapat melakukan pembelian tiket.' : 'Admin and Operator cannot purchase tickets.', 'error');
      return;
    }

    const isReturn = bookingFlowState === 'return_select';
    const activeDate = isReturn ? selectedReturnDate : selectedDate;

    // Check departure time limit
    if (activeDate) {
      const departureTime = getTicketDepartureDateTime(activeDate, ticket.departTime, lang);
      const now = new Date();
      const diffMs = departureTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 1) {
        showToast(
          lang === 'id' 
            ? 'Tiket tidak dapat dibeli karena keberangkatan kurang dari 1 jam!' 
            : 'Ticket cannot be purchased as departure is in less than 1 hour!', 
          'error'
        );
        return;
      }

      if (diffHours < 2) {
        setConfirmPurchaseModal({ 
          isOpen: true, 
          ticket, 
          isReturn, 
          activeDate,
          message: lang === 'id' 
            ? `Keberangkatan speedboat kurang dari 2 jam (${ticket.departTime}). Apakah Anda yakin ingin tetap membeli tiket ini?` 
            : `Boat departure is in less than 2 hours (${ticket.departTime}). Are you sure you want to purchase this ticket?`
        });
        return;
      }
    }

    finalizeSelectTicket(ticket, isReturn, activeDate);
  };

  const finalizeSelectTicket = (ticket, isReturn, activeDate) => {
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
    let activeBuyerName = buyerName;
    let activeBuyerPhone = buyerPhone;
    if (currentUser) {
      if (!activeBuyerName) {
        activeBuyerName = currentUser.name || "";
        setBuyerName(activeBuyerName);
      }
      if (!activeBuyerPhone) {
        activeBuyerPhone = currentUser.phone || "";
        setBuyerPhone(activeBuyerPhone);
      }
    }

    const totalCount = adults + kids + infants;
    const initialPassengers = Array.from({ length: totalCount }, (_, i) => {
      let label;
      let age = '30';
      let isInfant = false;
      let name = "";
      if (i < adults) {
        label = `${lang === 'id' ? 'Dewasa' : 'Adult'} ${i + 1}`;
        if (i === 0) {
          name = activeBuyerName;
          if (currentUser) {
            age = currentUser.age || '30';
          }
        }
      } else if (i < adults + kids) {
        label = `${lang === 'id' ? 'Anak' : 'Child'} ${i - adults + 1}`;
        age = '10';
      } else {
        label = `${lang === 'id' ? 'Bayi' : 'Infant'} ${i - adults - kids + 1}`;
        name = label;
        age = '1';
        isInfant = true;
      }
      return {
        id: i,
        label,
        name,
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

  const updatePassengerCount = (type, delta) => {
    let newAdults = adults;
    let newKids = kids;
    let newInfants = infants;

    if (type === 'adults') newAdults = Math.max(1, adults + delta);
    if (type === 'kids') newKids = Math.max(0, kids + delta);
    if (type === 'infants') newInfants = Math.max(0, infants + delta);

    if (newAdults + newKids > 8) {
      showToast(lang === 'id' ? 'Maksimal 8 penumpang per pesanan.' : 'Maximum 8 passengers per booking.', 'error');
      return;
    }

    setAdults(newAdults);
    setKids(newKids);
    setInfants(newInfants);

    setPassengersData(prev => {
      const updated = [];
      const totalCount = newAdults + newKids + newInfants;
      
      const oldAdults = prev.filter(p => !p.isInfant && (p.label.toLowerCase().includes('dewasa') || p.label.toLowerCase().includes('adult')));
      const oldKids = prev.filter(p => !p.isInfant && (p.label.toLowerCase().includes('anak') || p.label.toLowerCase().includes('child')));
      const oldInfants = prev.filter(p => p.isInfant);

      let adultIdx = 0, kidIdx = 0, infantIdx = 0;

      for (let i = 0; i < totalCount; i++) {
        let p;
        if (adultIdx < newAdults) {
          p = oldAdults[adultIdx] ? { ...oldAdults[adultIdx] } : {
            name: "", nik: "", gender: "L", age: "30", isInfant: false, seatOutbound: "", seatReturn: ""
          };
          p.label = `${lang === 'id' ? 'Dewasa' : 'Adult'} ${adultIdx + 1}`;
          adultIdx++;
        } else if (kidIdx < newKids) {
          p = oldKids[kidIdx] ? { ...oldKids[kidIdx] } : {
            name: "", nik: "", gender: "L", age: "10", isInfant: false, seatOutbound: "", seatReturn: ""
          };
          p.label = `${lang === 'id' ? 'Anak' : 'Child'} ${kidIdx + 1}`;
          kidIdx++;
        } else {
          p = oldInfants[infantIdx] ? { ...oldInfants[infantIdx] } : {
            name: "", nik: "", gender: "L", age: "1", isInfant: true, seatOutbound: "INF", seatReturn: "INF"
          };
          p.label = `${lang === 'id' ? 'Bayi' : 'Infant'} ${infantIdx + 1}`;
          if (!p.name) p.name = p.label;
          infantIdx++;
        }
        p.id = i;
        updated.push(p);
      }
      return updated;
    });
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

    const isAllPassengersFilled = passengersData.filter(p => !p.isInfant).every(p => p.name.trim() !== "");
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

    const randomBookingRef = generateBookingRef();
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

    if (finalPaid === 0) {
      bookingDetails.paymentStatus = "LUNAS";
      finishBooking(bookingDetails);
      showToast(lang === 'id' ? 'Pemesanan gratis berhasil dikonfirmasi!' : 'Free booking successfully confirmed!', 'success');
      return;
    }

    let paymentWindow = null;
    try {
      // Start window synchronously to avoid popup blocker
      if (finalPaid > 0) {
        paymentWindow = window.open('about:blank', '_blank');
        if (paymentWindow) {
          paymentWindow.document.write('<div style="font-family:sans-serif;text-align:center;margin-top:20%;"><h2 style="color:#0ea5e9;">Memproses Pembayaran...</h2><p>Mohon tunggu sebentar / Please wait.</p></div>');
        }
      }

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: randomBookingRef,
          gross_amount: finalPaid,
          first_name: buyerName,
          phone: buyerPhone,
          email: currentUser?.email || '',
          return_url: window.location.origin
        })
      });

      if (!response.ok) {
        let errMsg = "Failed to get payment token";
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (e) {}
        throw new Error(errMsg);
      }
      const data = await response.json();

      // Save booking as pending before redirecting to Midtrans
      bookingDetails.paymentStatus = "MENUNGGU PEMBAYARAN";
      await finishBooking(bookingDetails);

      // Redirect to Midtrans payment page
      if (data.redirect_url) {
        if (paymentWindow) {
          paymentWindow.location.href = data.redirect_url;
        } else {
          // Fallback if popup was blocked
          window.location.href = data.redirect_url;
        }
        showToast(lang === 'id' ? 'Halaman pembayaran Midtrans telah dibuka. Selesaikan pembayaran lalu cek status di "Tiket Saya".' : 'Midtrans payment page opened. Complete payment then check status in "My Bookings".', 'info');
      } else {
        throw new Error("No redirect URL received from payment server");
      }
    } catch (err) {
      console.error("Midtrans Payment Error:", err);
      if (paymentWindow) {
        paymentWindow.close();
      }
      showToast(lang === 'id' ? `Pembayaran gagal: ${err.message}` : `Payment failed: ${err.message}`, 'error');
    }
  };

  const finishBooking = async (bookingDetails) => {
    const uid = currentUser ? currentUser.uid : null;
    const finalDetails = { ...bookingDetails, userId: uid };

    const newHistory = [finalDetails, ...bookingHistory];
    setBookingHistory(newHistory);
    try {
      localStorage.setItem('sea_tickets_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to write booking history", e);
    }

    try {
      await dbSet(dbRef(db, `bookings/${finalDetails.bookingId}`), finalDetails);
      if (uid) {
        await dbSet(dbRef(db, `users/${uid}/bookings/${finalDetails.bookingId}`), finalDetails);
      }
    } catch (error) {
      console.error("Error saving booking to Firebase:", error);
    }

    setLastBookingResult(finalDetails);
    setIsSuccessModalOpen(true);
  };

  const handleCancelBooking = async (bookingId) => {
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

    try {
      const booking = bookingHistory.find(b => b.bookingId === bookingId);
      await dbSet(dbRef(db, `bookings/${bookingId}/paymentStatus`), "DIBATALKAN");
      if (booking && booking.userId) {
        await dbSet(dbRef(db, `users/${booking.userId}/bookings/${bookingId}/paymentStatus`), "DIBATALKAN");
      }
    } catch (error) {
      console.error("Error cancelling booking in Firebase:", error);
    }

    setSelectedCancelBooking(null);
    showToast("Tiket berhasil dibatalkan.", "success");
  };

  const checkPaymentStatus = async (bookingId) => {
    try {
      showToast(lang === 'id' ? 'Memeriksa status pembayaran...' : 'Checking payment status...', 'info');
      const response = await fetch(`/api/payment/status/${bookingId}`);
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      
      console.log("Midtrans payment status response:", data);
      
      const midtransStatus = data.transaction_status;
      let newStatus = null;
      
      if (midtransStatus === 'settlement' || midtransStatus === 'capture') {
        newStatus = "LUNAS";
        showToast(lang === 'id' ? 'Pembayaran sukses! E-Ticket telah diterbitkan.' : 'Payment successful! E-Ticket issued.', 'success');
      } else if (midtransStatus === 'expire' || midtransStatus === 'cancel' || midtransStatus === 'deny') {
        newStatus = "DIBATALKAN";
        showToast(lang === 'id' ? 'Transaksi kedaluwarsa atau dibatalkan.' : 'Transaction expired or cancelled.', 'error');
      } else if (midtransStatus === 'pending') {
        showToast(lang === 'id' ? 'Pembayaran belum diselesaikan.' : 'Payment is still pending.', 'info');
      }
      
      if (newStatus) {
        // Read booking details synchronously from localStorage or fetch from Firebase to prevent stale state issues
        let bookingDetails = null;
        try {
          const saved = localStorage.getItem('sea_tickets_history');
          if (saved) {
            const history = JSON.parse(saved);
            bookingDetails = history.find(b => b.bookingId === bookingId);
          }
        } catch (e) {
          console.error("Error reading history from localStorage:", e);
        }

        if (!bookingDetails) {
          try {
            const snapshot = await dbGet(dbChild(dbRef(db), `bookings/${bookingId}`));
            if (snapshot.exists()) {
              bookingDetails = snapshot.val();
            }
          } catch (firebaseErr) {
            console.error("Error reading booking from Firebase:", firebaseErr);
          }
        }

        if (bookingDetails) {
          const updatedBooking = { ...bookingDetails, paymentStatus: newStatus };

          // Update local state history safely using functional update
          setBookingHistory(prevHistory => {
            const exists = prevHistory.some(b => b.bookingId === bookingId);
            let updatedHistory;
            if (exists) {
              updatedHistory = prevHistory.map(b => b.bookingId === bookingId ? updatedBooking : b);
            } else {
              updatedHistory = [updatedBooking, ...prevHistory];
            }
            try {
              localStorage.setItem('sea_tickets_history', JSON.stringify(updatedHistory));
            } catch (e) {}
            return updatedHistory;
          });

          // Update Firebase database directly
          await dbSet(dbRef(db, `bookings/${bookingId}/paymentStatus`), newStatus);
          
          // Use currentUser from component state
          if (currentUser && currentUser.uid) {
            await dbSet(dbRef(db, `users/${currentUser.uid}/bookings/${bookingId}/paymentStatus`), newStatus);
          }

          // If payment was successful (LUNAS), automatically show the ticket modal
          if (newStatus === "LUNAS") {
            setLastBookingResult(updatedBooking);
            setIsSuccessModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.error("Check status error:", err);
      showToast(lang === 'id' ? 'Gagal memeriksa status pembayaran.' : 'Failed to check payment status.', 'error');
    }
  };

  // Handle Midtrans Redirect URL Parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    const statusCode = params.get('status_code');

    if (orderId && statusCode) {
      // Switch to history tab automatically
      setActiveTab('history');
      
      // Delay slightly to ensure component mounted and states settled
      setTimeout(() => {
        checkPaymentStatus(orderId);
      }, 500);
      
      // Clear URL parameters to prevent re-triggering on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser]); // Trigger when currentUser is loaded so DB updates correctly


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

    // Synchronize dateList with new dates
    setDateList(prev => {
      let updated = [...prev];
      if (dateOut && !updated.includes(dateOut)) {
        updated.push(dateOut);
      }
      if (isRT && dateRet && !updated.includes(dateRet)) {
        updated.push(dateRet);
      }
      return updated.sort((a, b) => parseDateStr(a, lang) - parseDateStr(b, lang));
    });

    setIsSearchModalOpen(false);
    setBookingFlowState('outbound_select');
    setSelectedOutboundTicket(null);
    setSelectedReturnTicket(null);
    showToast(t.toastRouteUpdated, "success");
  };


  if (activeTab === 'admin_dashboard' && (currentUser?.role === 'admin' || currentUser?.role === 'operator')) {
    return (
      <AdminLayout
        currentUser={currentUser}
        tickets={tickets}
        saveTickets={saveTicketsDatabase}
        bookingHistory={bookingHistory}
        showToast={showToast}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        lang={lang}
        setLang={setLang}
      />
    );
  }

  if (activeTab === 'login') {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col bg-slate-50 font-sans text-slate-800 relative">
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
        <LoginPage
          onLogin={handleLogin}
          onCancel={() => {
            setActiveTab('landing');
            setCheckoutActive(false);
          }}
          lang={lang}
          setLang={setLang}
          t={t}
        />
      </div>
    );
  }

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
            <div className="text-primary p-1 rounded-lg flex items-center justify-center mt-1">
              <svg className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 fill-current" viewBox="0 0 24 24"><path d="M12 2c-1.5 0-3 1.5-4 3-1.5 2.5-4 5-6 6 2 1 4.5 1.5 6 1.5 1 0 2.5.5 3.5 2.5 1-2 2.5-2.5 3.5-2.5 1.5 0 4-.5 6-1.5-2-1-4.5-3.5-6-6-1-1.5-2.5-3-4-3z" /></svg>
            </div>
            <h1 className="text-base xs:text-lg sm:text-2xl font-bold tracking-tight">MANTARA</h1>
          </div>

          {/* Navigation preferences */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-3 flex-shrink min-w-0">
            {(currentUser?.role === 'admin' || currentUser?.role === 'operator') ? (
              <div className="flex bg-slate-100 border border-slate-200 p-0.5 sm:p-1 rounded-lg xs:rounded-xl sm:rounded-2xl">
                <button
                  onClick={() => setActiveTab('admin_dashboard')}
                  className={`px-2 xs:px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md xs:rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1 sm:gap-1.5 ${activeTab === 'admin_dashboard' ? 'bg-primary text-white shadow-sm' : 'text-slate-650 hover:text-primary'}`}
                >
                  <i className="fa-solid fa-gauge"></i>
                  <span>Dashboard Admin</span>
                </button>
              </div>
            ) : (
              <div className="flex bg-slate-100 border border-slate-200 p-0.5 sm:p-1 rounded-lg xs:rounded-xl sm:rounded-2xl">
                <button
                  onClick={() => { setActiveTab('landing'); setCheckoutActive(false); }}
                  className={`px-2 xs:px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md xs:rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1 sm:gap-1.5 ${activeTab === 'search' || activeTab === 'landing' ? 'bg-primary text-white shadow-sm' : 'text-slate-650 hover:text-primary'}`}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <span className="hidden xs:inline">{t.searchTickets}</span>
                </button>
                <button
                  onClick={() => { setActiveTab('history'); setCheckoutActive(false); }}
                  className={`px-2 xs:px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md xs:rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1 sm:gap-1.5 ${activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-slate-655 hover:text-primary'}`}
                >
                  <i className="fa-solid fa-ticket"></i>
                  <span className="hidden xs:inline">{t.myBookings}</span>
                  {bookingHistory.length > 0 && (
                    <span className="ml-0.5 xs:ml-1 sm:ml-1.5 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] bg-accent text-white rounded-full font-bold">{bookingHistory.length}</span>
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Language Switcher */}
              <div className="flex bg-slate-100 border border-slate-200 p-0.5 sm:p-1 rounded-md xs:rounded-lg sm:rounded-xl">
                <button onClick={() => setLang('id')} className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-[4px] xs:rounded-md sm:rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold transition ${lang === 'id' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}>
                  ID
                </button>
                <button onClick={() => setLang('en')} className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-[4px] xs:rounded-md sm:rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold transition ${lang === 'en' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}>
                  EN
                </button>
              </div>

              {/* Login/Profile info */}
              {currentUser ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={openProfileModal}
                    className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-755 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-xs transition"
                    title={lang === 'id' ? 'Ubah Profil' : 'Edit Profile'}
                  >
                    <i className="fa-solid fa-user-circle text-primary/70 text-sm"></i>
                    <div className="flex flex-col text-left">
                      <span className="hidden sm:inline">{currentUser.name} ({currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'operator' ? 'Operator' : 'User'})</span>
                    </div>
                    <i className="fa-solid fa-pen text-[9px] text-slate-400"></i>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 px-2 xs:px-3 py-1.5 sm:py-2 rounded-lg xs:rounded-xl text-[10px] sm:text-xs font-bold transition shadow-xs"
                    title="Logout"
                  >
                    <i className="fa-solid fa-right-from-bracket mr-1"></i>
                    <span className="hidden xs:inline">Keluar</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('login')}
                  className="bg-primary hover:bg-sky-850 text-white px-2.5 xs:px-3.5 py-1.5 sm:py-2 rounded-lg xs:rounded-xl text-[10px] sm:text-xs font-bold transition shadow-md shadow-sky-50 flex items-center gap-1"
                >
                  <i className="fa-solid fa-right-to-bracket text-[10px] sm:text-xs"></i>
                  <span>Masuk</span>
                </button>
              )}

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
              <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 mb-8 w-full max-w-[290px] xs:max-w-xs sm:max-w-md sm:w-max shadow-sm">
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
                <div className="flex-1 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-2 relative">

                  {/* Origin */}
                  <div className="w-full sm:flex-1 min-w-0">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'id' ? 'ASAL' : 'ORIGIN'}</label>
                    <CustomSelect
                      value={origin}
                      onChange={setOrigin}
                      options={locations}
                      icon="fa-solid fa-ship"
                    />
                  </div>

                  {/* Swap Button */}
                  <button
                    onClick={swapPorts}
                    className="absolute right-4 top-[42px] sm:relative sm:right-0 sm:top-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-100 transition flex items-center justify-center flex-shrink-0 sm:mb-2 shadow-sm z-10"
                  >
                    <i className="fa-solid fa-arrow-right-arrow-left text-xs rotate-90 sm:rotate-0"></i>
                  </button>

                  {/* Destination */}
                  <div className="w-full sm:flex-1 min-w-0">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'id' ? 'TUJUAN' : 'DESTINATION'}</label>
                    <CustomSelect
                      value={destination}
                      onChange={setDestination}
                      options={locations}
                      icon="fa-solid fa-location-dot"
                    />
                  </div>

                </div>

                {/* Dates */}
                <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4">

                  {/* Depart Date */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'id' ? 'BERANGKAT' : 'DEPART'}</label>
                    <CalendarSelect
                      value={selectedDate}
                      onChange={handleSelectedDateChange}
                      lang={lang}
                      icon="fa-regular fa-calendar"
                    />
                  </div>

                  {/* Return Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-1">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{lang === 'id' ? 'PULANG' : 'RETURN'}</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isRoundTrip}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsRoundTrip(checked);
                            if (checked && selectedReturnDate) {
                              setDateList(prev => {
                                if (prev.includes(selectedReturnDate)) return prev;
                                return [...prev, selectedReturnDate].sort((a, b) => parseDateStr(a, lang) - parseDateStr(b, lang));
                              });
                            }
                          }}
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
                    <CalendarSelect
                      value={selectedReturnDate}
                      onChange={handleSelectedReturnDateChange}
                      disabled={!isRoundTrip}
                      minDate={selectedDate}
                      lang={lang}
                      icon="fa-solid fa-rotate-left"
                    />
                  </div>

                </div>

                {/* Passengers & Search Button */}
                <div className="flex flex-col sm:grid sm:grid-cols-2 sm:items-end gap-3 sm:gap-4 xl:w-96 w-full">

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
                      <div className="absolute top-[calc(100%+8px)] left-0 w-[calc(100vw-64px)] sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] p-4 text-left">
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
                    className="w-full bg-accent hover:bg-orange-600 text-white rounded-xl py-2.5 xs:py-3 px-4 font-bold text-xs xs:text-sm tracking-wider uppercase transition shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
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
              <Suspense fallback={
                <div className="w-full h-48 sm:h-64 md:h-72 lg:h-64 flex items-center justify-center bg-slate-50 border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 mb-3 sm:mb-4">
                  <div className="flex flex-col items-center gap-2">
                    <i className="fa-solid fa-spinner animate-spin text-primary text-xl"></i>
                    <span className="text-xs font-bold text-slate-500">{lang === 'id' ? 'Memuat Peta...' : 'Loading Map...'}</span>
                  </div>
                </div>
              }>
                <InteractiveMap
                  origin={origin}
                  destination={destination}
                  mapSelectionStep={mapSelectionStep}
                  handleMapPortClick={handleMapPortClick}
                  swapPorts={swapPorts}
                  lang={lang}
                  t={t}
                />
              </Suspense>
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
              <button onClick={() => { if (dateCarouselRef.current) dateCarouselRef.current.scrollLeft -= 120; }} className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/80 transition shadow-sm flex-shrink-0 text-[10px] xs:text-xs sm:text-sm"><i className="fa-solid fa-chevron-left"></i></button>

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
                      onClick={() => isActiveReturn ? handleSelectedReturnDateChange(date) : handleSelectedDateChange(date)}
                      className={`flex flex-col items-center justify-center min-w-[68px] xs:min-w-[80px] sm:min-w-[100px] p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200 border ${disabled ? 'opacity-30 cursor-not-allowed bg-slate-50 border-slate-100 text-slate-350' :
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

              <button onClick={() => { if (dateCarouselRef.current) dateCarouselRef.current.scrollLeft += 120; }} className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/80 transition shadow-sm flex-shrink-0 text-[10px] xs:text-xs sm:text-sm"><i className="fa-solid fa-chevron-right"></i></button>
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
                    <button onClick={() => setCurrentSort("price")} className={`flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl text-[10px] xs:text-xs font-bold transition whitespace-nowrap border ${currentSort === "price" ? 'text-primary border-primary/20 bg-sky-50/50' : 'text-slate-500 border-transparent hover:text-slate-800'
                      }`}>
                      <span className={`w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full ${currentSort === "price" ? 'bg-primary' : 'bg-slate-350'}`}></span>
                      {t.cheapest}
                    </button>
                    <button onClick={() => setCurrentSort("speed")} className={`flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl text-[10px] xs:text-xs font-bold transition whitespace-nowrap border ${currentSort === "speed" ? 'text-primary border-primary/20 bg-sky-50/50' : 'text-slate-500 border-transparent hover:text-slate-800'
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

                          let isSalesClosed = false;
                          if (activeDate) {
                            const departureTime = getTicketDepartureDateTime(activeDate, ticket.departTime, lang);
                            const now = new Date();
                            const diffMs = departureTime.getTime() - now.getTime();
                            const diffHours = diffMs / (1000 * 60 * 60);
                            if (diffHours < 1) {
                              isSalesClosed = true;
                            }
                          }

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
                                    <div className="text-[10px] xs:text-xs font-semibold text-slate-550 mt-1">{isReturn ? destination : origin}</div>
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
                                    <div className="text-[10px] xs:text-xs font-semibold text-slate-550 mt-1">{isReturn ? origin : destination}</div>
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
                                    {isSalesClosed ? (
                                      <span className="flex-1 xs:flex-none text-center bg-slate-100 border border-slate-200 text-slate-400 rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wide cursor-not-allowed select-none">
                                        {lang === 'id' ? 'Ditutup' : 'Closed'}
                                      </span>
                                    ) : (
                                      <button onClick={() => handleSelectTicket(ticket)} className="flex-1 xs:flex-none text-center bg-primary hover:bg-sky-800 text-white rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wide transition shadow-md shadow-sky-100/50">
                                        {isReturn ? t.selectReturn : t.selectTicket}
                                      </button>
                                    )}
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
                                ? 'Tidak ada speedboat yang cocok dengan kriteria filter Anda. Coba sesuaikan jam keberangkatan atau jenis speedboat.'
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
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${booking.paymentStatus === 'DIBATALKAN' ? 'bg-rose-100 text-rose-600' :
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
                      {booking.paymentStatus === 'MENUNGGU PEMBAYARAN' ? (
                        <>
                          <button
                            onClick={() => checkPaymentStatus(booking.bookingId)}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-[10px] sm:text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-100"
                          >
                            <i className="fa-solid fa-rotate animate-spin-slow"></i>
                            {lang === 'id' ? 'Cek Status' : 'Check Status'}
                          </button>
                          <button
                            onClick={() => { setLastBookingResult(booking); setIsSuccessModalOpen(true); }}
                            className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <i className="fa-solid fa-circle-info text-amber-550"></i>
                            {lang === 'id' ? 'Detail' : 'Detail'}
                          </button>
                        </>
                      ) : booking.paymentStatus === 'LUNAS' ? (
                        <>
                          <button
                            onClick={() => { setLastBookingResult(booking); setIsSuccessModalOpen(true); }}
                            className="flex-1 bg-slate-50 border border-slate-200 hover:bg-sky-50/50 hover:border-primary/20 text-primary py-2.5 rounded-xl font-bold text-[10px] sm:text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <i className="fa-solid fa-qrcode"></i>
                            {t.showBoardingPass}
                          </button>
                          <button
                            onClick={() => setSelectedManifestBooking(booking)}
                            className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <i className="fa-solid fa-clipboard-list"></i>
                            Manifest
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setLastBookingResult(booking); setIsSuccessModalOpen(true); }}
                            className="flex-1 bg-slate-50 border border-rose-200 hover:bg-rose-50/50 text-rose-500 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            {lang === 'id' ? 'Detail' : 'Detail'}
                          </button>
                          <button
                            onClick={() => setSelectedManifestBooking(booking)}
                            className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <i className="fa-solid fa-clipboard-list"></i>
                            Manifest
                          </button>
                        </>
                      )}
                    </div>

                    {booking.paymentStatus !== "DIBATALKAN" && booking.paymentStatus !== "GAGAL" && (
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
          <div className="fixed inset-0 bg-slate-900/40 z-[120] flex items-end transition-duration-300 backdrop-blur-sm">
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
                        <button key={type} onClick={() => handleTypeToggle(type)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${active ? 'border-primary bg-sky-50/50 text-primary' : 'border-slate-200 text-slate-600'
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
                            onChange={(e) => {
                              const val = e.target.value;
                              setBuyerName(val);
                              setPassengersData(prev => {
                                if (!prev.length) return prev;
                                const updated = [...prev];
                                updated[0].name = val;
                                return updated;
                              });
                            }}
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
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
                        <h4 className="font-extrabold text-slate-800 text-sm tracking-wide">{t.passengerData}</h4>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Adults Control */}
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
                            <span className="font-semibold text-slate-500 ml-2 mr-1">{lang === 'id' ? 'Dewasa' : 'Adult'}</span>
                            <button type="button" onClick={() => updatePassengerCount('adults', -1)} className="w-6 h-6 rounded bg-white border border-slate-200 hover:border-primary hover:text-primary transition flex items-center justify-center shadow-sm">
                              <i className="fa-solid fa-minus text-[10px]"></i>
                            </button>
                            <span className="font-bold text-slate-800 min-w-[12px] text-center">{adults}</span>
                            <button type="button" onClick={() => updatePassengerCount('adults', 1)} className="w-6 h-6 rounded bg-white border border-slate-200 hover:border-primary hover:text-primary transition flex items-center justify-center shadow-sm">
                              <i className="fa-solid fa-plus text-[10px]"></i>
                            </button>
                          </div>
                          
                          {/* Kids Control */}
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
                            <span className="font-semibold text-slate-500 ml-2 mr-1">{lang === 'id' ? 'Anak' : 'Child'}</span>
                            <button type="button" onClick={() => updatePassengerCount('kids', -1)} className="w-6 h-6 rounded bg-white border border-slate-200 hover:border-primary hover:text-primary transition flex items-center justify-center shadow-sm">
                              <i className="fa-solid fa-minus text-[10px]"></i>
                            </button>
                            <span className="font-bold text-slate-800 min-w-[12px] text-center">{kids}</span>
                            <button type="button" onClick={() => updatePassengerCount('kids', 1)} className="w-6 h-6 rounded bg-white border border-slate-200 hover:border-primary hover:text-primary transition flex items-center justify-center shadow-sm">
                              <i className="fa-solid fa-plus text-[10px]"></i>
                            </button>
                          </div>

                          {/* Infants Control */}
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
                            <span className="font-semibold text-slate-500 ml-2 mr-1">{lang === 'id' ? 'Bayi' : 'Infant'}</span>
                            <button type="button" onClick={() => updatePassengerCount('infants', -1)} className="w-6 h-6 rounded bg-white border border-slate-200 hover:border-primary hover:text-primary transition flex items-center justify-center shadow-sm">
                              <i className="fa-solid fa-minus text-[10px]"></i>
                            </button>
                            <span className="font-bold text-slate-800 min-w-[12px] text-center">{infants}</span>
                            <button type="button" onClick={() => updatePassengerCount('infants', 1)} className="w-6 h-6 rounded bg-white border border-slate-200 hover:border-primary hover:text-primary transition flex items-center justify-center shadow-sm">
                              <i className="fa-solid fa-plus text-[10px]"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-5">
                        {passengersData.map((p, idx) => {
                          if (p.isInfant) return null;
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
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="lg:col-span-2">
                                  <input
                                    type="text"
                                    value={p.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handlePassengerChange('name', val);
                                      if (idx === 0) {
                                        setBuyerName(val);
                                      }
                                    }}
                                    placeholder={t.passengerNamePlaceholder}
                                    className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-medium transition shadow-sm"
                                  />
                                </div>
                                <div className="lg:col-span-1">
                                  <CustomSelect
                                    value={p.gender || "L"}
                                    onChange={(val) => handlePassengerChange('gender', val)}
                                    options={[
                                      { value: "L", label: "Laki-laki" },
                                      { value: "P", label: "Perempuan" }
                                    ]}
                                  />
                                </div>
                                <div className="lg:col-span-1">
                                  <input
                                    type="number"
                                    value={p.age || ""}
                                    onChange={(e) => handlePassengerChange('age', e.target.value)}
                                    placeholder="Usia"
                                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-medium transition shadow-sm h-10 xs:h-12"
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
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${p.seatOutbound ? 'bg-primary border-sky-600 text-white shadow-sm hover:bg-sky-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
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
                                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${p.seatReturn ? 'bg-accent border-orange-600 text-white shadow-sm hover:bg-orange-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
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

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col items-center">

              {/* Boat Front/Cockpit */}
              <div className="w-56 h-10 border border-slate-200/80 rounded-t-[40px] flex items-center justify-center relative bg-white mt-2 mb-6">
                <span className="text-[8px] font-black text-slate-450 tracking-[0.2em] uppercase">KEMUDI SPEEDBOAT</span>
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>

              {/* Grid layout */}
              <div className="w-full max-w-[280px] space-y-2">

                {/* Visual Legend */}
                <div className="flex justify-center items-center gap-5 text-[9px] font-bold text-slate-400 uppercase mb-5 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded border-2 border-sky-500 bg-white block"></span>
                    <span>PILIH</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-white border border-slate-200 block"></span>
                    <span>TERSEDIA</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-[#F8FAFC] block border border-transparent"></span>
                    <span>TERISI</span>
                  </div>
                </div>

                {(() => {
                  const activeTicket = activeSeatSelectingType === 'outbound' ? selectedOutboundTicket : selectedReturnTicket;
                  const totalRows = activeTicket?.seatRows || 8;
                  const totalCols = activeTicket?.seatCols || 4;
                  
                  const colLetters = Array.from({length: totalCols}, (_, i) => String.fromCharCode(65 + i));
                  const mid = Math.ceil(totalCols / 2);
                  const leftCols = colLetters.slice(0, mid);
                  const rightCols = colLetters.slice(mid);
                  const seatColsLayout = [leftCols, rightCols];

                  return (
                    <div className="space-y-2.5">
                      {Array.from({ length: totalRows }, (_, rIdx) => {
                        const rowNum = rIdx + 1;
                        const ticketId = activeTicket.id;
                        const activeDate = activeSeatSelectingType === 'outbound' ? selectedDate : selectedReturnDate;

                        const occupiedList = getOccupiedSeats(ticketId, activeDate);
                        const seatField = activeSeatSelectingType === 'outbound' ? 'seatOutbound' : 'seatReturn';
                        const activePassengerSeat = passengersData[activeSeatPassengerIdx]?.[seatField];

                        return (
                          <div key={rowNum} className="flex justify-between items-center">
                            {/* Left Group */}
                            <div className="flex gap-2">
                              {seatColsLayout[0].map(col => {
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
                                      isSelected 
                                        ? 'bg-white border-2 border-sky-500 text-slate-800 shadow-sm font-black' 
                                        : (isOccupied || isTaken) 
                                          ? 'bg-slate-50 border-transparent text-slate-200 cursor-not-allowed select-none font-medium' 
                                          : 'bg-white border-slate-200 text-slate-650 hover:border-slate-400 font-medium'
                                    }`}
                                  >
                                    {seatCode}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Middle Column Row Number */}
                            <div className="text-[10px] font-black text-slate-400 select-none px-2.5 w-6 text-center">{rowNum}</div>

                            {/* Right Group */}
                            <div className="flex gap-2">
                              {seatColsLayout[1].map(col => {
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
                                      isSelected 
                                        ? 'bg-white border-2 border-sky-500 text-slate-800 shadow-sm font-black' 
                                        : (isOccupied || isTaken) 
                                          ? 'bg-slate-50 border-transparent text-slate-200 cursor-not-allowed select-none font-medium' 
                                          : 'bg-white border-slate-200 text-slate-650 hover:border-slate-400 font-medium'
                                    }`}
                                  >
                                    {seatCode}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Corridor Label inside list */}
                      <div className="flex justify-center pt-3 pb-1">
                        <span className="text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase select-none">
                          KORIDOR
                        </span>
                      </div>
                    </div>
                  );
                })()}

              </div>

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
            onClose={() => setIsSearchModalOpen(false)}
            onSave={executeSearchChange}
            t={t}
            lang={lang}
          />
        </div>
      )}

      {/* Success Modal & Boarding Pass */}
      {isSuccessModalOpen && lastBookingResult && (
        <div className="fixed inset-0 bg-slate-900/60 z-[140] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            
            {/* Scrollable Content Area */}
            <div className="p-6 overflow-y-auto text-center flex-1 min-h-0 pb-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm ${
                (lastBookingResult.paymentStatus === 'DIBATALKAN' || lastBookingResult.paymentStatus === 'GAGAL')
                  ? 'bg-rose-100 text-rose-500'
                  : lastBookingResult.paymentStatus === 'MENUNGGU PEMBAYARAN'
                    ? 'bg-amber-100 text-amber-500 animate-pulse'
                    : 'bg-emerald-100 text-emerald-500'
              }`}>
                <i className={`fa-solid ${
                  (lastBookingResult.paymentStatus === 'DIBATALKAN' || lastBookingResult.paymentStatus === 'GAGAL')
                    ? 'fa-xmark'
                    : lastBookingResult.paymentStatus === 'MENUNGGU PEMBAYARAN'
                      ? 'fa-clock'
                      : 'fa-circle-check'
                }`}></i>
              </div>

              <h3 className="font-extrabold text-slate-900 text-lg mb-1">
                {lastBookingResult.paymentStatus === 'DIBATALKAN'
                  ? (lang === 'id' ? 'Pemesanan Dibatalkan' : 'Booking Cancelled')
                  : lastBookingResult.paymentStatus === 'GAGAL'
                    ? (lang === 'id' ? 'Pembayaran Gagal' : 'Payment Failed')
                    : lastBookingResult.paymentStatus === 'MENUNGGU PEMBAYARAN'
                      ? (lang === 'id' ? 'Menunggu Pembayaran' : 'Pending Payment')
                      : t.ticketOrdered
                }
              </h3>
              <p className="text-xs text-slate-550 mb-6 font-medium">
                {lastBookingResult.paymentStatus === 'DIBATALKAN'
                  ? (lang === 'id' ? 'Pemesanan ini telah dibatalkan.' : 'This booking has been cancelled.')
                  : lastBookingResult.paymentStatus === 'GAGAL'
                    ? (lang === 'id' ? 'Transaksi pembayaran Anda gagal atau tidak dapat diproses.' : 'Your payment transaction failed or could not be processed.')
                    : lastBookingResult.paymentStatus === 'MENUNGGU PEMBAYARAN'
                      ? (lang === 'id' ? 'Selesaikan pembayaran Anda untuk menerbitkan E-Ticket.' : 'Complete your payment to issue your E-Ticket.')
                      : t.ticketSuccessDesc
                }
              </p>

              {/* Countdown Timer */}
              {lastBookingResult.paymentStatus === 'LUNAS' && (
                <div className="mb-6 text-left">
                  <CountdownTimer
                    departureDate={lastBookingResult.outboundDate}
                    departureTime={lastBookingResult.outboundTicket.departTime}
                    routeLabel={`${lastBookingResult.origin} ➔ ${lastBookingResult.destination}`}
                    vesselName={lastBookingResult.outboundTicket.operator}
                  />
                </div>
              )}

              {/* Passes Wrapper */}
              {lastBookingResult.paymentStatus === 'LUNAS' ? (
                <div className="space-y-6 py-1">

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
                        {generateQRCodeSVG(`${lastBookingResult.bookingId}_OUTBOUND_${lastBookingResult.passengers.map(p => p.seatOutbound).join('_')}`)}
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
                          {generateQRCodeSVG(`${lastBookingResult.bookingId}_RETURN_${lastBookingResult.passengers.map(p => p.seatReturn).join('_')}`)}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="mb-6 p-6 rounded-2xl bg-slate-50 border border-slate-200/60 text-slate-500 text-xs font-medium space-y-3 shadow-inner">
                  <div className="flex justify-center text-4xl mb-1">
                    <i className={`fa-solid ${
                      lastBookingResult.paymentStatus === 'MENUNGGU PEMBAYARAN' 
                        ? 'fa-wallet text-amber-500' 
                        : 'fa-triangle-exclamation text-rose-500'
                    }`}></i>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-semibold">
                    {lastBookingResult.paymentStatus === 'MENUNGGU PEMBAYARAN' ? (
                      lang === 'id'
                        ? 'E-Ticket dan Boarding Pass belum diterbitkan karena pembayaran belum selesai. Anda dapat memeriksa status pembayaran di menu "Tiket Saya" setelah menyelesaikan pembayaran.'
                        : 'E-Ticket and Boarding Pass have not been issued because payment is not completed. You can check the payment status in the "My Bookings" menu after completing your payment.'
                    ) : (
                      lang === 'id'
                        ? 'E-Ticket dan Boarding Pass tidak tersedia karena pemesanan gagal atau telah dibatalkan.'
                        : 'E-Ticket and Boarding Pass are not available because the booking failed or was cancelled.'
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50">
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
                className="w-full bg-primary hover:bg-sky-850 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wide transition shadow-md shadow-sky-100/60"
              >
                {t.backHome}
              </button>
            </div>

          </div>
        </div>
      )}

      <PassengerManifest booking={selectedManifestBooking} onClose={() => setSelectedManifestBooking(null)} />
      <CancellationModal booking={selectedCancelBooking} onClose={() => setSelectedCancelBooking(null)} onConfirm={handleCancelBooking} />

      {/* Edit Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-[150] flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-[28px] w-full max-w-md shadow-2xl p-6 animate-scale-up relative overflow-hidden">
            {/* Top decorative color band */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-sky-500 to-accent"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/10 to-sky-500/10 flex items-center justify-center text-primary text-xl shadow-inner border border-primary/5">
                <i className="fa-solid fa-user-pen"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-900 text-base tracking-wide leading-tight">
                  {lang === 'id' ? 'Ubah Profil Anda' : 'Edit Your Profile'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  {lang === 'id' ? 'Perbarui informasi kontak & akun Anda' : 'Update your contact & account information'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider transition-colors duration-200">
                  {lang === 'id' ? 'Nama Lengkap' : 'Full Name'}
                </label>
                <div className="relative text-slate-400 focus-within:text-primary transition-colors duration-200">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors duration-200">
                    <i className="fa-regular fa-user"></i>
                  </span>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder={lang === 'id' ? 'Nama sesuai kartu identitas' : 'Name as on ID card'}
                    className="w-full border border-slate-200/80 bg-slate-50/40 focus:bg-white rounded-xl pl-11 pr-4 py-3 text-xs xs:text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-semibold transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider transition-colors duration-200">
                  {lang === 'id' ? 'Nomor Handphone' : 'Phone Number'}
                </label>
                <div className="relative text-slate-400 focus-within:text-primary transition-colors duration-200">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors duration-200">
                    <i className="fa-solid fa-phone"></i>
                  </span>
                  <input
                    type="text"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 08123456789"
                    className="w-full border border-slate-200/80 bg-slate-50/40 focus:bg-white rounded-xl pl-11 pr-4 py-3 text-xs xs:text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-semibold transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider transition-colors duration-200">
                  {lang === 'id' ? 'Usia (Tahun)' : 'Age (Years)'}
                </label>
                <div className="relative text-slate-400 focus-within:text-primary transition-colors duration-200">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors duration-200">
                    <i className="fa-solid fa-cake-candles"></i>
                  </span>
                  <input
                    type="text"
                    required
                    value={profileAge}
                    onChange={(e) => setProfileAge(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 28"
                    className="w-full border border-slate-200/80 bg-slate-50/40 focus:bg-white rounded-xl pl-11 pr-4 py-3 text-xs xs:text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-semibold transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all duration-200"
                >
                  {lang === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-sky-500 hover:from-sky-550 hover:to-primary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all duration-200 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20"
                >
                  {lang === 'id' ? 'Simpan' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmPurchaseModal.isOpen} 
        onClose={() => setConfirmPurchaseModal({ isOpen: false, ticket: null, isReturn: false, activeDate: null })}
        onConfirm={() => {
          finalizeSelectTicket(confirmPurchaseModal.ticket, confirmPurchaseModal.isReturn, confirmPurchaseModal.activeDate);
        }}
        title={lang === 'id' ? "Konfirmasi Pemesanan" : "Booking Confirmation"}
        message={confirmPurchaseModal.message}
        confirmText={lang === 'id' ? "Ya, Beli" : "Yes, Purchase"}
        cancelText={lang === 'id' ? "Batal" : "Cancel"}
        isDestructive={false}
      />
    </div>
  );
}

// SearchConfigModal and LoginPage were moved to separate components.
