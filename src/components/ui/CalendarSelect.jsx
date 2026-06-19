import { useState, useMemo, useEffect } from 'react';
import { parseDateStr, formatDateToStr } from '../../lib/helpers';

export default function CalendarSelect({ value, onChange, minDate, lang, icon, disabled, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const parsedValue = useMemo(() => parseDateStr(value, lang), [value, lang]);
  
  const [viewDate, setViewDate] = useState(() => parsedValue);

  // Sync viewDate when value or lang changes
  useEffect(() => {
    setViewDate(parsedValue);
  }, [parsedValue]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  }, []);

  const parsedMinDate = useMemo(() => {
    if (!minDate) return today;
    let d;
    if (typeof minDate === 'string') {
      d = parseDateStr(minDate, lang);
    } else {
      d = new Date(minDate);
    }
    d.setHours(0,0,0,0);
    return d < today ? today : d;
  }, [minDate, lang, today]);

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthYearLabel = useMemo(() => {
    const year = viewDate.getFullYear();
    const months = lang === 'id' 
      ? ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[viewDate.getMonth()]} ${year}`;
  }, [viewDate, lang]);

  const daysInMonthGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const grid = [];
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      grid.push(new Date(year, month, day));
    }
    return grid;
  }, [viewDate]);

  const weekdays = lang === 'id' 
    ? ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className={`relative ${isOpen ? 'z-[100]' : 'z-10'} w-full`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isOpen) {
            setViewDate(parsedValue);
          }
          setIsOpen(!isOpen);
        }}
        className={`w-full border border-slate-200 bg-white rounded-xl ${icon ? 'pl-8 xs:pl-10' : 'px-3'} pr-4 py-2.5 xs:py-3 text-xs xs:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary flex items-center justify-between cursor-pointer transition select-none disabled:bg-slate-50/50 disabled:text-slate-300 disabled:cursor-not-allowed text-left h-10 xs:h-12`}
      >
        <span className="truncate">{value || placeholder}</span>
        <span className="text-slate-400 text-[10px] xs:text-xs ml-1 flex-shrink-0">
          <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        </span>
      </button>

      {/* Left Icon overlay */}
      {icon && (
        <span className="absolute left-2.5 xs:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs xs:text-sm pointer-events-none">
          <i className={icon}></i>
        </span>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[140]" onClick={() => setIsOpen(false)}></div>

          {/* Calendar Picker Panel */}
          <div className="absolute top-[calc(100%+6px)] left-0 sm:left-auto sm:right-0 w-[290px] sm:w-[320px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[150] p-4 animate-scale-up">
            
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-3">
              <button 
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <span className="font-extrabold text-xs sm:text-sm text-slate-800">{monthYearLabel}</span>
              <button 
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition"
              >
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>

            {/* Weekdays row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {weekdays.map((wd, i) => (
                <span key={i} className={`text-[10px] font-extrabold uppercase ${i === 0 || i === 6 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {wd}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonthGrid.map((dateObj, idx) => {
                if (!dateObj) {
                  return <div key={`empty-${idx}`} className="w-8 h-8 sm:w-10 sm:h-10"></div>;
                }

                const d = new Date(dateObj);
                d.setHours(0,0,0,0);
                const isSelected = d.getTime() === parsedValue.getTime();
                const isToday = d.getTime() === today.getTime();
                const isPastOrDisabled = d < parsedMinDate;

                const dayNum = d.getDate();

                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={isPastOrDisabled}
                    onClick={() => {
                      onChange(formatDateToStr(d, lang));
                      setIsOpen(false);
                    }}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs font-bold transition flex items-center justify-center relative ${
                      isSelected 
                        ? 'bg-accent text-white shadow-md shadow-orange-100' 
                        : isPastOrDisabled 
                          ? 'opacity-25 cursor-not-allowed text-slate-400' 
                          : isToday 
                            ? 'bg-sky-50 border border-primary/20 text-primary' 
                            : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
